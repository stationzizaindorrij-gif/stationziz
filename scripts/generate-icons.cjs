const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 implementation for PNG chunks
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = (crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)) >>> 0;
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const body = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(body);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, body, crcBuf]);
}

function createPng(width, height, pixelFn) {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = createChunk('IHDR', ihdr);

  // Scanlines with filter byte 0 at start of each line
  const rawData = Buffer.alloc((width * 4 + 1) * height);
  let pos = 0;

  for (let y = 0; y < height; y++) {
    rawData[pos++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      rawData[pos++] = r;
      rawData[pos++] = g;
      rawData[pos++] = b;
      rawData[pos++] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

// Function to generate the icon artwork (Station Ziz Gas Station & Droplet)
function drawStationIcon(isMaskable) {
  return (x, y, w, h) => {
    const nx = x / w;
    const ny = y / h;

    // Background gradient: Rich Royal Indigo (#4338ca to #1e1b4b)
    const bgR = Math.round(67 + (30 - 67) * ny);
    const bgG = Math.round(56 + (27 - 56) * ny);
    const bgB = Math.round(202 + (75 - 202) * ny);

    // If not maskable, we can round the corners for regular icons
    if (!isMaskable) {
      const cornerR = 0.22;
      const dx = Math.max(0, Math.abs(nx - 0.5) - (0.5 - cornerR));
      const dy = Math.max(0, Math.abs(ny - 0.5) - (0.5 - cornerR));
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > cornerR) {
        return [0, 0, 0, 0]; // Transparent outside rounded rect
      }
    }

    // Centered coordinates from -1 to 1
    const cx = (nx - 0.5) * 2;
    const cy = (ny - 0.5) * 2;

    // Scale factor to respect maskable safe zone (must stay inside circle radius 0.75)
    const scale = isMaskable ? 0.68 : 0.76;
    const px = cx / scale;
    const py = cy / scale;

    // Draw Gas Pump body
    // Base cabinet: px in [-0.55, 0.15], py in [-0.45, 0.65]
    const inCabinet = px >= -0.55 && px <= 0.15 && py >= -0.45 && py <= 0.65;
    // Cabinet top roof / header: px in [-0.60, 0.20], py in [-0.60, -0.45]
    const inRoof = px >= -0.60 && px <= 0.20 && py >= -0.60 && py <= -0.45;
    // Base pedastal: px in [-0.65, 0.25], py in [0.65, 0.78]
    const inBase = px >= -0.65 && px <= 0.25 && py >= 0.65 && py <= 0.78;

    // Display screen on cabinet: px in [-0.45, 0.05], py in [-0.35, -0.05]
    const inScreen = px >= -0.45 && px <= 0.05 && py >= -0.35 && py <= -0.05;

    // Droplet symbol in screen or on pump:
    const dropCx = -0.20;
    const dropCy = 0.25;
    const dropDx = (px - dropCx) / 0.18;
    const dropDy = (py - dropCy) / 0.22;
    const inDroplet = (dropDx * dropDx + dropDy * dropDy <= 1 && py >= dropCy) ||
                      (Math.abs(dropDx) <= 1 - (dropCy - py) / 0.35 && py < dropCy && py >= dropCy - 0.35);

    // Pump Hose and Nozzle on right side:
    // Hose arc: from cabinet (0.15, -0.2) curving down to (0.45, 0.3) and up to nozzle (0.45, -0.1)
    const hoseDist = Math.abs(Math.sqrt(Math.pow(px - 0.15, 2) + Math.pow(py - 0.2, 2)) - 0.32);
    const inHose = px >= 0.15 && px <= 0.52 && py >= -0.2 && py <= 0.55 && hoseDist < 0.055;
    
    // Nozzle handle: px in [0.38, 0.55], py in [-0.35, -0.1]
    const inNozzle = px >= 0.38 && px <= 0.52 && py >= -0.35 && py <= -0.1;

    // Compose colors:
    if (inDroplet) {
      // Golden yellow droplet (#fbbf24)
      return [251, 191, 36, 255];
    }
    if (inScreen) {
      // Dark slate screen background (#0f172a)
      // With luminous green text indicator (#34d399) in center
      if (py >= -0.24 && py <= -0.16 && px >= -0.35 && px <= -0.05) {
        return [52, 211, 153, 255];
      }
      return [15, 23, 42, 255];
    }
    if (inCabinet || inRoof || inBase || inNozzle || inHose) {
      // Crisp Pure White / Platinum for pump structure
      return [255, 255, 255, 255];
    }

    // Default background
    return [bgR, bgG, bgB, 255];
  };
}

const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate Icons
console.log('Generating PWA icons...');

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, drawStationIcon(false)));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, drawStationIcon(false)));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, drawStationIcon(true)));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, drawStationIcon(false)));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPng(64, 64, drawStationIcon(false)));

// Also write public/icon.svg
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <defs>
    <linearGradient id="pwa-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
    <linearGradient id="drop-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="115" fill="url(#pwa-bg)"/>
  <!-- Pump base and top -->
  <rect x="140" y="380" width="180" height="28" rx="6" fill="#ffffff"/>
  <rect x="155" y="115" width="150" height="28" rx="6" fill="#ffffff"/>
  <!-- Pump cabinet -->
  <rect x="165" y="143" width="130" height="237" rx="10" fill="#ffffff"/>
  <!-- Pump Screen -->
  <rect x="180" y="170" width="100" height="60" rx="8" fill="#0f172a"/>
  <rect x="195" y="195" width="70" height="10" rx="3" fill="#34d399"/>
  <!-- Droplet -->
  <path d="M230 265 C230 265 205 305 205 325 A25 25 0 0 0 255 325 C255 305 230 265 230 265 Z" fill="url(#drop-grad)"/>
  <!-- Hose & Nozzle -->
  <path d="M295 210 C360 210 380 340 345 350 C330 355 320 340 320 325" stroke="#ffffff" stroke-width="16" stroke-linecap="round" fill="none"/>
  <path d="M345 170 L345 220 L325 240" stroke="#ffffff" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf8');
console.log('PWA icons successfully created in /public !');
