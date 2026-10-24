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

  await new Promise((r) => setTimeout(r, 1200));

  // Click on "View Standing Graphic"
  const clicked = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent && b.textContent.toLowerCase().includes('standing graphic')
    );
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('Clicked Standing Graphic button:', clicked);

  await new Promise((r) => setTimeout(r, 1500));

  // Ensure V2 theme is selected
  await page.evaluate(() => {
    const v2Btn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent && b.textContent.includes('V2')
    );
    if (v2Btn) v2Btn.click();
  });

  await new Promise((r) => setTimeout(r, 1000));

  // 1. Capture Landscape Regular Standings
  const graphicEl = await page.$('#result-graphic');
  if (graphicEl) {
    const shotPath = path.join(ARTIFACT_DIR, 'v2-landscape-regular.png');
    await graphicEl.screenshot({ path: shotPath });
    console.log('Saved v2-landscape-regular.png successfully!');
  } else {
    console.error('Could not find #result-graphic element!');
  }

  // 2. Switch to Portrait (4:5)
  await page.evaluate(() => {
    const portraitBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent && b.textContent.includes('4:5')
    );
    if (portraitBtn) portraitBtn.click();
  });

  await new Promise((r) => setTimeout(r, 1000));

  const graphicElPortrait = await page.$('#result-graphic');
  if (graphicElPortrait) {
    const shotPath = path.join(ARTIFACT_DIR, 'v2-portrait-regular.png');
    await graphicElPortrait.screenshot({ path: shotPath });
    console.log('Saved v2-portrait-regular.png successfully!');
  }

  // 3. Switch back to 16:9 Landscape and Conclude Tournament (Show Grand Champion)
  await page.evaluate(() => {
    const landscapeBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent && b.textContent.includes('16:9')
    );
    if (landscapeBtn) landscapeBtn.click();
  });

  await new Promise((r) => setTimeout(r, 800));

  // Click "Conclude Tournament (Show Final Champion)"
  const concluded = await page.evaluate(() => {
    const concludeBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent && b.textContent.toLowerCase().includes('conclude tournament')
    );
    if (concludeBtn) {
      concludeBtn.click();
      return true;
    }
    return false;
  });
  console.log('Clicked Conclude Tournament button:', concluded);

  await new Promise((r) => setTimeout(r, 1200));

  const graphicElConcluded = await page.$('#result-graphic');
  if (graphicElConcluded) {
    const shotPath = path.join(ARTIFACT_DIR, 'v2-landscape-concluded.png');
    await graphicElConcluded.screenshot({ path: shotPath });
    console.log('Saved v2-landscape-concluded.png successfully!');
  }

  // 4. Switch to Portrait Concluded
  await page.evaluate(() => {
    const portraitBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent && b.textContent.includes('4:5')
    );
    if (portraitBtn) portraitBtn.click();
  });

  await new Promise((r) => setTimeout(r, 1000));

  const graphicElPortraitConcluded = await page.$('#result-graphic');
  if (graphicElPortraitConcluded) {
    const shotPath = path.join(ARTIFACT_DIR, 'v2-portrait-concluded.png');
    await graphicElPortraitConcluded.screenshot({ path: shotPath });
    console.log('Saved v2-portrait-concluded.png successfully!');
  }

  await browser.close();
  console.log('All screenshots completed successfully!');
}

run().catch((err) => {
  console.error('Error running test:', err);
  process.exit(1);
});
