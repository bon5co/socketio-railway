// Socket.IO server for Railway.
// - Clients authenticate with the shared token (auth.token in the handshake).
// - Server-side code publishes over HTTP: POST /emit with the API key.
// - Optional Redis adapter when REDIS_URL is set (needed for more than one replica).
const http = require("http");
const { Server } = require("socket.io");

const PORT = parseInt(process.env.PORT || "8080", 10);
const CLIENT_TOKEN = process.env.SOCKETIO_CLIENT_TOKEN || "";
const API_KEY = process.env.SOCKETIO_API_KEY || "";
const ORIGINS = (process.env.SOCKETIO_CORS_ORIGINS || "*").split(",").map((s) => s.trim());
const MAX_BODY = 1024 * 1024;

if (!CLIENT_TOKEN || !API_KEY) {
  console.error("SOCKETIO_CLIENT_TOKEN and SOCKETIO_API_KEY must be set");
  process.exit(1);
}

const httpServer = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  const send = (code, obj) => {
    res.writeHead(code, { "content-type": "application/json" });
    res.end(JSON.stringify(obj));
  };
  if (req.method === "GET" && url.pathname === "/health") {
    return send(200, { status: "ok", clients: io.engine.clientsCount });
  }
  if (req.method === "GET" && url.pathname === "/") {
    return send(200, { service: "socket.io", version: require("socket.io/package.json").version, path: "/socket.io/" });
  }
  if (req.method === "POST" && url.pathname === "/emit") {
    const auth = req.headers["authorization"] || "";
    if (auth !== `Bearer ${API_KEY}`) return send(401, { error: "unauthorized" });
    let body = "";
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY) { send(413, { error: "too large" }); req.destroy(); return; }
      body += c;
    });
    req.on("end", () => {
      let msg;
      try { msg = JSON.parse(body); } catch { return send(400, { error: "invalid json" }); }
      if (!msg || typeof msg.event !== "string" || !msg.event) return send(400, { error: "event required" });
      let target = io;
      if (typeof msg.room === "string" && msg.room) target = target.to(msg.room);
      else if (Array.isArray(msg.rooms)) target = target.to(msg.rooms.filter((r) => typeof r === "string"));
      target.emit(msg.event, msg.data);
      send(200, { ok: true });
    });
    return;
  }
  // socket.io handles /socket.io/ itself; anything else:
  if (!url.pathname.startsWith("/socket.io")) send(404, { error: "not found" });
});

const io = new Server(httpServer, {
  cors: { origin: ORIGINS.length === 1 && ORIGINS[0] === "*" ? "*" : ORIGINS },
  pingInterval: 25000,
  pingTimeout: 20000,
});

io.use((socket, next) => {
  const token = (socket.handshake.auth && socket.handshake.auth.token) || socket.handshake.headers["x-socketio-token"];
  if (token !== CLIENT_TOKEN) return next(new Error("unauthorized"));
  next();
});

io.on("connection", (socket) => {
  socket.on("join", (room, ack) => {
    if (typeof room === "string" && room) { socket.join(room); if (typeof ack === "function") ack({ ok: true }); }
    else if (typeof ack === "function") ack({ ok: false });
  });
  socket.on("leave", (room, ack) => { socket.leave(room); if (typeof ack === "function") ack({ ok: true }); });
  // Relay: broadcast to a room (or everyone else) from a client.
  socket.on("publish", (msg, ack) => {
    if (!msg || typeof msg.event !== "string") { if (typeof ack === "function") ack({ ok: false }); return; }
    const target = typeof msg.room === "string" && msg.room ? socket.to(msg.room) : socket.broadcast;
    target.emit(msg.event, msg.data);
    if (typeof ack === "function") ack({ ok: true });
  });
});

async function main() {
  if (process.env.REDIS_URL) {
    const { createAdapter } = require("@socket.io/redis-adapter");
    const { createClient } = require("redis");
    const pub = createClient({ url: process.env.REDIS_URL });
    const sub = pub.duplicate();
    pub.on("error", (e) => console.error("redis", e.message));
    sub.on("error", (e) => console.error("redis", e.message));
    await Promise.all([pub.connect(), sub.connect()]);
    io.adapter(createAdapter(pub, sub));
    console.log("redis adapter enabled");
  }
  httpServer.listen(PORT, "::", () => console.log(`socket.io listening on :${PORT}`));
}
main().catch((e) => { console.error(e); process.exit(1); });
process.on("SIGTERM", () => io.close(() => process.exit(0)));
