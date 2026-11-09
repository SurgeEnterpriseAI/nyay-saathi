FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY src ./src
COPY public ./public
ENV NODE_ENV=production PORT=8080 ANALYTICS_DB=/data/analytics.db
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME /data
EXPOSE 8080
HEALTHCHECK CMD wget -qO- http://localhost:8080/healthz || exit 1
CMD ["node", "--disable-warning=ExperimentalWarning", "src/server.js"]
