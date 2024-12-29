// "use client";

// import { useEffect, useRef, useState } from "react";

// interface Props {
//   userId: string;
//   roomId: string;
// }

// export function MultiPeerRoom({ userId, roomId }: Props) {
//   const localVideoRef = useRef<HTMLVideoElement>(null);
//   const [localStream, setLocalStream] = useState<MediaStream | null>(null);

//   useEffect(() => {
//     // 1. Connect to your WebSocket server
//     const socket = new WebSocket("ws://localhost:8080");

//     socket.onopen = () => {
//       // 2. Join the room
//       socket.send(
//         JSON.stringify({
//           type: "joinRoom",
//           userId,
//           roomId,
//         })
//       );
//     };

//     // 3. Listen for messages (offers, answers, iceCandidates, etc.)
//     socket.onmessage = (event) => {
//       const message = JSON.parse(event.data);
//       // handle message logic here ...
//     };

//     // 4. Acquire local video/audio
//     getLocalMedia();

//     async function getLocalMedia() {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({
//           video: true,
//           audio: true,
//         });
//         setLocalStream(stream);
//         if (localVideoRef.current) {
//           localVideoRef.current.srcObject = stream;
//           await localVideoRef.current.play();
//         }
//       } catch (err) {
//         console.error("Error getting local media:", err);
//       }
//     }

//     return () => {
//       socket.close();
//     };
//   }, [userId, roomId]);

//   return (
//     <section>
//       <h3>MultiPeerRoom Component</h3>
//       <video ref={localVideoRef} muted style={{ width: 400, background: "#000" }} />
//       {/* Additional UI for remote streams */}
//     </section>
//   );
// }
