# Frontend Dockerfile for LearnerAI
# Multi-stage build: Build stage + Production serve stage

# Stage 1: Build stage
FROM node:20-alpine AS builder

# Accept build-time arguments for Vite environment variables
ARG VITE_API_URL=http://localhost:5000
ARG VITE_API_VERSION=v1
ARG VITE_ENV=production
ARG VITE_RAILWAY_ASSET_KEY

# Set environment variables for build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_API_VERSION=${VITE_API_VERSION}
ENV VITE_ENV=${VITE_ENV}
ENV VITE_RAILWAY_ASSET_KEY=${VITE_RAILWAY_ASSET_KEY}

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies needed for build)
# Using npm install to ensure all dependencies are installed for the build
RUN npm install

# Copy source code
COPY . .

# Build the application (Vite will use the environment variables)
RUN npm run build

# Stage 2: Production stage with Nginx
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

