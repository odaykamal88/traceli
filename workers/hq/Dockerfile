FROM node:24.14.0-alpine
WORKDIR /app
COPY workers/hq/package.json workers/hq/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY --chown=node:node workers/hq/worker.mjs ./
USER node
CMD ["node", "worker.mjs"]
