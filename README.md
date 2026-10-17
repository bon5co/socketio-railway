# socketio-railway

Socket.IO 4.8 server for Railway. Env: `SOCKETIO_CLIENT_TOKEN`, `SOCKETIO_API_KEY` (both required),
`SOCKETIO_CORS_ORIGINS` (comma list, default `*`), `REDIS_URL` (optional, enables the Redis adapter), `PORT`.

- Client: `io(URL, { auth: { token: CLIENT_TOKEN } })`; events `join`, `leave`, `publish`.
- Server: `POST /emit` with `Authorization: Bearer <API_KEY>` and `{"event","data","room"}`.
- `GET /health` returns 200.
