// Import the child below (after the default export)
// import ClientRoom from "./ClientRoom";
import dynamic from "next/dynamic";

const ClientRoom = dynamic(() => import("./ClientRoom"), { ssr: true });

// app/room/[roomId]/page.tsx
export default async function RoomPage({
    params,
}: {
    
    params: { roomId: string };
}) {
    const { roomId } = await params; // no warning, since it's not async

    return (
        <main style={{ padding: "2rem" }}>
            <h2>Server Page for Room: {roomId}</h2>
            {/* Render the child client component that handles userId & WebRTC */}
            <ClientRoom roomId={roomId} />
        </main>
    );
}
