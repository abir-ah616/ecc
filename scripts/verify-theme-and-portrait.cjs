const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:/Users/johnc/.gemini/antigravity/brain/ab21e7b8-1a56-456b-aedf-459291632061');

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('Navigating to app...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));

  // Verify page title
  const title = await page.title();
  console.log('Page title:', title);

  // Click on "View Standing Graphic"
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent && b.textContent.toLowerCase().includes('standing graphic')
    );
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  // Check theme buttons text
  const themeLabels = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button')).map((b) => b.textContent.trim());
    return buttons;
  });
  console.log('Found "Yellow" theme button:', themeLabels.some((l) => l.includes('Yellow')));
  console.log('Found "V2" theme button:', themeLabels.some((l) => l === 'V2' || l.includes('V2 (Official Broadcast)')));

  // Switch to Portrait 4:5
  await page.evaluate(() => {
    const pBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent && b.textContent.includes('4:5')
    );
    if (pBtn) pBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  // 1. Capture regular Portrait standings (row 12 visibility check)
  const graphicEl = await page.$('#result-graphic');
  if (graphicEl) {
    await graphicEl.screenshot({ path: path.join(ARTIFACT_DIR, 'portrait-regular-standings.png') });
    console.log('Saved portrait-regular-standings.png');
  }

  // 2. Conclude tournament
  await page.evaluate(() => {
    const concludeBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent && b.textContent.includes('Conclude Tournament')
    );
    if (concludeBtn) concludeBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  // 3. Switch to Crimson Red theme
  await page.evaluate(() => {
    const crimsonBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent && b.textContent.includes('Crimson')
    );
    if (crimsonBtn) crimsonBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  // Capture Crimson Portrait Concluded
  if (graphicEl) {
    await graphicEl.screenshot({ path: path.join(ARTIFACT_DIR, 'crimson-portrait-concluded.png') });
    console.log('Saved crimson-portrait-concluded.png');
  }

  // 4. Switch to Landscape 16:9
  await page.evaluate(() => {
    const lBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent && b.textContent.includes('16:9')
    );
    if (lBtn) lBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  // Capture Crimson Landscape Concluded
  if (graphicEl) {
    await graphicEl.screenshot({ path: path.join(ARTIFACT_DIR, 'crimson-landscape-concluded.png') });
    console.log('Saved crimson-landscape-concluded.png');
  }

  // 5. Switch to Cyber Blue
  await page.evaluate(() => {
    const blueBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent && (b.textContent.includes('Cyber Blue') || b.textContent === 'Blue')
    );
    if (blueBtn) blueBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  if (graphicEl) {
    await graphicEl.screenshot({ path: path.join(ARTIFACT_DIR, 'blue-landscape-concluded.png') });
    console.log('Saved blue-landscape-concluded.png');
  }

  // 6. Switch to Yellow
  await page.evaluate(() => {
    const yellowBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent && b.textContent.includes('Yellow')
    );
    if (yellowBtn) yellowBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  if (graphicEl) {
    await graphicEl.screenshot({ path: path.join(ARTIFACT_DIR, 'yellow-landscape-concluded.png') });
    console.log('Saved yellow-landscape-concluded.png');
  }

  // 7. Mobile Device Viewport test (390 x 844 iPhone 12/13/14 size)
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await mobilePage.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));

  // Click on "View Standing Graphic"
  await mobilePage.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent && b.textContent.toLowerCase().includes('standing graphic')
    );
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  // Switch to Portrait 4:5
  await mobilePage.evaluate(() => {
    const pBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent && b.textContent.includes('4:5')
    );
    if (pBtn) pBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile-viewport-preview.png'), fullPage: false });
  console.log('Saved mobile-viewport-preview.png');

  await browser.close();
  console.log('Verification script completed successfully!');
}

run().catch((err) => {
  console.error('Error running verification script:', err);
  process.exit(1);
});
