import { io } from "socket.io-client";

const socket = io(" https://realtime-chat-zb4l.onrender.com", {
  autoConnect: false,
});

export default socket;
