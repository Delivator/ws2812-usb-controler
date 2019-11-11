const SerialPort = require("serialport")
const Readline = require("@serialport/parser-readline")
const inquirer = require("inquirer")

const PATH = "COM8"
const LED_COUNT = 12

const port = new SerialPort(PATH, { baudRate: 115200 }, error => {
  if (error) {
    console.error(error)
    SerialPort.list()
      .catch(console.error)
      .then(console.log)
  }
})

const parser = new Readline()
let isReady = false
let retries = 5

port.pipe(parser)

function timer(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function setLed(index, color) {
  return new Promise((resolve, reject) => {
    port.write(`${index},${color.join(",")}\n`, error => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}

function setAll(color = [0, 0, 0], delay = 0) {
  return new Promise(async (resolve, reject) => {
    for (let i = 0; i < LED_COUNT; i++) {
      setLed(i, color).catch(reject)
      await timer(delay)
    }
    resolve()
  })
}

parser.on("data", line => {
  console.log(`> ${line}`)
  if (line.trim() === "ws2812-usb-controller") {
    console.log("Found a compatible controller")
    isReady = true
  }
})

port.on("close", () => {
  console.log("Serial connection closed")
  isReady = false
  while (retries > 0) {
    retries--
    console.log(`Try reconnecting... ${retries} Retrie${retries > 1 ? "s" : ""} left`)
    port.open(error => {
      if (error) console.error(error)
    })
  }
})

port.on("open", async () => {
  retries = 5;
  console.log("Connected to serial port", port.path)
  console.log("Checking if device is compatible")
  port.write("whoareyou\n")

  // Animation loop
  while (true) {
    if (isReady) {
      // all leds off no delay
      await setAll([0, 0, 0], 0)
      // all leds white with a delay of 50ms
      await setAll([255, 255, 255], 50)
      await setAll([0, 0, 0], 50)
    } else {
      // Sleep 100ms to don't waste resources if no controller is connected
      await timer(100);
    }
  }
})
