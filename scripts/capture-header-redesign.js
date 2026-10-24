import puppeteer from 'puppeteer';
import path from 'path';

const artifactDir = 'C:\\Users\\johnc\\.gemini\\antigravity\\brain\\ab21e7b8-1a56-456b-aedf-459291632061';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  console.log('Navigating to http://localhost:5173/...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

  // Load full 5-match demo so we have complete data
  console.log('Loading full 5-match demo data...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((x) => x.textContent?.includes('Load Full 5-Match Demo'));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  // Navigate to Standings Graphic
  console.log('Switching to Standings Graphic...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((x) => x.textContent?.includes('Standings Graphic'));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  // Switch to Violet theme (like user screenshot)
  console.log('Selecting Royal Violet theme...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((x) => x.textContent?.includes('Royal Violet') || x.textContent?.includes('Violet'));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // 1. Capture PC Landscape (16:9) Redesigned Graphic
  const graphicEl = await page.waitForSelector('#result-graphic', { timeout: 8000 });
  if (graphicEl) {
    console.log('Capturing PC Landscape (16:9) Redesigned Graphic...');
    await graphicEl.screenshot({
      path: path.join(artifactDir, 'screenshot-redesign-pc-landscape.png'),
    });
  }

  // 2. Switch to 4:5 Portrait mode
  console.log('Switching to 4:5 Portrait mode...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((x) => x.textContent?.includes('4:5 Portrait'));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  const portraitGraphicEl = await page.waitForSelector('#result-graphic', { timeout: 8000 });
  if (portraitGraphicEl) {
    console.log('Capturing Mobile / Portrait (4:5) Redesigned Graphic...');
    await portraitGraphicEl.screenshot({
      path: path.join(artifactDir, 'screenshot-redesign-mobile-portrait.png'),
    });
  }

  // 3. Switch back to Crimson theme to test default
  console.log('Testing Crimson Theme in Landscape...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b169 = btns.find((x) => x.textContent?.includes('16:9 Landscape'));
    if (b169) b169.click();
    const bCrimson = btns.find((x) => x.textContent?.includes('Crimson Red') || x.textContent?.includes('Crimson'));
    if (bCrimson) bCrimson.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  if (graphicEl) {
    await graphicEl.screenshot({
      path: path.join(artifactDir, 'screenshot-redesign-crimson-landscape.png'),
    });
  }

  // 4. Capture Mobile Viewport (on 390px iPhone size)
  console.log('Capturing UI on 390px Mobile Viewport...');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({
    path: path.join(artifactDir, 'screenshot-redesign-mobile-ui-390px.png'),
  });

  await browser.close();
  console.log('All redesigned screenshots captured successfully.');
}

capture().catch((err) => {
  console.error('Capture error:', err);
  process.exit(1);
});
