# ESP32-CAM Streaming Provider with Python Support
# Optimized for Render.com deployment

FROM node:18-slim

# Install system dependencies including Python
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    python3-venv \
    build-essential \
    libopencv-dev \
    pkg-config \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create symbolic link for python command
RUN ln -s /usr/bin/python3 /usr/bin/python

# Set working directory
WORKDIR /app

# Copy Python requirements and install first (for better caching)
COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy Node.js package files and install
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create necessary directories with proper permissions
RUN mkdir -p server/scripts server/python-env logs uploads && \
    chmod 755 server/scripts server/python-env

# Verify installations
RUN echo "🔍 Verifying installations..." && \
    node --version && \
    npm --version && \
    python3 --version && \
    pip3 --version && \
    python3 -c "import cv2, numpy, requests; print('✅ Python packages verified')" && \
    echo "✅ All installations verified"

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start application
CMD ["npm", "start"]