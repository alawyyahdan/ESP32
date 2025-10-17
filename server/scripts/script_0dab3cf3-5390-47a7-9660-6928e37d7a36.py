# Face Detection Script
import cv2
import requests
import os
import time
import numpy as np
from urllib.request import urlopen

# Script configuration
SCRIPT_ID = os.getenv("SCRIPT_ID")
SERVER_URL = os.getenv("SERVER_URL")
DEVICE_ID = os.getenv("DEVICE_ID")
USER_ID = os.getenv("USER_ID")

# Load face detection classifier
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def log_detection(count, confidence=None):
    """Log detection results to analytics"""
    try:
        data = {
            'userId': USER_ID,
            'deviceId': DEVICE_ID,
            'scriptId': SCRIPT_ID,
            'detectionType': 'face',
            'detectedCount': count,
            'confidence': confidence,
            'metadata': {'timestamp': time.time()}
        }
        
        response = requests.post(f"{SERVER_URL}/analytics/log", json=data, timeout=5)
        if response.status_code == 200:
            print(f"Logged {count} faces detected")
        else:
            print(f"Failed to log detection: {response.status_code}")
    except Exception as e:
        print(f"Error logging detection: {e}")

def detect_faces_from_stream():
    """Detect faces from ESP32-CAM stream"""
    stream_url = f"{SERVER_URL}/api/view/{DEVICE_ID}?key=YOUR_VIEWER_API_KEY"
    
    while True:
        try:
            # Get frame from stream
            stream = urlopen(stream_url, timeout=10)
            bytes_data = bytes()
            
            while True:
                bytes_data += stream.read(1024)
                a = bytes_data.find(b'\xff\xd8')  # JPEG start
                b = bytes_data.find(b'\xff\xd9')  # JPEG end
                
                if a != -1 and b != -1:
                    jpg = bytes_data[a:b+2]
                    bytes_data = bytes_data[b+2:]
                    
                    # Decode image
                    img = cv2.imdecode(np.frombuffer(jpg, dtype=np.uint8), cv2.IMREAD_COLOR)
                    
                    if img is not None:
                        # Convert to grayscale for face detection
                        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                        
                        # Detect faces
                        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
                        face_count = len(faces)
                        
                        if face_count > 0:
                            print(f"Detected {face_count} face(s)")
                            log_detection(face_count, 0.8)
                        
                        # Wait before next detection
                        time.sleep(2)
                        
        except Exception as e:
            print(f"Stream error: {e}")
            time.sleep(5)  # Wait before retrying

if __name__ == "__main__":
    print("Face detection script started")
    detect_faces_from_stream()