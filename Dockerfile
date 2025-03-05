# Stage 1: Build the app
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --production=false  # Ensure devDependencies are included for build
COPY . .
RUN npm run build

# Stage 2: Run the app
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
# Correctly copy public directory from builder
COPY --from=builder /app/public ./public

ENV PORT=8080
EXPOSE 8080
CMD ["npm", "start"]