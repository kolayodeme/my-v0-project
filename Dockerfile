# Build stage
FROM node:20-slim AS builder

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY .npmrc ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:20-slim AS runner

# Install serve globally
RUN npm install -g serve

WORKDIR /app

# Copy built assets from builder stage
COPY --from=builder /app/out ./out

# Expose port
EXPOSE 8080

# Start the application
CMD ["serve", "-p", "8080", "-s", "out", "--single", "--cors"] 