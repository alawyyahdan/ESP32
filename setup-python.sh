#!/bin/bash

# Python Setup Script for ESP32-CAM Custom Scripts
# This script installs Python and required dependencies

set -e  # Exit on any error

echo "🐍 ESP32-CAM Python Setup"
echo "========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Detect OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v apt-get &> /dev/null; then
            OS="ubuntu"
        elif command -v yum &> /dev/null; then
            OS="centos"
        else
            OS="linux"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        OS="windows"
    else
        OS="unknown"
    fi
    print_status "Detected OS: $OS"
}

# Check if Python is installed
check_python() {
    print_status "Checking Python installation..."
    
    PYTHON_CMD=""
    for cmd in python3 python py; do
        if command -v $cmd &> /dev/null; then
            VERSION=$($cmd --version 2>&1)
            if [[ $VERSION == *"Python 3."* ]]; then
                PYTHON_CMD=$cmd
                print_success "Found Python: $cmd ($VERSION)"
                break
            fi
        fi
    done
    
    if [ -z "$PYTHON_CMD" ]; then
        print_error "Python 3.x not found!"
        return 1
    fi
    
    return 0
}

# Install Python based on OS
install_python() {
    print_status "Installing Python 3..."
    
    case $OS in
        "ubuntu")
            sudo apt-get update
            sudo apt-get install -y python3 python3-pip python3-dev
            ;;
        "centos")
            sudo yum install -y python3 python3-pip python3-devel
            ;;
        "macos")
            if command -v brew &> /dev/null; then
                brew install python3
            else
                print_error "Homebrew not found. Please install Python 3 manually from python.org"
                exit 1
            fi
            ;;
        "windows")
            print_error "Please install Python 3 from python.org for Windows"
            exit 1
            ;;
        *)
            print_error "Unsupported OS. Please install Python 3 manually"
            exit 1
            ;;
    esac
}

# Install Python packages
install_packages() {
    print_status "Installing Python packages..."
    
    if [ ! -f "requirements.txt" ]; then
        print_error "requirements.txt not found!"
        exit 1
    fi
    
    # Try pip3 first, then pip
    PIP_CMD=""
    for cmd in pip3 pip; do
        if command -v $cmd &> /dev/null; then
            PIP_CMD=$cmd
            break
        fi
    done
    
    if [ -z "$PIP_CMD" ]; then
        print_error "pip not found!"
        exit 1
    fi
    
    print_status "Using pip command: $PIP_CMD"
    
    # Install packages
    $PIP_CMD install -r requirements.txt
    
    print_success "Python packages installed successfully"
}

# Test Python installation
test_installation() {
    print_status "Testing Python installation..."
    
    # Test basic imports
    $PYTHON_CMD -c "
import cv2
import numpy as np
import requests
print('✅ All required packages imported successfully')
print(f'OpenCV version: {cv2.__version__}')
print(f'NumPy version: {np.__version__}')
print(f'Requests version: {requests.__version__}')
"
    
    if [ $? -eq 0 ]; then
        print_success "Python installation test passed!"
    else
        print_error "Python installation test failed!"
        exit 1
    fi
}

# Create test script
create_test_script() {
    print_status "Creating test script..."
    
    cat > test_python_setup.py << 'EOF'
#!/usr/bin/env python3
"""
Test script to verify Python setup for ESP32-CAM custom scripts
"""

import sys
import cv2
import numpy as np
import requests
import os
from datetime import datetime

def test_opencv():
    """Test OpenCV functionality"""
    print("🔍 Testing OpenCV...")
    
    # Create a test image
    img = np.zeros((100, 100, 3), dtype=np.uint8)
    img[:] = (255, 0, 0)  # Blue image
    
    # Test face cascade loading
    try:
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        if face_cascade.empty():
            print("❌ Face cascade not loaded")
            return False
        else:
            print("✅ Face cascade loaded successfully")
    except Exception as e:
        print(f"❌ OpenCV test failed: {e}")
        return False
    
    return True

def test_requests():
    """Test requests functionality"""
    print("🌐 Testing requests...")
    
    try:
        # Test a simple GET request
        response = requests.get('https://httpbin.org/get', timeout=5)
        if response.status_code == 200:
            print("✅ HTTP requests working")
            return True
        else:
            print(f"❌ HTTP request failed with status: {response.status_code}")
            return False
    except Exception as e:
        print(f"⚠️ HTTP request test failed (might be network issue): {e}")
        return True  # Don't fail the test for network issues

def test_environment():
    """Test environment variables"""
    print("🔧 Testing environment...")
    
    # Test environment variable access
    test_vars = {
        'SCRIPT_ID': 'test-script',
        'SERVER_URL': 'http://localhost:3000',
        'DEVICE_ID': 'test-device',
        'USER_ID': 'test-user'
    }
    
    for var, default in test_vars.items():
        value = os.getenv(var, default)
        print(f"   {var}: {value}")
    
    print("✅ Environment variables accessible")
    return True

def main():
    print("🐍 ESP32-CAM Python Setup Test")
    print("=" * 40)
    print(f"Python version: {sys.version}")
    print(f"Test time: {datetime.now()}")
    print()
    
    tests = [
        ("OpenCV", test_opencv),
        ("Requests", test_requests),
        ("Environment", test_environment)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
            print()
        except Exception as e:
            print(f"❌ {test_name} test crashed: {e}")
            print()
    
    print("=" * 40)
    print(f"Tests passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All tests passed! Python setup is ready for ESP32-CAM scripts.")
        return 0
    else:
        print("❌ Some tests failed. Please check the installation.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
EOF
    
    chmod +x test_python_setup.py
    print_success "Test script created: test_python_setup.py"
}

# Main execution
main() {
    detect_os
    
    if ! check_python; then
        print_warning "Python 3 not found. Installing..."
        install_python
        
        # Check again after installation
        if ! check_python; then
            print_error "Python installation failed!"
            exit 1
        fi
    fi
    
    install_packages
    test_installation
    create_test_script
    
    print_success "Python setup completed successfully!"
    print_status "You can now run: python3 test_python_setup.py"
    print_status "Or start your ESP32-CAM server: npm run dev"
}

# Run main function
main
