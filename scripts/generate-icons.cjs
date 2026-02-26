const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Generate a simple SVG icon with violet background and TB text
function generateSVG(size) {
  const fontSize = Math.round(size * 0.35);
  const radius = Math.round(size * 0.15);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="#7c3aed"/>
  <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="${fontSize}" fill="white">TB</text>
</svg>`;
}

async function main() {
  const publicDir = path.join(__dirname, '..', 'public');

  // Generate PNGs from SVGs using sharp
  const sizes = [
    { name: 'pwa-192x192.png', size: 192 },
    { name: 'pwa-512x512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
  ];

  for (const { name, size } of sizes) {
    const svg = Buffer.from(generateSVG(size));
    await sharp(svg).png().toFile(path.join(publicDir, name));
    console.log(`Created ${name}`);
  }

  // Create favicon.ico (actually a 32x32 PNG - browsers accept it)
  const faviconSvg = Buffer.from(generateSVG(32));
  await sharp(faviconSvg).png().toFile(path.join(publicDir, 'favicon.ico'));
  console.log('Created favicon.ico');

  // Clean up any SVG files from previous run
  for (const f of ['pwa-192x192.svg', 'pwa-512x512.svg', 'apple-touch-icon.svg', 'favicon.svg']) {
    const p = path.join(publicDir, f);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }

  console.log('All icons generated in public/');
}

main().catch(console.error);
