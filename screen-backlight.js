const SerialPort = require("serialport")
const Readline = require("@serialport/parser-readline")
const robot = require("robotjs")

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

function randInt(min = 0, max = 255) {
  return Math.floor(Math.random() * max) + min;
}

function hexToRGB(h) {
  let r = 0, g = 0, b = 0;

  // 3 digits
  if (h.length == 4) {
    r = "0x" + h[1] + h[1];
    g = "0x" + h[2] + h[2];
    b = "0x" + h[3] + h[3];

  // 6 digits
  } else if (h.length == 6) {
    r = "0x" + h[0] + h[1];
    g = "0x" + h[2] + h[3];
    b = "0x" + h[4] + h[5];
  }
  
  return [parseInt(r), parseInt(g), parseInt(b)];
}

function HSLToRGB(h, s, l) {
  // Must be fractions of 1
  s /= 100;
  l /= 100;

  let c = (1 - Math.abs(2 * l - 1)) * s,
      x = c * (1 - Math.abs((h / 60) % 2 - 1)),
      m = l - c/2,
      r = 0,
      g = 0,
      b = 0;
  
  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return [r, g, b];
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
  
  let size = robot.getScreenSize();
  let mid = { x: size.width / 2, y: size.height / 2}
  let cords = [
    [mid.x-100, mid.y-100],
    [mid.x, mid.y-100],
    [mid.x+100, mid.y-100],
    [mid.x-100, mid.y],
    [mid.x, mid.y],
    [mid.x+100, mid.y],
    [mid.x-100, mid.y+100],
    [mid.x, mid.y+100],
    [mid.x+100, mid.y+100]
  ]

  // Animation loop
  while (true) {
    if (isReady) {

      let color = [0, 0, 0]

      for (let i = 0; i < cords.length; i++) {
        let c = hexToRGB(robot.getPixelColor(cords[i][0], cords[i][1]))
        color[0] += c[0]
        color[1] += c[1]
        color[2] += c[2]
      }

      color[0] = Math.floor(color[0] / cords.length)
      color[1] = Math.floor(color[1] / cords.length)
      color[2] = Math.floor(color[2] / cords.length)

      setAll(color, 0)

      await timer(4)
    } else {
      // Sleep 100ms to don't waste resources if no controller is connected
      await timer(100)
    }
  }
})
