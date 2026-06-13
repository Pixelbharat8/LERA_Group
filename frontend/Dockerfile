FROM node:20-alpine

# Install dependencies for SWC
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package*.json ./

# Reproducible install from the lockfile. --legacy-peer-deps retained because the current
# dependency tree has known peer-range conflicts; remove once those are resolved.
RUN npm ci --legacy-peer-deps --no-audit --no-fund

COPY . .

RUN npm run build

# Run as the built-in non-root `node` user
RUN chown -R node:node /app
USER node

EXPOSE 3000

CMD ["npm", "start"]
