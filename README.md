# StreamIt: Real-Time WebRTC Collaboration Platform

## 🚀 Project Overview

StreamIt is an advanced real-time full-mesh communication platform built with WebRTC technology, enabling seamless video, audio, and screen sharing in collaborative online rooms with peer-to-peer connections and secure room-based interactions with capacity limits of 5 users per room. The application provides a modern, responsive interface for users to create and join virtual meeting spaces with ease.

## 🌟 Key Features

- 🎥 Real-time video conferencing
- 🔊 Audio communication
- 💻 Screen sharing capabilities
- 🌐 WebRTC-powered peer-to-peer connections
- 🔒 Secure room-based interactions
- 📱 Responsive and modern UI

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 15
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS

### Backend
- **Language**: TypeScript
- **Runtime**: Node.js
- **WebSocket**: `ws` for real-time communication

## 📋 Prerequisites

- Docker
- Docker Compose
- Node.js 18+
- npm or yarn

## 🚀 Quick Start

### Using Docker Compose

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/streamit.git
   cd streamit

2. Build and start the application:
   ```bash
   docker-compose up --build

3. Access the application:
   Open your web browser and navigate to http://localhost:3000

4. Create a room:
   Click "Create Room" in the sidebar to create a new room.

5. Join a room:
   Click "Join Room" in the sidebar to join an existing room.

6. Share your screen:
   Click "Share Screen" to share your screen with other participants.

7. Disconnect:
   Click "Disconnect" to end your session.

8. Clean up:
   ```bash
   docker-compose down

## Local Development

### Frontend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/streamit.git
   cd streamit

2. Install dependencies:
   ```bash
   npm install

3. Start the development server:
   ```bash
   npm run dev

4. Access the application:
   Open your web browser and navigate to http://localhost:3000

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/streamit.git
   cd streamit

2. Install dependencies:
   ```bash
   npm install

3. Start the development server:
   ```bash
   npm run dev


🐳 Docker Configuration
The project uses a multi-container Docker setup:

frontend service: Next.js application
backend service: Node.js WebSocket server
🤝 Contributing
Fork the repository
Create your feature branch (git checkout -b feature/AmazingFeature)
Commit your changes (git commit -m 'Add some AmazingFeature')
Push to the branch (git push origin feature/AmazingFeature)
Open a Pull Request
