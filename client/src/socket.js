import { io } from "socket.io-client";

const socket = io("https://realtime-chat-r1yy.onrender.com", {
  autoConnect: false,
});

export default socket;
