# Build stage: compile TypeScript to dist/
# Debian-based images: onnxruntime-node (mood search embeddings) needs glibc.
FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage: production dependencies and compiled output only
FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
# Swagger reads its definitions from docs/*.ts at runtime.
COPY docs ./docs
COPY migrations ./migrations
# Writable cache for the embedding model, downloaded on first start.
ENV MODEL_CACHE_DIR=/app/.model-cache
RUN mkdir -p /app/.model-cache && chown node:node /app/.model-cache
USER node
EXPOSE 80
CMD ["sh", "-c", "npm run migrate && node dist/index.js"]
