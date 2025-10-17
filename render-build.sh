#!/bin/bash

# Render.com Build Script for ESP32-CAM with Python Support
# This script is executed during Render.com build process

set -e  # Exit on any error

echo "🚀 Starting Render.com build for ESP32-CAM with Python support"
echo "=============================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[BUILD]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Install Node.js dependencies
print_status "Installing Node.js dependencies..."
npm install
print_success "Node.js dependencies installed"

# Step 2: Update package lists
print_status "Updating package lists..."
apt-get update

# Step 3: Install Python and system dependencies
print_status "Installing Python and system dependencies..."
apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    python3-venv \
    build-essential \
    libopencv-dev \
    pkg-config \
    curl

print_success "System dependencies installed"

# Step 4: Create symbolic link for python command
print_status "Creating Python symbolic link..."
ln -sf /usr/bin/python3 /usr/bin/python

# Step 5: Upgrade pip
print_status "Upgrading pip..."
python3 -m pip install --upgrade pip

# Step 6: Install Python packages
print_status "Installing Python packages..."
if [ -f "requirements.txt" ]; then
    # Try with --break-system-packages for newer Python versions
    pip3 install --no-cache-dir --break-system-packages -r requirements.txt || \
    pip3 install --no-cache-dir -r requirements.txt
    print_success "Python packages installed from requirements.txt"
else
    print_error "requirements.txt not found!"
    exit 1
fi

# Step 7: Verify installations
print_status "Verifying installations..."

echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo "Python version: $(python3 --version)"
echo "pip version: $(pip3 --version)"

# Test Python imports
print_status "Testing Python imports..."
python3 -c "
import sys
print(f'Python executable: {sys.executable}')

try:
    import cv2
    print(f'✅ OpenCV version: {cv2.__version__}')
except ImportError as e:
    print(f'❌ OpenCV import failed: {e}')
    sys.exit(1)

try:
    import numpy as np
    print(f'✅ NumPy version: {np.__version__}')
except ImportError as e:
    print(f'❌ NumPy import failed: {e}')
    sys.exit(1)

try:
    import requests
    print(f'✅ Requests version: {requests.__version__}')
except ImportError as e:
    print(f'❌ Requests import failed: {e}')
    sys.exit(1)

print('🎉 All Python packages imported successfully!')
"

# Step 8: Create necessary directories
print_status "Creating application directories..."
mkdir -p server/scripts server/python-env
chmod 755 server/scripts server/python-env
print_success "Directories created"

# Step 9: Run database setup if needed
if [ -f "server/setup-db.js" ]; then
    print_status "Setting up database..."
    node server/setup-db.js || echo "Database setup skipped (might already exist)"
fi

# Step 10: Final verification
print_status "Final verification..."
if command -v python3 &> /dev/null && python3 -c "import cv2, numpy, requests" &> /dev/null; then
    print_success "✅ Build completed successfully!"
    echo "🎯 Ready for deployment with Python script support"
else
    print_error "❌ Build verification failed!"
    exit 1
fi

echo "=============================================================="
echo "🚀 Build completed! Your ESP32-CAM app is ready for Render.com"
