# Socket.IO server for Railway.
# No official Socket.IO server image exists, so this wraps the official socket.io package
# with token auth, an HTTP emit API and a /health endpoint. Settings are read from the
# environment; template variables are all ${{secret()}} so none publishes blank.
FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY server.js ./
ENV NODE_ENV=production
USER node
CMD ["node", "server.js"]
