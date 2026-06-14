import crypto from "crypto";
import jwt from "jsonwebtoken";

const clientsByUserId = new Map();
const websocketGuid = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

function writeHttpError(socket, statusCode, message) {
  socket.write(`HTTP/1.1 ${statusCode} ${message}\r\nConnection: close\r\n\r\n`);
  socket.destroy();
}

function createFrame(payload, opcode = 0x1) {
  const data = Buffer.isBuffer(payload) ? payload : Buffer.from(payload);
  const length = data.length;
  let header;

  if (length < 126) {
    header = Buffer.alloc(2);
    header[1] = length;
  } else if (length < 65536) {
    header = Buffer.alloc(4);
    header[1] = 126;
    header.writeUInt16BE(length, 2);
  } else {
    header = Buffer.alloc(10);
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(length), 2);
  }

  header[0] = 0x80 | opcode;
  return Buffer.concat([header, data]);
}

function sendJson(socket, message) {
  if (socket.destroyed) {
    return;
  }

  socket.write(createFrame(JSON.stringify(message)));
}

function addClient(userId, socket) {
  if (!clientsByUserId.has(userId)) {
    clientsByUserId.set(userId, new Set());
  }

  const clients = clientsByUserId.get(userId);
  clients.add(socket);

  function cleanup() {
    clients.delete(socket);

    if (clients.size === 0) {
      clientsByUserId.delete(userId);
    }
  }

  socket.on("close", cleanup);
  socket.on("end", cleanup);
  socket.on("error", cleanup);
}

function handleClientFrame(socket, buffer) {
  if (buffer.length === 0) {
    return;
  }

  const opcode = buffer[0] & 0x0f;

  if (opcode === 0x8) {
    socket.end();
    return;
  }

  if (opcode === 0x9) {
    socket.write(createFrame(Buffer.alloc(0), 0x0a));
  }
}

export function initWebSocketServer(server) {
  server.on("upgrade", (request, socket) => {
    try {
      const requestUrl = new URL(request.url, `http://${request.headers.host}`);

      if (requestUrl.pathname !== "/ws") {
        socket.destroy();
        return;
      }

      const key = request.headers["sec-websocket-key"];
      const token = requestUrl.searchParams.get("token");

      if (!key || request.headers.upgrade?.toLowerCase() !== "websocket") {
        writeHttpError(socket, 400, "Bad Request");
        return;
      }

      if (!token) {
        writeHttpError(socket, 401, "Unauthorized");
        return;
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const userId = Number(payload.id);

      if (!Number.isFinite(userId)) {
        writeHttpError(socket, 401, "Unauthorized");
        return;
      }

      const acceptKey = crypto
        .createHash("sha1")
        .update(`${key}${websocketGuid}`)
        .digest("base64");

      socket.write(
        [
          "HTTP/1.1 101 Switching Protocols",
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Accept: ${acceptKey}`,
          "",
          ""
        ].join("\r\n")
      );

      socket.setNoDelay(true);
      socket.setKeepAlive(true);
      addClient(userId, socket);
      sendJson(socket, { type: "connection:ready" });
      socket.on("data", (buffer) => handleClientFrame(socket, buffer));
    } catch {
      if (!socket.destroyed) {
        writeHttpError(socket, 401, "Unauthorized");
      }
    }
  });
}

export function broadcastUrlClick(userId, payload) {
  const clients = clientsByUserId.get(Number(userId));

  if (!clients) {
    return;
  }

  const message = {
    type: "url:click",
    payload
  };

  for (const socket of clients) {
    sendJson(socket, message);
  }
}
