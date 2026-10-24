const puppeteer = require('puppeteer');
const path = require('path');

const ARTIFACT_DIR = path.resolve('C:/Users/johnc/.gemini/antigravity/brain/ab21e7b8-1a56-456b-aedf-459291632061');

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to app...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));

  // 1. Capture Desktop Home View (Showing Clean Header & Simple Footer)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'clean-home-desktop.png'), fullPage: true });
  console.log('Saved clean-home-desktop.png');

  // 2. Click "Continue Match Scoring" to enter tournament workspace
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent && b.textContent.includes('Continue Match Scoring')
    );
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  // Capture Desktop Workspace (Showing Clean Header with dropdown Theme, TabBar with flat buttons, and Simple Footer)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'clean-workspace-desktop.png'), fullPage: true });
  console.log('Saved clean-workspace-desktop.png');

  // 3. Mobile Viewport test (390 x 844)
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await mobilePage.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));

  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'clean-home-mobile.png'), fullPage: true });
  console.log('Saved clean-home-mobile.png');

  // Click "Continue Match Scoring" on mobile
  await mobilePage.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent && b.textContent.includes('Continue Match Scoring')
    );
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'clean-workspace-mobile.png'), fullPage: true });
  console.log('Saved clean-workspace-mobile.png');

  await browser.close();
  console.log('Finished capturing screenshots!');
}

run().catch((err) => {
  console.error('Error running capture script:', err);
  process.exit(1);
});
