import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const brainDir = 'C:\\Users\\johnc\\.gemini\\antigravity\\brain\\ab21e7b8-1a56-456b-aedf-459291632061';
const targetDir = 'c:\\Users\\johnc\\OneDrive\\Desktop\\esp calc\\public\\assets';

async function main() {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  console.log('Processing bg-main.jpg...');
  await sharp(path.join(brainDir, 'bg_main_1792846119389.jpg'))
    .resize(1920, 1080, { fit: 'cover' })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(path.join(targetDir, 'bg-main.jpg'));

  console.log('Processing bg-portrait.jpg...');
  await sharp(path.join(brainDir, 'bg_portrait_1792846137499.jpg'))
    .resize(1080, 1350, { fit: 'cover' })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(path.join(targetDir, 'bg-portrait.jpg'));

  console.log('Processing shard-overlay.png (transparent alpha key)...');
  const shardRaw = await sharp(path.join(brainDir, 'shard_overlay_black_1792846174025.jpg'))
    .resize(1280, 720, { fit: 'cover' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data: sData, info: sInfo } = shardRaw;
  for (let i = 0; i < sData.length; i += 4) {
    const r = sData[i];
    const g = sData[i + 1];
    const b = sData[i + 2];
    const brightness = Math.max(r, g, b);
    if (brightness < 30) {
      sData[i + 3] = 0; // transparent
    } else {
      sData[i + 3] = Math.min(255, Math.floor((brightness - 30) * 1.5));
    }
  }

  await sharp(sData, {
    raw: {
      width: sInfo.width,
      height: sInfo.height,
      channels: 4,
    },
  })
    .png({ compressionLevel: 9, palette: true, colours: 128 })
    .toFile(path.join(targetDir, 'shard-overlay.png'));

  console.log('Processing logo-placeholder.png (transparent alpha key)...');
  const logoRaw = await sharp(path.join(brainDir, 'logo_placeholder_1792846202085.jpg'))
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data: lData, info: lInfo } = logoRaw;
  for (let i = 0; i < lData.length; i += 4) {
    const r = lData[i];
    const g = lData[i + 1];
    const b = lData[i + 2];
    const brightness = Math.max(r, g, b);
    if (brightness < 20) {
      lData[i + 3] = 0;
    } else {
      lData[i + 3] = Math.min(255, Math.floor((brightness - 20) * 1.3));
    }
  }

  await sharp(lData, {
    raw: {
      width: lInfo.width,
      height: lInfo.height,
      channels: 4,
    },
  })
    .png({ compressionLevel: 9 })
    .toFile(path.join(targetDir, 'logo-placeholder.png'));

  console.log('Finished processing all 4 assets.');

  // Check file sizes
  const files = ['bg-main.jpg', 'bg-portrait.jpg', 'shard-overlay.png', 'logo-placeholder.png'];
  for (const f of files) {
    const stat = fs.statSync(path.join(targetDir, f));
    console.log(`${f}: ${(stat.size / 1024).toFixed(1)} KB`);
  }
}

main().catch(console.error);
