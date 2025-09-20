# Use Node.js 22 Alpine
FROM node:22.18.0-alpine

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set work directory
WORKDIR /app

# Install dependencies first (better caching)
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

# Copy the rest of the source
COPY . .

# Expose Next.js default port
EXPOSE 3000

# Development mode
CMD ["pnpm", "dev"]
