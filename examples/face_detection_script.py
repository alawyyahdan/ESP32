#!/usr/bin/env python3
"""
ESP32-CAM Face Detection Script
===============================

This script connects to your ESP32-CAM stream, detects faces using OpenCV,
and sends detection results to the analytics endpoint.

Requirements:
- opencv-python
- requests
- numpy

Installation:
pip install opencv-python requests numpy

Usage:
This script is designed to be run by the ESP32-CAM platform's script manager.
Environment variables are automatically provided:
- SCRIPT_ID: Unique script identifier
- SERVER_URL: Platform server URL
- DEVICE_ID: ESP32-CAM device ID
- USER_ID: User identifier

For testing locally, set these environment variables manually.
"""

import cv2
import requests
import os
import time
import numpy as np
from urllib.request import urlopen
import json
import sys
from datetime import datetime

# Script configuration from environment
SCRIPT_ID = os.getenv("SCRIPT_ID", "test-script")
SERVER_URL = os.getenv("SERVER_URL", "http://localhost:3000")
DEVICE_ID = os.getenv("DEVICE_ID", "test-device")
USER_ID = os.getenv("USER_ID", "test-user")

# Detection parameters
DETECTION_INTERVAL = 2  # seconds between detections
MIN_FACE_SIZE = (30, 30)  # minimum face size to detect
SCALE_FACTOR = 1.1  # how much the image size is reduced at each scale
MIN_NEIGHBORS = 4  # how many neighbors each face rectangle should have to retain it
CONFIDENCE_THRESHOLD = 0.7  # minimum confidence for logging

# You need to replace this with your actual viewer API key
VIEWER_API_KEY = "YOUR_VIEWER_API_KEY_HERE"

class FaceDetector:
    def __init__(self):
        """Initialize the face detector"""
        try:
            # Load the face cascade classifier
            self.face_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            )
            
            if self.face_cascade.empty():
                raise Exception("Could not load face cascade classifier")
            
            print(f"✅ Face detector initialized successfully")
            print(f"📊 Script ID: {SCRIPT_ID}")
            print(f"🌐 Server: {SERVER_URL}")
            print(f"📷 Device: {DEVICE_ID}")
            print(f"👤 User: {USER_ID}")
            
        except Exception as e:
            print(f"❌ Error initializing face detector: {e}")
            sys.exit(1)
    
    def detect_faces(self, image):
        """
        Detect faces in the given image
        
        Args:
            image: OpenCV image (BGR format)
            
        Returns:
            tuple: (face_count, confidence, faces_rectangles)
        """
        try:
            # Convert to grayscale for face detection
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=SCALE_FACTOR,
                minNeighbors=MIN_NEIGHBORS,
                minSize=MIN_FACE_SIZE,
                flags=cv2.CASCADE_SCALE_IMAGE
            )
            
            face_count = len(faces)
            
            # Calculate confidence based on face size and detection parameters
            # This is a simple heuristic - larger faces generally mean better detection
            confidence = 0.0
            if face_count > 0:
                avg_face_area = np.mean([w * h for (x, y, w, h) in faces])
                image_area = image.shape[0] * image.shape[1]
                confidence = min(0.9, 0.5 + (avg_face_area / image_area) * 2)
            
            return face_count, confidence, faces
            
        except Exception as e:
            print(f"❌ Error detecting faces: {e}")
            return 0, 0.0, []
    
    def log_detection(self, face_count, confidence, metadata=None):
        """
        Log detection results to the analytics endpoint
        
        Args:
            face_count: Number of faces detected
            confidence: Detection confidence (0.0 to 1.0)
            metadata: Additional metadata dictionary
        """
        try:
            if metadata is None:
                metadata = {}
            
            # Add timestamp and detection info to metadata
            metadata.update({
                'timestamp': datetime.now().isoformat(),
                'detection_interval': DETECTION_INTERVAL,
                'min_face_size': MIN_FACE_SIZE,
                'scale_factor': SCALE_FACTOR,
                'min_neighbors': MIN_NEIGHBORS
            })
            
            data = {
                'userId': USER_ID,
                'deviceId': DEVICE_ID,
                'scriptId': SCRIPT_ID,
                'detectionType': 'face',
                'detectedCount': face_count,
                'confidence': confidence,
                'metadata': metadata
            }
            
            response = requests.post(
                f"{SERVER_URL}/analytics/log",
                json=data,
                timeout=10,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"📊 Logged {face_count} face(s) detected (confidence: {confidence:.2f}) - ID: {result.get('id', 'unknown')}")
                return True
            else:
                print(f"⚠️ Failed to log detection: HTTP {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data.get('error', 'Unknown error')}")
                except:
                    print(f"   Response: {response.text}")
                return False
                
        except requests.exceptions.Timeout:
            print("⚠️ Timeout logging detection data")
            return False
        except requests.exceptions.ConnectionError:
            print("⚠️ Connection error logging detection data")
            return False
        except Exception as e:
            print(f"❌ Error logging detection: {e}")
            return False
    
    def get_frame_from_stream(self):
        """
        Get a single frame from the ESP32-CAM stream
        
        Returns:
            OpenCV image or None if failed
        """
        try:
            stream_url = f"{SERVER_URL}/api/view/{DEVICE_ID}?key={VIEWER_API_KEY}"
            
            # Open the stream
            stream = urlopen(stream_url, timeout=10)
            bytes_data = bytes()
            
            # Read until we get a complete JPEG frame
            while True:
                chunk = stream.read(1024)
                if not chunk:
                    break
                    
                bytes_data += chunk
                
                # Look for JPEG frame boundaries
                jpeg_start = bytes_data.find(b'\xff\xd8')  # JPEG start marker
                jpeg_end = bytes_data.find(b'\xff\xd9')    # JPEG end marker
                
                if jpeg_start != -1 and jpeg_end != -1 and jpeg_end > jpeg_start:
                    # Extract the JPEG frame
                    jpeg_data = bytes_data[jpeg_start:jpeg_end + 2]
                    
                    # Decode the image
                    img_array = np.frombuffer(jpeg_data, dtype=np.uint8)
                    image = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
                    
                    stream.close()
                    return image
            
            stream.close()
            return None
            
        except Exception as e:
            print(f"❌ Error getting frame from stream: {e}")
            return None
    
    def run_detection_loop(self):
        """
        Main detection loop - continuously monitor the stream for faces
        """
        print(f"🚀 Starting face detection loop...")
        print(f"⏱️ Detection interval: {DETECTION_INTERVAL} seconds")
        print(f"📏 Min face size: {MIN_FACE_SIZE}")
        print(f"🎯 Confidence threshold: {CONFIDENCE_THRESHOLD}")
        print(f"🔗 Stream URL: {SERVER_URL}/api/view/{DEVICE_ID}")
        print("=" * 50)
        
        consecutive_errors = 0
        max_consecutive_errors = 10
        
        while True:
            try:
                # Get frame from stream
                image = self.get_frame_from_stream()
                
                if image is not None:
                    # Reset error counter on successful frame
                    consecutive_errors = 0
                    
                    # Detect faces
                    face_count, confidence, faces = self.detect_faces(image)
                    
                    # Log detection if faces found or periodically for monitoring
                    current_time = time.time()
                    should_log = (
                        face_count > 0 or  # Always log when faces detected
                        int(current_time) % 30 == 0  # Log every 30 seconds for monitoring
                    )
                    
                    if should_log and confidence >= CONFIDENCE_THRESHOLD:
                        # Prepare metadata
                        metadata = {
                            'image_size': f"{image.shape[1]}x{image.shape[0]}",
                            'faces_detected': face_count,
                            'face_rectangles': [
                                {'x': int(x), 'y': int(y), 'width': int(w), 'height': int(h)}
                                for (x, y, w, h) in faces
                            ] if face_count > 0 else []
                        }
                        
                        self.log_detection(face_count, confidence, metadata)
                    
                    elif face_count > 0:
                        print(f"👁️ Detected {face_count} face(s) but confidence too low ({confidence:.2f} < {CONFIDENCE_THRESHOLD})")
                    
                else:
                    consecutive_errors += 1
                    print(f"⚠️ Failed to get frame from stream (error {consecutive_errors}/{max_consecutive_errors})")
                    
                    if consecutive_errors >= max_consecutive_errors:
                        print(f"❌ Too many consecutive errors ({consecutive_errors}), exiting...")
                        break
                
                # Wait before next detection
                time.sleep(DETECTION_INTERVAL)
                
            except KeyboardInterrupt:
                print("\n🛑 Detection stopped by user")
                break
            except Exception as e:
                consecutive_errors += 1
                print(f"❌ Unexpected error in detection loop: {e}")
                
                if consecutive_errors >= max_consecutive_errors:
                    print(f"❌ Too many consecutive errors ({consecutive_errors}), exiting...")
                    break
                
                time.sleep(5)  # Wait longer on unexpected errors
        
        print("🏁 Face detection loop ended")

def main():
    """Main function"""
    print("🎭 ESP32-CAM Face Detection Script")
    print("=" * 40)
    
    # Validate configuration
    if VIEWER_API_KEY == "YOUR_VIEWER_API_KEY_HERE":
        print("❌ Please set your VIEWER_API_KEY in the script")
        print("   You can get this from your device settings in the dashboard")
        sys.exit(1)
    
    # Create and run face detector
    detector = FaceDetector()
    
    try:
        detector.run_detection_loop()
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
