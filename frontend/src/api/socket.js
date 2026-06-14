import { io } from "socket.io-client";

function getSocketUrl() {
  if (import.meta.env.VITE_BASE_SHORT_URL) {
    return import.meta.env.VITE_BASE_SHORT_URL;
  }

  return (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
}

export function createSocket() {
  const token = localStorage.getItem("token");

  if (!token) {
    return null;
  }

  return io(getSocketUrl(), {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    timeout: 5000
  });
}
