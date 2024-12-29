"use client";
// We need "use client" here so we can use React hooks on this page.

import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";

export default function HomePage() {
    const router = useRouter();
    const [userId, setUserId] = useState("");
    const [roomId, setRoomId] = useState("");

    function handleSubmit(e: FormEvent) {
        e.preventDefault();

        if (!userId.trim() || !roomId.trim()) {
            alert("Please fill out both fields");
            return;
        }

        // Navigate to /room/<roomId>?userId=<userId>
        router.push(`/room/${roomId}?userId=${encodeURIComponent(userId)}`);
    }

    return (
        <main style={{ padding: "2rem" }}>
            <h1>Join a Room</h1>
            <form
                onSubmit={handleSubmit}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    maxWidth: "300px",
                }}
            >
                <label>
                    User ID:
                    <input
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="alice123"
                    />
                </label>

                <label>
                    Room ID:
                    <input
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        placeholder="myRoom"
                    />
                </label>

                <button type="submit">Enter Room</button>
            </form>
        </main>
    );
}
