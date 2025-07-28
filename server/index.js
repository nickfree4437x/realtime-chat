const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require("http");
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const room = require('./routes/roomRoutes');
const setupSocket = require("./sockets/socket");

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', room);

// Sample API
app.get('/', (req, res) => {
  res.send('API is working ✅');
});

// Setup socket
setupSocket(server);

// Listen on server (FIXED)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
