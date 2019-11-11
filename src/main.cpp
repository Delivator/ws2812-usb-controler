#include <Arduino.h>
#include <string.h>
#include <FastLED.h>

#define LED_PIN   6
#define NUM_LEDS  12

CRGB leds[NUM_LEDS];

String inString = "";
char *ptr;

void setup() {
  Serial.begin(115200);
  Serial.println("<Arduino is ready>");
  FastLED.addLeds<WS2812, LED_PIN, GRB>(leds, NUM_LEDS);
}

void loop() {
  while (Serial.available() > 0) {
    char inChar = Serial.read();
    inString += inChar;
    if (inChar == '\n') {
      inString.trim();

      if (inString == "whoareyou") {
        Serial.println("ws2812-usb-controller");
        inString = "";
        return;
      }
      
      char inStr[inString.length() + 1];
      strcpy(inStr, inString.c_str());
      char *inStrPtr = inStr;
      
      int ledData[4] = {0, 0, 0, 0};
      int i = 0;
      ptr = strtok(inStrPtr, ",");

      while (ptr != NULL) {
        ledData[i] = atoi(ptr);
        ptr = strtok(NULL, ",");
        i++;
      }

      ledData[0] = constrain(ledData[0], 0, NUM_LEDS);  // LED index
      ledData[1] = constrain(ledData[1], 0, 255);       // Red value (0-255)
      ledData[2] = constrain(ledData[2], 0, 255);       // Green value
      ledData[3] = constrain(ledData[3], 0, 255);       // Blue value

      leds[ledData[0]] = CRGB(ledData[1], ledData[2], ledData[3]);
      FastLED.show();

      inString = "";
    }
  }
}