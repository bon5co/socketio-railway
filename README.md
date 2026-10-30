# socketio-railway

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/socketio-server-or-just-updated-realtime?referralCode=Z1xivh&utm_medium=integration&utm_source=template&utm_campaign=generic)

**Deploy on Railway:** [Socket.IO Server template](https://railway.com/deploy/socketio-server-or-just-updated-realtime?referralCode=Z1xivh&utm_medium=integration&utm_source=template&utm_campaign=generic)

Socket.IO 4.8 server for Railway. Env: `SOCKETIO_CLIENT_TOKEN`, `SOCKETIO_API_KEY` (both required),
`SOCKETIO_CORS_ORIGINS` (comma list, default `*`), `REDIS_URL` (optional, enables the Redis adapter), `PORT`.

- Client: `io(URL, { auth: { token: CLIENT_TOKEN } })`; events `join`, `leave`, `publish`.
- Server: `POST /emit` with `Authorization: Bearer <API_KEY>` and `{"event","data","room"}`.
- `GET /health` returns 200.
