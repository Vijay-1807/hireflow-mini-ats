# syntax=docker/dockerfile:1
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install --no-audit --no-fund
COPY client/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app/server
ENV NODE_ENV=production
COPY server/package*.json ./
RUN npm install --no-audit --no-fund
COPY server/ ./
COPY --from=client-build /app/client/dist /app/client/dist
EXPOSE 4000
CMD ["node", "src/index.js"]
