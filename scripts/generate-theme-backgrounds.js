import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const targetDir = 'c:\\Users\\johnc\\OneDrive\\Desktop\\esp calc\\public\\assets';

// Color definitions for each theme
const themes = [
  {
    name: 'crimson',
    colorShift: (r, g, b) => {
      const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      return [
        Math.min(255, Math.floor(lum * 220 + 20)),
        Math.min(255, Math.floor(lum * 25)),
        Math.min(255, Math.floor(lum * 35)),
      ];
    },
  },
  {
    name: 'blue',
    colorShift: (r, g, b) => {
      const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      return [
        Math.min(255, Math.floor(lum * 25)),
        Math.min(255, Math.floor(lum * 130 + 15)),
        Math.min(255, Math.floor(lum * 255 + 30)),
      ];
    },
  },
  {
    name: 'gold',
    colorShift: (r, g, b) => {
      const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      return [
        Math.min(255, Math.floor(lum * 235 + 25)),
        Math.min(255, Math.floor(lum * 175 + 15)),
        Math.min(255, Math.floor(lum * 40)),
      ];
    },
  },
  {
    name: 'emerald',
    colorShift: (r, g, b) => {
      const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      return [
        Math.min(255, Math.floor(lum * 20)),
        Math.min(255, Math.floor(lum * 220 + 25)),
        Math.min(255, Math.floor(lum * 130)),
      ];
    },
  },
  {
    name: 'violet',
    colorShift: (r, g, b) => {
      const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      return [
        Math.min(255, Math.floor(lum * 180 + 20)),
        Math.min(255, Math.floor(lum * 50)),
        Math.min(255, Math.floor(lum * 255 + 30)),
      ];
    },
  },
];

async function generate() {
  const baseLandscape = path.join(targetDir, 'bg-main.jpg');
  const basePortrait = path.join(targetDir, 'bg-portrait.jpg');

  const landRaw = await sharp(baseLandscape).raw().toBuffer({ resolveWithObject: true });
  const portRaw = await sharp(basePortrait).raw().toBuffer({ resolveWithObject: true });

  for (const th of themes) {
    console.log(`Generating theme backgrounds for ${th.name}...`);

    // Process landscape (1920x1080)
    const lBuf = Buffer.from(landRaw.data);
    for (let i = 0; i < lBuf.length; i += landRaw.info.channels) {
      const r = lBuf[i];
      const g = lBuf[i + 1];
      const b = lBuf[i + 2];
      const [nr, ng, nb] = th.colorShift(r, g, b);
      lBuf[i] = nr;
      lBuf[i + 1] = ng;
      lBuf[i + 2] = nb;
    }

    await sharp(lBuf, {
      raw: {
        width: landRaw.info.width,
        height: landRaw.info.height,
        channels: landRaw.info.channels,
      },
    })
      .jpeg({ quality: 85, mozjpeg: true })
      .toFile(path.join(targetDir, `bg-${th.name}.jpg`));

    // Process portrait (1080x1350)
    const pBuf = Buffer.from(portRaw.data);
    for (let i = 0; i < pBuf.length; i += portRaw.info.channels) {
      const r = pBuf[i];
      const g = pBuf[i + 1];
      const b = pBuf[i + 2];
      const [nr, ng, nb] = th.colorShift(r, g, b);
      pBuf[i] = nr;
      pBuf[i + 1] = ng;
      pBuf[i + 2] = nb;
    }

    await sharp(pBuf, {
      raw: {
        width: portRaw.info.width,
        height: portRaw.info.height,
        channels: portRaw.info.channels,
      },
    })
      .jpeg({ quality: 85, mozjpeg: true })
      .toFile(path.join(targetDir, `bg-${th.name}-portrait.jpg`));
  }

  console.log('Successfully generated all theme backgrounds.');
}

generate().catch(console.error);
