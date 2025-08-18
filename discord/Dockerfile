# 1) deps
FROM node:22 AS deps
WORKDIR /app
COPY package*.json ./
ARG NODE_ENV=production
RUN if [ "$NODE_ENV" = "production" ]; then npm ci --omit=dev; else npm ci; fi

# 2) runner
FROM node:22 AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
USER node
CMD ["node","src/index.js"]
