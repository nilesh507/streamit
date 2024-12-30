// Import the child dynamically for SSR
import dynamic from "next/dynamic";

const ClientRoom = dynamic(() => import("./ClientRoom"), { ssr: true });

export default function RoomPage({ params }: { params: { roomId: string } }) {
    const { roomId } = params;

    return (
        <main className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-6">
            <div className="container mx-auto max-w-4xl">
                <h5 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-200 mb-6">
                    Room: <span className="text-blue-500">{roomId}</span>
                </h5>
                {/* Render the child client component that handles userId & WebRTC */}
                <ClientRoom roomId={roomId} />
            </div>
        </main>
    );
}
