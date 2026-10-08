FROM node:24-alpine AS bau
WORKDIR /app
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build && pnpm prune --prod

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=bau /app/build ./build
COPY --from=bau /app/node_modules ./node_modules
COPY --from=bau /app/package.json ./
# Der Spiegel schreibt seinen Stand nach daten/ — dafür braucht der
# Container ein Volume (docker-compose.yml, docs/betrieb.md), sonst startet
# er nach jedem Neustart leer und lädt neu. Der Server läuft nicht als
# root, sondern als node (uid 1000); nur daten/ gehört ihm.
RUN mkdir -p daten && chown node:node daten
USER node
EXPOSE 3000
CMD ["node", "build/index.js"]
