/*
 * ESP32-CAM Universal Streaming Client
 * 
 * Kode universal yang bisa dikustomisasi untuk berbagai kebutuhan
 * Semua pengaturan bisa diubah sesuai kebutuhan user
 * 
 * Hardware: ESP32-CAM (AI-Thinker)
 * 
 * Cara Setup:
 * 1. Install ESP32 board package di Arduino IDE
 * 2. Pilih board "AI Thinker ESP32-CAM"
 * 3. Set partition scheme "Huge APP (3MB No OTA/1MB SPIFFS)"
 * 4. Sesuaikan konfigurasi di bawah sesuai kebutuhan
 * 5. Upload ke ESP32-CAM menggunakan FTDI programmer
 * 
 * Download konfigurasi terbaru dari: [SERVER_URL]/download
 */

#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>

// ===========================================
// KONFIGURASI UTAMA - SESUAIKAN DENGAN KEBUTUHAN ANDA
// ===========================================

// WiFi Settings
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Server Settings (dapatkan dari dashboard)
const char* SERVER_URL = "YOUR_SERVER_ADDRESS";  // Ganti dengan ADDRESS dari .env
const char* DEVICE_ID = "YOUR_DEVICE_ID";
const char* DEVICE_API_KEY = "YOUR_DEVICE_API_KEY";

// ===========================================
// PENGATURAN KAMERA - CUSTOMIZABLE
// ===========================================

// Frame Rate (FPS) - Pilih sesuai kebutuhan
// 1 = Hemat bandwidth, kualitas tinggi
// 5 = Seimbang antara smooth dan bandwidth
// 10 = Smooth tapi butuh bandwidth tinggi
// 15 = Maximum untuk ESP32-CAM (butuh WiFi kuat)
const int FRAME_RATE = 5;

// Resolusi Kamera - Pilih sesuai kebutuhan
// Opsi yang tersedia:
// FRAMESIZE_96X96     // 96x96
// FRAMESIZE_QQVGA     // 160x120
// FRAMESIZE_QCIF      // 176x144
// FRAMESIZE_HQVGA     // 240x176
// FRAMESIZE_240X240   // 240x240
// FRAMESIZE_QVGA      // 320x240
// FRAMESIZE_CIF       // 400x296
// FRAMESIZE_HVGA      // 480x320 (Recommended untuk realtime)
// FRAMESIZE_VGA       // 640x480 (Recommended untuk kualitas)
// FRAMESIZE_SVGA      // 800x600
// FRAMESIZE_XGA       // 1024x768
// FRAMESIZE_HD        // 1280x720
// FRAMESIZE_SXGA      // 1280x1024
// FRAMESIZE_UXGA      // 1600x1200 (Maximum, butuh PSRAM)
const framesize_t CAMERA_RESOLUTION = FRAMESIZE_VGA;

// Kualitas JPEG (0-63)
// 0-10  = Kualitas sangat tinggi (file besar, lambat)
// 10-20 = Kualitas tinggi (recommended untuk kualitas)
// 20-30 = Kualitas sedang (recommended untuk realtime)
// 30-40 = Kualitas rendah (file kecil, cepat)
// 40-63 = Kualitas sangat rendah (emergency)
const int JPEG_QUALITY = 15;

// ===========================================
// PENGATURAN ADVANCED - UNTUK USER ADVANCED
// ===========================================

// Auto-restart jika terlalu banyak error
const bool AUTO_RESTART_ON_ERROR = true;
const int MAX_ERRORS_BEFORE_RESTART = 20;

// Timeout settings (dalam milidetik)
const int WIFI_CONNECT_TIMEOUT = 30000;  // 30 detik
const int HTTP_TIMEOUT = 8000;           // 8 detik
const int RETRY_DELAY = 5000;            // 5 detik antara retry

// LED Indicator (pin 4 - flash LED)
const bool ENABLE_LED_INDICATOR = true;
const int LED_PIN = 4;

// Serial Monitor Settings
const int SERIAL_BAUD_RATE = 115200;
const bool ENABLE_DEBUG_OUTPUT = true;
const bool ENABLE_PERFORMANCE_STATS = true;

// ===========================================
// PENGATURAN SENSOR KAMERA - FINE TUNING
// ===========================================

// Brightness (-2 to 2, 0 = default)
const int CAMERA_BRIGHTNESS = 0;

// Contrast (-2 to 2, 0 = default)
const int CAMERA_CONTRAST = 0;

// Saturation (-2 to 2, 0 = default)
const int CAMERA_SATURATION = 0;

// Auto White Balance (0 = disable, 1 = enable)
const int CAMERA_AWB = 1;

// Auto Exposure Control (0 = disable, 1 = enable)
const int CAMERA_AEC = 1;

// Auto Gain Control (0 = disable, 1 = enable)
const int CAMERA_AGC = 1;

// Mirror horizontal (0 = disable, 1 = enable)
const int CAMERA_HMIRROR = 0;

// Flip vertical (0 = disable, 1 = enable)
const int CAMERA_VFLIP = 0;

// ===========================================
// PIN DEFINITIONS - JANGAN DIUBAH
// ===========================================
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// ===========================================
// VARIABEL GLOBAL - JANGAN DIUBAH
// ===========================================
HTTPClient http;
unsigned long lastFrameTime = 0;
unsigned long frameInterval;
bool cameraInitialized = false;
int errorCount = 0;
unsigned long totalFramesSent = 0;
unsigned long totalBytesSent = 0;
unsigned long startTime = 0;

void setup() {
  // Inisialisasi Serial
  Serial.begin(SERIAL_BAUD_RATE);
  delay(1000);
  
  if (ENABLE_DEBUG_OUTPUT) {
    Serial.println();
    Serial.println("========================================");
    Serial.println("ESP32-CAM Universal Streaming Client");
    Serial.println("========================================");
    printConfiguration();
  }
  
  // Setup LED
  if (ENABLE_LED_INDICATOR) {
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW);
  }
  
  // Hitung interval frame
  frameInterval = 1000 / FRAME_RATE;
  startTime = millis();
  
  // Inisialisasi kamera
  if (initializeCamera()) {
    cameraInitialized = true;
    if (ENABLE_DEBUG_OUTPUT) {
      Serial.println("✅ Kamera berhasil diinisialisasi");
    }
    blinkLED(2, 200);  // 2 kedip = kamera OK
  } else {
    if (ENABLE_DEBUG_OUTPUT) {
      Serial.println("❌ Gagal menginisialisasi kamera");
    }
    blinkLED(5, 100);  // 5 kedip = error
    if (AUTO_RESTART_ON_ERROR) {
      delay(5000);
      ESP.restart();
    }
    while(1) delay(1000);
  }
  
  // Koneksi WiFi
  connectToWiFi();
  
  // Test server
  if (testServerConnection()) {
    if (ENABLE_DEBUG_OUTPUT) {
      Serial.println("✅ Koneksi server berhasil");
    }
    setLED(true);
  } else {
    if (ENABLE_DEBUG_OUTPUT) {
      Serial.println("⚠️ Server tidak dapat diakses, akan tetap mencoba streaming...");
    }
  }
  
  if (ENABLE_DEBUG_OUTPUT) {
    Serial.println("🚀 Memulai streaming...");
    Serial.println("========================================");
  }
}

void loop() {
  if (!cameraInitialized) {
    delay(5000);
    return;
  }
  
  // Cek koneksi WiFi
  if (WiFi.status() != WL_CONNECTED) {
    if (ENABLE_DEBUG_OUTPUT) {
      Serial.println("📶 WiFi terputus, mencoba reconnect...");
    }
    setLED(false);
    connectToWiFi();
    return;
  }
  
  // Kirim frame sesuai interval
  unsigned long currentTime = millis();
  if (currentTime - lastFrameTime >= frameInterval) {
    captureAndSendFrame();
    lastFrameTime = currentTime;
  }
  
  // Print statistik performance
  if (ENABLE_PERFORMANCE_STATS && (currentTime - startTime) > 0) {
    static unsigned long lastStatsTime = 0;
    if (currentTime - lastStatsTime >= 30000) {  // Setiap 30 detik
      printPerformanceStats();
      lastStatsTime = currentTime;
    }
  }
  
  delay(10);  // Prevent watchdog reset
}

bool initializeCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = CAMERA_RESOLUTION;
  config.jpeg_quality = JPEG_QUALITY;
  
  // Konfigurasi buffer berdasarkan PSRAM
  if (psramFound()) {
    config.fb_count = 2;
    if (ENABLE_DEBUG_OUTPUT) {
      Serial.println("📷 PSRAM ditemukan, menggunakan double buffering");
    }
  } else {
    config.fb_count = 1;
    if (ENABLE_DEBUG_OUTPUT) {
      Serial.println("📷 PSRAM tidak ditemukan, menggunakan single buffer");
    }
  }
  
  // Inisialisasi kamera
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    if (ENABLE_DEBUG_OUTPUT) {
      Serial.printf("❌ Inisialisasi kamera gagal: 0x%x\n", err);
    }
    return false;
  }
  
  // Konfigurasi sensor
  configureCameraSensor();
  
  return true;
}

void configureCameraSensor() {
  sensor_t* s = esp_camera_sensor_get();
  if (s == NULL) return;
  
  s->set_brightness(s, CAMERA_BRIGHTNESS);
  s->set_contrast(s, CAMERA_CONTRAST);
  s->set_saturation(s, CAMERA_SATURATION);
  s->set_whitebal(s, CAMERA_AWB);
  s->set_awb_gain(s, CAMERA_AWB);
  s->set_wb_mode(s, 0);
  s->set_exposure_ctrl(s, CAMERA_AEC);
  s->set_aec2(s, 0);
  s->set_ae_level(s, 0);
  s->set_aec_value(s, 300);
  s->set_gain_ctrl(s, CAMERA_AGC);
  s->set_agc_gain(s, 0);
  s->set_gainceiling(s, (gainceiling_t)0);
  s->set_bpc(s, 0);
  s->set_wpc(s, 1);
  s->set_raw_gma(s, 1);
  s->set_lenc(s, 1);
  s->set_hmirror(s, CAMERA_HMIRROR);
  s->set_vflip(s, CAMERA_VFLIP);
  s->set_dcw(s, 1);
  s->set_colorbar(s, 0);
}

void connectToWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  if (ENABLE_DEBUG_OUTPUT) {
    Serial.printf("📶 Menghubungkan ke WiFi: %s", WIFI_SSID);
  }
  
  unsigned long startTime = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - startTime) < WIFI_CONNECT_TIMEOUT) {
    delay(500);
    if (ENABLE_DEBUG_OUTPUT) {
      Serial.print(".");
    }
    
    // Blink LED saat connecting
    if (ENABLE_LED_INDICATOR) {
      digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    }
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    if (ENABLE_DEBUG_OUTPUT) {
      Serial.println();
      Serial.printf("✅ WiFi terhubung! IP: %s\n", WiFi.localIP().toString().c_str());
      Serial.printf("📶 Kekuatan sinyal: %d dBm\n", WiFi.RSSI());
    }
    setLED(true);
    errorCount = 0;  // Reset error count
  } else {
    if (ENABLE_DEBUG_OUTPUT) {
      Serial.println();
      Serial.println("❌ Koneksi WiFi gagal!");
    }
    setLED(false);
    errorCount++;
    
    if (AUTO_RESTART_ON_ERROR && errorCount >= MAX_ERRORS_BEFORE_RESTART) {
      if (ENABLE_DEBUG_OUTPUT) {
        Serial.println("🔄 Terlalu banyak error, restart...");
      }
      delay(5000);
      ESP.restart();
    }
    
    delay(RETRY_DELAY);
  }
}

bool testServerConnection() {
  String url = String(SERVER_URL) + "/api/health";
  
  http.begin(url);
  http.setTimeout(HTTP_TIMEOUT);
  
  int responseCode = http.GET();
  http.end();
  
  if (responseCode == 200) {
    if (ENABLE_DEBUG_OUTPUT) {
      Serial.printf("🌐 Server merespons dengan baik (kode: %d)\n", responseCode);
    }
    return true;
  } else {
    if (ENABLE_DEBUG_OUTPUT) {
      Serial.printf("❌ Server tidak merespons (kode: %d)\n", responseCode);
    }
    return false;
  }
}

void captureAndSendFrame() {
  // Ambil frame dari kamera
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) {
    if (ENABLE_DEBUG_OUTPUT) {
      Serial.println("❌ Gagal mengambil frame dari kamera");
    }
    errorCount++;
    checkErrorLimit();
    return;
  }
  
  // Kirim frame ke server
  bool success = sendFrameToServer(fb->buf, fb->len);
  
  if (success) {
    errorCount = 0;  // Reset error count
    totalFramesSent++;
    totalBytesSent += fb->len;
    
    if (ENABLE_DEBUG_OUTPUT) {
      Serial.printf("📤 Frame #%lu terkirim (%d bytes)\n", totalFramesSent, fb->len);
    }
    
    // Blink LED untuk indikasi sukses
    if (ENABLE_LED_INDICATOR) {
      digitalWrite(LED_PIN, LOW);
      delay(20);
      digitalWrite(LED_PIN, HIGH);
    }
  } else {
    errorCount++;
    if (ENABLE_DEBUG_OUTPUT) {
      Serial.printf("❌ Gagal kirim frame (error ke-%d)\n", errorCount);
    }
    checkErrorLimit();
  }
  
  // Kembalikan frame buffer
  esp_camera_fb_return(fb);
}

bool sendFrameToServer(uint8_t* imageData, size_t imageSize) {
  if (imageSize == 0) return false;
  
  String url = String(SERVER_URL) + "/api/stream/" + String(DEVICE_ID) + "?key=" + String(DEVICE_API_KEY);
  
  http.begin(url);
  http.addHeader("Content-Type", "image/jpeg");
  http.addHeader("User-Agent", "ESP32-CAM-Universal/1.0");
  http.setTimeout(HTTP_TIMEOUT);
  
  int responseCode = http.POST(imageData, imageSize);
  bool success = (responseCode == 200);
  
  if (!success && ENABLE_DEBUG_OUTPUT) {
    if (responseCode == 401) {
      Serial.println("🔑 Error 401: Periksa Device ID dan API Key!");
    } else if (responseCode == 403) {
      Serial.println("🔑 Error 403: API Key tidak cocok dengan Device ID!");
    } else if (responseCode > 0) {
      Serial.printf("⚠️ Server error: %d\n", responseCode);
    } else {
      Serial.printf("❌ Network error: %d\n", responseCode);
    }
  }
  
  http.end();
  return success;
}

void checkErrorLimit() {
  if (AUTO_RESTART_ON_ERROR && errorCount >= MAX_ERRORS_BEFORE_RESTART) {
    if (ENABLE_DEBUG_OUTPUT) {
      Serial.println("🔄 Terlalu banyak error berturut-turut, restart...");
    }
    delay(5000);
    ESP.restart();
  }
}

void setLED(bool state) {
  if (ENABLE_LED_INDICATOR) {
    digitalWrite(LED_PIN, state ? HIGH : LOW);
  }
}

void blinkLED(int times, int delayMs) {
  if (!ENABLE_LED_INDICATOR) return;
  
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(delayMs);
    digitalWrite(LED_PIN, LOW);
    delay(delayMs);
  }
}

void printConfiguration() {
  Serial.println("📋 Konfigurasi Saat Ini:");
  Serial.printf("   WiFi SSID: %s\n", WIFI_SSID);
  Serial.printf("   Server: %s\n", SERVER_URL);
  Serial.printf("   Device ID: %s\n", DEVICE_ID);
  Serial.printf("   Frame Rate: %d FPS\n", FRAME_RATE);
  Serial.printf("   Resolusi: %s\n", getResolutionName(CAMERA_RESOLUTION));
  Serial.printf("   Kualitas JPEG: %d\n", JPEG_QUALITY);
  Serial.printf("   PSRAM: %s\n", psramFound() ? "Tersedia" : "Tidak tersedia");
  Serial.println("----------------------------------------");
}

void printPerformanceStats() {
  unsigned long uptime = (millis() - startTime) / 1000;
  float avgFPS = (float)totalFramesSent / (uptime / 60.0);  // FPS rata-rata per menit
  float avgKBps = (float)totalBytesSent / 1024.0 / uptime;  // KB/s rata-rata
  
  Serial.println("📊 Statistik Performance:");
  Serial.printf("   Uptime: %lu detik\n", uptime);
  Serial.printf("   Total frames: %lu\n", totalFramesSent);
  Serial.printf("   Total data: %.2f MB\n", (float)totalBytesSent / 1024.0 / 1024.0);
  Serial.printf("   Rata-rata FPS: %.1f\n", avgFPS);
  Serial.printf("   Rata-rata bandwidth: %.1f KB/s\n", avgKBps);
  Serial.printf("   Error count: %d\n", errorCount);
  Serial.printf("   Free heap: %d bytes\n", ESP.getFreeHeap());
  Serial.println("----------------------------------------");
}

const char* getResolutionName(framesize_t resolution) {
  switch(resolution) {
    case FRAMESIZE_96X96: return "96x96";
    case FRAMESIZE_QQVGA: return "160x120";
    case FRAMESIZE_QCIF: return "176x144";
    case FRAMESIZE_HQVGA: return "240x176";
    case FRAMESIZE_240X240: return "240x240";
    case FRAMESIZE_QVGA: return "320x240";
    case FRAMESIZE_CIF: return "400x296";
    case FRAMESIZE_HVGA: return "480x320";
    case FRAMESIZE_VGA: return "640x480";
    case FRAMESIZE_SVGA: return "800x600";
    case FRAMESIZE_XGA: return "1024x768";
    case FRAMESIZE_HD: return "1280x720";
    case FRAMESIZE_SXGA: return "1280x1024";
    case FRAMESIZE_UXGA: return "1600x1200";
    default: return "Unknown";
  }
}
