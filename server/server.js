const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Set up WebRTC signaling
const webrtcNamespace = io.of('/');
webrtcNamespace.on('connection', socket => {
  const { sessionId, userId, readerId, role } = socket.handshake.query;
  
  console.log(`WebRTC: New ${role} connected to session ${sessionId}`);
  
  // Join the session room
  socket.join(sessionId);
  
  // Notify others in the room
  socket.to(sessionId).emit('session-status', {
    event: 'user-joined',
    userId,
    role
  });
  
  // Handle WebRTC signaling messages
  socket.on('webrtc-message', data => {
    console.log(`WebRTC: Message in session ${sessionId} from ${userId}`);
    socket.to(sessionId).emit('webrtc-message', data.message);
  });
  
  // Handle session join events
  socket.on('join-session', data => {
    console.log(`WebRTC: ${role} joined session ${sessionId}`);
    socket.to(sessionId).emit('session-status', {
      event: 'user-ready',
      userId,
      role
    });
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`WebRTC: ${role} disconnected from session ${sessionId}`);
    socket.to(sessionId).emit('session-status', {
      event: 'user-left',
      userId,
      role
    });
  });
});

// Set up chat service
const chatNamespace = io.of('/chat');
chatNamespace.on('connection', socket => {
  const { sessionId, userId } = socket.handshake.query;
  
  console.log(`Chat: User ${userId} connected to session ${sessionId}`);
  
  // Join the chat room
  socket.join(sessionId);
  
  // Handle chat join events
  socket.on('join-chat', data => {
    console.log(`Chat: User ${userId} joined chat ${sessionId}`);
  });
  
  // Handle chat messages
  socket.on('chat-message', data => {
    console.log(`Chat: Message in session ${sessionId} from ${data.message.sender}`);
    // Broadcast the message to all clients in the room
    chatNamespace.to(sessionId).emit('chat-message', data.message);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Chat: User ${userId} disconnected from chat ${sessionId}`);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});