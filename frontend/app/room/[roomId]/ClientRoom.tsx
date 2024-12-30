"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";

interface Props {
    roomId: string;
}
// let i = 0;
/**
 * This component is responsible for:
 * - Connecting to the WebSocket
 * - Handling joinRoom, newUser, offer, answer, iceCandidate
 * - Maintaining RTCPeerConnection(s)
 * - Displaying local/remote streams
 */

export default function ClientRoom({ roomId }: Props) {
    const searchParams = useSearchParams();
    const userId = searchParams.get("userId") || "";

    const localVideoRef = useRef<HTMLVideoElement>(null);

    // Store local stream (our camera or mic), State for triggering re-renders when necessary
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);

    // A map of "remoteUserId" => RTCPeerConnection
    const [peers] = useState<Map<string, RTCPeerConnection>>(() => new Map());

    // Ref for storing the local stream
    const localStreamRef = useRef<MediaStream | null>(null);

    const [pendingCandidates, setPendingCandidates] = useState<{
        [userId: string]: {
            candidates: RTCIceCandidateInit[];
            resolveConnection?: () => void;
        };
    }>({});

    const remoteStreamsRef = useRef<Record<string, MediaStream>>({});
    const [remoteStreamsKeys, setRemoteStreamsKeys] = useState<string[]>([]);

    const [candidateBuffer, setCandidateBuffer] = useState<{
        [userId: string]: RTCIceCandidateInit[];
    }>({});

    // Memoized stream selection to prevent repeated prompts
    const getLocalVideoTracks = useCallback(async () => {
        try {
            console.log("Getting local media stream...");
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    displaySurface: "browser",
                },
                audio: false,
            });
            if (stream) {
                console.log("Local stream acquired:", stream);
                // Attach stream to the local video element
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
                // Update both the ref and the state
                localStreamRef.current = stream;
                // Save stream to state for use in WebRTC connections
                setLocalStream(stream);
            } else {
                console.warn("No local stream available");
            }

            return stream;
        } catch (error) {
            console.error("Error getting local video tracks:", error);
            return null;
        }
    }, []); // Empty dependency array ensures this is only created once

    function addRemoteStream(userId: string, track: MediaStreamTrack) {
        if (!remoteStreamsRef.current[userId]) {
            remoteStreamsRef.current[userId] = new MediaStream();
        }
        remoteStreamsRef.current[userId].addTrack(track);
        setRemoteStreamsKeys(Object.keys(remoteStreamsRef.current));
    }

    function addTracksAfterICEGathering(pc: RTCPeerConnection) {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
                const existingSenders = pc.getSenders().map((sender) => sender.track);
                if (!existingSenders.includes(track)) {
                    console.log(`Adding local track (${track.kind}) to PeerConnection`);
                    pc.addTrack(track, localStreamRef.current!);
                } else {
                    console.log(`Track (${track.kind}) already added to PeerConnection`);
                }
            });
        } else {
            console.warn("No local stream available to attach tracks.");
        }
    }

    useEffect(() => {
        const initializeConnection = async () => {
            try {
                // Get local media stream
                console.log("Getting local media stream...");
                // Ensure local stream is acquired
                await getLocalVideoTracks();
                console.log("double checking ", localStreamRef.current);

                // Set up WebSocket connection
                const ws = new WebSocket("ws://localhost:8080");

                ws.onopen = () => {
                    console.log("WebSocket connected");
                    const joinMessage = { type: "joinRoom", roomId, userId };
                    // console.log("Sending join message:", joinMessage);
                    ws.send(JSON.stringify(joinMessage));
                };

                ws.onmessage = async (event) => {
                    const message = JSON.parse(event.data);
                    console.log("Received message:", message);

                    switch (message.type) {
                        case "joinedRoom":
                            console.log("Successfully joined room:", message);
                            break;

                        case "newUser":
                            // console.log("New user joined, creating offer:", message.fromUserId);
                            await handleNewUser(message.fromUserId, ws);
                            break;

                        case "createOffer":
                            // console.log("Received offer from:", message.fromUserId);
                            await handleOffer(
                                message.fromUserId,
                                message.toUserId,
                                message.sdp,
                                ws
                            );
                            break;

                        case "createAnswer":
                            // console.log("Received answer from:", message.fromUserId);
                            await handleAnswer(
                                message.fromUserId,
                                message.toUserId,
                                message.sdp,
                                ws
                            );
                            break;

                        case "iceCandidate":
                            // console.log("Received ICE candidate from:", message.fromUserId);
                            await handleIceCandidate(
                                message.fromUserId,
                                message.toUserId,
                                message.candidate,
                                ws
                            );
                            break;

                        case "userLeft":
                            console.log("User left:", message.userId);
                            handleUserLeft(message.userId);
                            break;

                        default:
                            console.warn("Unknown message type:", message.type);
                    }
                };

                ws.onerror = (error) => {
                    console.error("WebSocket error:", error);
                };

                ws.onclose = () => {
                    console.error("WebSocket disconnected unexpectedly");
                };

                return () => {
                    ws.close();
                    // if (stream) {
                    //     stream.getTracks().forEach((track) => track.stop());
                    // }
                    // peers.forEach((peer) => {
                    //     peer.close();
                    // });
                    // peers.clear();

                    // Stop all tracks in the local stream
                    if (localStreamRef.current) {
                        localStreamRef.current
                            .getTracks()
                            .forEach((track) => track.stop());
                    }
                };
            } catch (error) {
                console.error("Error initializing connection:", error);
            }
        };

        initializeConnection();
    }, [userId, roomId, getLocalVideoTracks]);

    const sendMessage = (ws: WebSocket, message: any) => {
        if (ws.readyState !== WebSocket.OPEN) {
            console.error(
                "WebSocket is not open. Cannot send message:",
                message
            );
            return;
        }

        try {
            const messageStr = JSON.stringify(message);
            // console.log("Sending WebSocket message:", messageStr);
            ws.send(messageStr);
        } catch (err) {
            console.error("Error sending message:", err);
        }
    };

    async function handleNewUser(remoteUserId: string, ws: WebSocket) {
        try {
            if (peers.has(remoteUserId)) {
                console.warn(
                    `PeerConnection already exists for user: ${remoteUserId}`
                );
                return peers.get(remoteUserId)!;
            }

            console.log("Creating peer connection for:", remoteUserId);

            if (peers.has(remoteUserId)) {
                return peers.get(remoteUserId);
            }

            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" },
                    { urls: "stun:stun1.l.google.com:19302" },
                ],
            });
            peers.set(remoteUserId, pc);

            // Attach local stream to the PeerConnection
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => {
                    console.log(
                        `Adding local track (${track.kind}) to PeerConnection`
                    );
                    pc.addTrack(track, localStreamRef.current);
                });
            } else {
                console.warn("No local stream available to attach tracks.");
            }

            pc.onnegotiationneeded = async () => {
                try {
                    console.log("Negotiation needed for:", remoteUserId);

                    console.log("Creating offer...");
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);

                    const message = {
                        type: "createOffer",
                        fromUserId: userId,
                        toUserId: remoteUserId,
                        sdp: offer,
                    };

                    console.log("Sending negotiation offer:", message);
                    sendMessage(ws, message);
                } catch (err) {
                    console.error("Error during negotiation:", err);
                }
            };

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log("Sending ICE candidate:", event.candidate);
                    const candidateMessage = {
                        type: "iceCandidate",
                        fromUserId: userId,
                        toUserId: remoteUserId,
                        candidate: event.candidate,
                    };
                    sendMessage(ws, candidateMessage);
                } else {
                    console.log("All ICE candidates sent.");
                }
            };

            pc.ontrack = (event) => {
                console.log(
                    `Received track from ${remoteUserId}:`,
                    event.track
                );
                addRemoteStream(remoteUserId, event.track);

                // Debugging the MediaStream
                const stream = remoteStreamsRef.current[remoteUserId];
                console.log("Tracks in the remote stream:", stream.getTracks());
                stream.getTracks().forEach((track) => {
                    console.log(
                        `Track kind: ${track.kind}, readyState: ${track.readyState}`
                    );
                });

                // Update the keys to re-render RemoteVideo components
                setRemoteStreamsKeys(Object.keys(remoteStreamsRef.current));
                console.log(
                    `Added the remote stream received from ${remoteUserId} -- ${event.track} --`,
                    remoteStreamsRef.current[remoteUserId]
                );
            };

            pc.onconnectionstatechange = () => {
                console.log(
                    `Connection state for ${remoteUserId}:`,
                    pc.connectionState
                );
            };

            pc.onicegatheringstatechange = () => {
                console.log("ICE Gathering State:", pc.iceGatheringState);
            };

            pc.oniceconnectionstatechange = () => {
                console.log(
                    `ICE Connection State for ${remoteUserId}:`,
                    pc.iceConnectionState
                );
                if (pc.iceConnectionState === "connected") {
                    console.log("ICE connection established. Adding tracks (if needed).");
                    addTracksAfterICEGathering(pc);
                }
            };

            // Check track addition on both sides
            const logPeerConnectionTracks = () => {
                const senders = pc.getSenders();
                const receivers = pc.getReceivers();
                
                console.log('Peer Connection Tracks:', {
                senders: senders.map(sender => ({
                    track: sender.track?.kind,
                    trackId: sender.track?.id
                })),
                receivers: receivers.map(receiver => ({
                    track: receiver.track?.kind,
                    trackId: receiver.track?.id
                }))
                });
            }
            
            pc.ontrack = (event) => {
                console.log(
                    `Received track from -- ${remoteUserId}:`,
                    event.track
                );
                addRemoteStream(remoteUserId, event.track);
                logPeerConnectionTracks();
                // Update the keys to re-render RemoteVideo components
                setRemoteStreamsKeys(Object.keys(remoteStreamsRef.current));
            };
  
        } catch (err) {
            console.error("Error in handleNewUser:", err);
        }
    }

    async function handleOffer(
        remoteUserId: string,
        toUserId: string,
        offer: RTCSessionDescriptionInit,
        ws: WebSocket
    ) {
        try {
            console.log(
                "Handling offer from",
                remoteUserId,
                " and Creating peer connection with ",
                "Offer:",
                offer
            );

            if (peers.has(remoteUserId)) {
                return peers.get(remoteUserId);
            }

            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" },
                    { urls: "stun:stun1.l.google.com:19302" },
                ],
            });
            peers.set(remoteUserId, pc);

            // Attach local tracks
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => {
                    console.log(
                        `Adding local track (${track.kind}) to PeerConnection`
                    );
                    pc.addTrack(track, localStreamRef.current!);
                });
            }

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log("Sending ICE candidate:", event.candidate);
                    const candidateMessage = {
                        type: "iceCandidate",
                        fromUserId: userId,
                        toUserId: remoteUserId,
                        candidate: event.candidate,
                    };
                    sendMessage(ws, candidateMessage);
                } else {
                    console.log("All ICE candidates sent.");
                }
            };

            await pc.setRemoteDescription(offer);
            console.log("Successfully set remote description", remoteUserId);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            const message = {
                type: "createAnswer",
                fromUserId: userId,
                toUserId: remoteUserId,
                sdp: answer,
            };
            // console.log("Sending answer message:", message);
            sendMessage(ws, message);


            pc.onconnectionstatechange = () => {
                console.log(
                    `Connection state for : ${remoteUserId}:`,
                    pc.connectionState
                );
            };

            pc.onicegatheringstatechange = () => {
                console.log("ICE Gathering State:", pc.iceGatheringState);
            };

            // Add tracks only after ICE gathering is complete
            pc.oniceconnectionstatechange = () => {
                console.log(
                    `ICE Connection State for ${toUserId}:`,
                    pc.iceConnectionState
                );
                if (pc.iceConnectionState === "connected") {
                    addTracksAfterICEGathering(pc);
                }
            };

            // Check track addition on both sides
            const logPeerConnectionTracks = () => {
                const senders = pc.getSenders();
                const receivers = pc.getReceivers();
                
                console.log('Peer Connection Tracks:', {
                senders: senders.map(sender => ({
                    track: sender.track?.kind,
                    trackId: sender.track?.id
                })),
                receivers: receivers.map(receiver => ({
                    track: receiver.track?.kind,
                    trackId: receiver.track?.id
                }))
                });
            }
            
            pc.getReceivers().forEach((receiver) => {
                const track = receiver.track;
                console.log("Received track:", track);
                addRemoteStream(remoteUserId, track);
                logPeerConnectionTracks();
                // Update the keys to re-render RemoteVideo components
                setRemoteStreamsKeys(Object.keys(remoteStreamsRef.current));
            });

        } catch (err) {
            console.error("Error in handleOffer:", err);
        }
    }

    async function handleAnswer(
        fromUserId: string,
        toUserId: string,
        answer: RTCSessionDescriptionInit,
        ws: WebSocket
    ) {
        try {
            console.log(
                "Handling answer from:",
                fromUserId,
                "to:",
                toUserId,
                "Answer:",
                answer
            );

            const pc = peers.get(fromUserId);
            if (!pc) {
                console.error("No PeerConnection found for user:", fromUserId);
                return;
            }

            await pc.setRemoteDescription(answer);
            console.log(
                `Remote description set for ${fromUserId} -- ${pc.getConfiguration()}`
            );

            // Process buffered ICE candidates
            const bufferedCandidates = candidateBuffer[fromUserId] || [];
            for (const candidate of bufferedCandidates) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    console.log(`Added buffered ICE candidate:`, candidate);
                } catch (err) {
                    console.error("Error adding buffered ICE candidate:", err);
                }
            }

            // Clear the buffer for this user
            setCandidateBuffer((prev) => {
                const updated = { ...prev };
                delete updated[fromUserId];
                return updated;
            });

            processPendingCandidates(fromUserId);

            
        } catch (err) {
            console.error("Error in handleAnswer:", err);
        }
    }

    function processPendingCandidates(toUserId: string) {
        const pc = peers.get(toUserId);
        if (!pc) {
            console.warn(`No PeerConnection found for user: ${toUserId}`);
            return;
        }

        if (pendingCandidates[toUserId]?.candidates.length > 0) {
            console.log(
                `Processing ${pendingCandidates[toUserId].candidates.length} pending ICE candidates for ${toUserId}`
            );

            // for (const candidate of pendingCandidates[toUserId].candidates) {
            //     try {
            //         pc.addIceCandidate(new RTCIceCandidate(candidate));
            //         console.log("Added pending ICE candidate:", candidate);
            //     } catch (err) {
            //         console.error("Error adding pending ICE candidate:", err);
            //     }
            // }
            pendingCandidates[toUserId].candidates.forEach(
                async (candidate) => {
                    try {
                        await pc.addIceCandidate(
                            new RTCIceCandidate(candidate)
                        );
                        console.log("Added pending ICE candidate:", candidate);
                    } catch (err) {
                        console.error(
                            "Error adding pending ICE candidate:",
                            err
                        );
                    }
                }
            );

            // Clear the pending candidates for this user
            setPendingCandidates((prev) => {
                const updated = { ...prev };
                delete updated[toUserId];
                return updated;
            });
        }
    }

    async function handleIceCandidate(
        fromUserId: string,
        toUserId: string,
        candidate: RTCIceCandidateInit,
        ws: WebSocket
    ) {
        console.log("Handling ICE candidate for:", fromUserId);
        const pc = peers.get(fromUserId); //////////////
        try {
            if (!pc) {
                console.warn(
                    `No PeerConnection for user: ${toUserId}. Queuing ICE candidate.`
                );
                setPendingCandidates((prev) => ({
                    ...prev,
                    [toUserId]: {
                        candidates: [
                            ...(prev[toUserId]?.candidates || []),
                            candidate,
                        ],
                    },
                }));
                return;
            }

            // Check if remote description is set
            if (!pc.remoteDescription) {
                console.warn(
                    `Remote description not set for user: ${toUserId}. Queuing ICE candidate.`
                );
                setPendingCandidates((prev) => ({
                    ...prev,
                    [toUserId]: {
                        candidates: [
                            ...(prev[toUserId]?.candidates || []),
                            candidate,
                        ],
                    },
                }));
                return;
            }

            // Add the current candidate
            console.log(`Adding ICE candidate for ${toUserId}:`, candidate);
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
            console.log(
                `Successfully added ICE candidate for user: ${toUserId}`
            );
        } catch (err) {
            console.error("Error adding ICE candidate:", err);
        }
    }

    function handleUserLeft(remoteUserId: string) {
        console.log("Handling user left:", remoteUserId);
        // Close and delete the peer connection
        const pc = peers.get(remoteUserId);
        if (pc) {
            console.log(`Closing peer connection for user: ${remoteUserId}`);
            pc.close();
            peers.delete(remoteUserId);
        }

        // Stop all tracks in the remote user's stream
        if (remoteStreamsRef.current[remoteUserId]) {
            console.log(`Stopping remote stream for user: ${remoteUserId}`);
            remoteStreamsRef.current[remoteUserId]
                .getTracks()
                .forEach((track) => {
                    console.log(`Stopping track: ${track.kind}`);
                    track.stop();
                });

            // Remove the user's stream from the remote streams reference
            delete remoteStreamsRef.current[remoteUserId];
            setRemoteStreamsKeys(Object.keys(remoteStreamsRef.current));
        }
    }

    /**
     * Render
     */
    return (
        <section className="mt-4 p-6 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg">
            {/* <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                Client Room Component
            </h3> */}
            {/* <div className="text-gray-700 dark:text-gray-300 mb-6">
                <p>
                    <span className="font-semibold">User ID:</span> {userId}
                </p>
                <p>
                    <span className="font-semibold">Room ID:</span> {roomId}
                </p>
            </div> */}
    
            {/* Media elements */}
            <div className="flex gap-6 flex-wrap">
                {/* Local video */}
                <div className="flex flex-col items-center">
                    <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        My Video
                    </h4>
                    <video
                        ref={localVideoRef}
                        muted
                        autoPlay
                        playsInline
                        className="w-80 h-56 bg-black border border-gray-300 rounded-md shadow-md"
                        controls
                    />
                </div>
    
                {/* Remote videos for each user */}
                {remoteStreamsKeys.map((userId) => (
                    <RemoteVideo
                        key={userId}
                        userId={userId}
                        stream={remoteStreamsRef.current[userId]}
                    />
                ))}
            </div>
        </section>
    );
    
}

/**
 * A small sub-component for rendering a remote MediaStream.
 */
function RemoteVideo({
    userId,
    stream,
}: {
    userId: string;
    stream: MediaStream;
}) {
    const ref = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (ref.current) {
            if (ref.current.srcObject !== stream) {
                ref.current.pause(); // Stop any previous playback
                ref.current.srcObject = stream; // Attach the new MediaStream

                console.log(`Setting video srcObject for user ${userId}`, stream);
                console.log("Tracks in the attached stream:", stream.getTracks());
                stream.getTracks().forEach((track) =>
                    console.log(`Track kind: ${track.kind}, readyState: ${track.readyState}`)
                );
                const playVideo = async () => {
                    ref.current
                        .play()
                        .catch((err) =>
                            console.error(
                                `Error playing video for user ${userId}:`,
                                err
                            )
                        );
                };
                playVideo();
            }
        }
    }, [stream, userId]);

    return (
        <div className="flex flex-col items-center">
            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Remote User: {userId}
            </h4>
            <video
                ref={ref}
                muted // Required for autoplay
                autoPlay
                playsInline
                className="w-80 h-56 bg-black border border-gray-300 rounded-md shadow-md"
                controls
            />
        </div>
    );
}
