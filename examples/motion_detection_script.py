#!/usr/bin/env python3
"""
ESP32-CAM Motion Detection Script
=================================

This script connects to your ESP32-CAM stream, detects motion using frame differencing,
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

# Motion detection parameters
DETECTION_INTERVAL = 1  # seconds between frame comparisons
MOTION_THRESHOLD = 5000  # minimum contour area to consider as motion
BLUR_SIZE = 21  # Gaussian blur kernel size
DILATE_ITERATIONS = 2  # morphological operations iterations
FRAME_DELTA_THRESHOLD = 25  # threshold for frame differencing
MIN_CONTOUR_AREA = 500  # minimum contour area to count

# You need to replace this with your actual viewer API key
VIEWER_API_KEY = "YOUR_VIEWER_API_KEY_HERE"

class MotionDetector:
    def __init__(self):
        """Initialize the motion detector"""
        try:
            self.previous_frame = None
            self.motion_detected_time = None
            
            print(f"✅ Motion detector initialized successfully")
            print(f"📊 Script ID: {SCRIPT_ID}")
            print(f"🌐 Server: {SERVER_URL}")
            print(f"📷 Device: {DEVICE_ID}")
            print(f"👤 User: {USER_ID}")
            
        except Exception as e:
            print(f"❌ Error initializing motion detector: {e}")
            sys.exit(1)
    
    def detect_motion(self, current_frame):
        """
        Detect motion between current frame and previous frame
        
        Args:
            current_frame: OpenCV image (BGR format)
            
        Returns:
            tuple: (motion_detected, motion_level, contours)
        """
        try:
            # Convert to grayscale and blur
            gray = cv2.cvtColor(current_frame, cv2.COLOR_BGR2GRAY)
            gray = cv2.GaussianBlur(gray, (BLUR_SIZE, BLUR_SIZE), 0)
            
            # If this is the first frame, store it and return no motion
            if self.previous_frame is None:
                self.previous_frame = gray
                return False, 0, []
            
            # Calculate absolute difference between frames
            frame_delta = cv2.absdiff(self.previous_frame, gray)
            
            # Threshold the delta image
            thresh = cv2.threshold(frame_delta, FRAME_DELTA_THRESHOLD, 255, cv2.THRESH_BINARY)[1]
            
            # Dilate the thresholded image to fill in holes
            thresh = cv2.dilate(thresh, None, iterations=DILATE_ITERATIONS)
            
            # Find contours
            contours, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # Calculate total motion level
            motion_level = 0
            significant_contours = []
            
            for contour in contours:
                area = cv2.contourArea(contour)
                if area > MIN_CONTOUR_AREA:
                    motion_level += area
                    significant_contours.append(contour)
            
            # Update previous frame
            self.previous_frame = gray
            
            # Determine if motion is significant
            motion_detected = motion_level > MOTION_THRESHOLD
            
            return motion_detected, motion_level, significant_contours
            
        except Exception as e:
            print(f"❌ Error detecting motion: {e}")
            return False, 0, []
    
    def log_detection(self, motion_level, contour_count, metadata=None):
        """
        Log motion detection results to the analytics endpoint
        
        Args:
            motion_level: Total motion area detected
            contour_count: Number of motion contours
            metadata: Additional metadata dictionary
        """
        try:
            if metadata is None:
                metadata = {}
            
            # Add timestamp and detection info to metadata
            metadata.update({
                'timestamp': datetime.now().isoformat(),
                'motion_level': motion_level,
                'contour_count': contour_count,
                'motion_threshold': MOTION_THRESHOLD,
                'detection_interval': DETECTION_INTERVAL,
                'blur_size': BLUR_SIZE,
                'frame_delta_threshold': FRAME_DELTA_THRESHOLD,
                'min_contour_area': MIN_CONTOUR_AREA
            })
            
            # Calculate confidence based on motion level
            confidence = min(0.95, motion_level / (MOTION_THRESHOLD * 10))
            
            data = {
                'userId': USER_ID,
                'deviceId': DEVICE_ID,
                'scriptId': SCRIPT_ID,
                'detectionType': 'motion',
                'detectedCount': 1,  # Motion is binary - either detected or not
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
                print(f"📊 Logged motion detection (level: {motion_level}, confidence: {confidence:.2f}) - ID: {result.get('id', 'unknown')}")
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
        Main detection loop - continuously monitor the stream for motion
        """
        print(f"🚀 Starting motion detection loop...")
        print(f"⏱️ Detection interval: {DETECTION_INTERVAL} seconds")
        print(f"📏 Motion threshold: {MOTION_THRESHOLD}")
        print(f"🔍 Min contour area: {MIN_CONTOUR_AREA}")
        print(f"🌫️ Blur size: {BLUR_SIZE}")
        print(f"🔗 Stream URL: {SERVER_URL}/api/view/{DEVICE_ID}")
        print("=" * 50)
        
        consecutive_errors = 0
        max_consecutive_errors = 10
        last_motion_log_time = 0
        motion_cooldown = 5  # seconds between motion logs to avoid spam
        
        while True:
            try:
                # Get frame from stream
                image = self.get_frame_from_stream()
                
                if image is not None:
                    # Reset error counter on successful frame
                    consecutive_errors = 0
                    
                    # Detect motion
                    motion_detected, motion_level, contours = self.detect_motion(image)
                    
                    current_time = time.time()
                    
                    if motion_detected:
                        # Only log if enough time has passed since last motion log
                        if current_time - last_motion_log_time >= motion_cooldown:
                            # Prepare metadata
                            metadata = {
                                'image_size': f"{image.shape[1]}x{image.shape[0]}",
                                'motion_areas': [
                                    {
                                        'area': int(cv2.contourArea(contour)),
                                        'bounding_rect': [int(x) for x in cv2.boundingRect(contour)]
                                    }
                                    for contour in contours
                                ]
                            }
                            
                            self.log_detection(motion_level, len(contours), metadata)
                            last_motion_log_time = current_time
                            self.motion_detected_time = current_time
                        else:
                            print(f"🔄 Motion detected (level: {motion_level}) - cooldown active")
                    
                    else:
                        # Occasionally log "no motion" for monitoring
                        if int(current_time) % 60 == 0:  # Every minute
                            print(f"😴 No motion detected (level: {motion_level} < {MOTION_THRESHOLD})")
                
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
        
        print("🏁 Motion detection loop ended")

def main():
    """Main function"""
    print("🏃 ESP32-CAM Motion Detection Script")
    print("=" * 40)
    
    # Validate configuration
    if VIEWER_API_KEY == "YOUR_VIEWER_API_KEY_HERE":
        print("❌ Please set your VIEWER_API_KEY in the script")
        print("   You can get this from your device settings in the dashboard")
        sys.exit(1)
    
    # Create and run motion detector
    detector = MotionDetector()
    
    try:
        detector.run_detection_loop()
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
