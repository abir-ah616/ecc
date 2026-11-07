import puppeteer from 'puppeteer';
import path from 'path';

const artifactDir = 'C:\\Users\\johnc\\.gemini\\antigravity\\brain\\ab21e7b8-1a56-456b-aedf-459291632061';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testRush() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

  // Load demo matches
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((x) => x.textContent?.includes('Load Full 5-Match Demo') || x.textContent?.includes('Load Sample 5-Match Data'));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  // Go to Setup, switch to Champion Rush
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((x) => x.textContent?.includes('Setup'));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((x) => x.textContent?.includes('MODE B: CHAMPION RUSH'));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // Go to Results Graphic
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((x) => x.textContent?.includes('Standings Graphic'));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  const graphicEl = await page.waitForSelector('#result-graphic', { timeout: 8000 });
  if (graphicEl) {
    await graphicEl.screenshot({
      path: path.join(artifactDir, 'screenshot-rush-crown-graphic.png'),
    });
  }

  await browser.close();
  console.log('Champion Rush screenshot captured.');
}

testRush().catch(console.error);
