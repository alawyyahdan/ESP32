#!/bin/bash

# ESP32-CAM Streaming Provider Setup Script
# This script sets up the development environment and initializes the database

set -e  # Exit on any error

echo "🚀 ESP32-CAM Streaming Provider Setup"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Node.js is installed
check_nodejs() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js is installed: $NODE_VERSION"
        
        # Check if version is >= 16
        NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$NODE_MAJOR_VERSION" -lt 16 ]; then
            print_error "Node.js version 16 or higher is required. Current version: $NODE_VERSION"
            exit 1
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 16 or higher."
        exit 1
    fi
}

# Check if npm is installed
check_npm() {
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm is installed: $NPM_VERSION"
    else
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing Node.js dependencies..."
    
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    print_success "Dependencies installed successfully"
}

# Setup environment file
setup_environment() {
    if [ ! -f ".env" ]; then
        print_status "Creating .env file from template..."
        cp env.example .env
        
        # Generate a random JWT secret
        JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
        
        # Update .env file with generated secret
        if command -v sed &> /dev/null; then
            sed -i "s/your-super-secret-jwt-key-change-this-in-production/$JWT_SECRET/" .env
        fi
        
        print_success ".env file created"
        print_warning "Please update the .env file with your specific configuration"
    else
        print_success ".env file already exists"
    fi
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    # Run Supabase setup
    npm run setup
    print_success "Supabase database setup completed"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p logs
    mkdir -p uploads
    mkdir -p data
    
    print_success "Directories created"
}

# Check if ports are available
check_ports() {
    print_status "Checking if port 3000 is available..."
    
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port 3000 is already in use. Please stop the service using this port or change the PORT in .env"
    else
        print_success "Port 3000 is available"
    fi
}

# Test database connection
test_database() {
    print_status "Testing database connection..."
    
    if node -e "
        require('dotenv').config();
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
        supabase.from('users').select('count').limit(1)
            .then(({ error }) => {
                if (error && error.code !== 'PGRST116') {
                    throw error;
                }
                console.log('✅ Supabase connection successful');
                process.exit(0);
            })
            .catch((error) => {
                console.error('❌ Supabase connection failed:', error.message);
                process.exit(1);
            });
    " 2>/dev/null; then
        print_success "Supabase connection test passed"
    else
        print_warning "Supabase connection test failed - please check your .env configuration"
    fi
}

# Main setup process
main() {
    echo
    print_status "Starting setup process..."
    echo
    
    # Check prerequisites
    check_nodejs
    check_npm
    
    # Setup project
    install_dependencies
    setup_environment
    create_directories
    setup_database
    check_ports
    test_database
    
    echo
    print_success "Setup completed successfully! 🎉"
    echo
    echo "Next steps:"
    echo "1. Update the .env file with your configuration"
    echo "2. Run 'npm run dev' to start the development server"
    echo "3. Open http://localhost:3000 in your browser"
    echo "4. Create your first account and add ESP32-CAM devices"
    echo
    echo "For production deployment:"
    echo "- Render.com: Connect your GitHub repo and deploy"
    echo "- Docker: Run 'docker-compose up -d'"
    echo
    echo "ESP32-CAM Arduino code is available in the 'esp32/' directory"
    echo
}

# Run main function
main "$@"

