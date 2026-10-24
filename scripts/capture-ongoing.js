import puppeteer from 'puppeteer';
import path from 'path';

const artifactDir = 'C:\\Users\\johnc\\.gemini\\antigravity\\brain\\ab21e7b8-1a56-456b-aedf-459291632061';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function captureOngoing() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

  // Reopen tournament so it's ongoing, not ended
  console.log('Reopening tournament to test ongoing state...');
  await page.evaluate(() => {
    const raw = localStorage.getItem('freefire_multi_tournament_store_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.state?.tournaments?.[0]) {
        parsed.state.tournaments[0].isEnded = false;
        parsed.state.tournaments[0].settings.isManuallyEnded = false;
        localStorage.setItem('freefire_multi_tournament_store_v2', JSON.stringify(parsed));
      }
    }
  });
  await page.reload({ waitUntil: 'networkidle0' });

  // Switch to graphic
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((x) => x.textContent?.includes('Standings Graphic'));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  const graphicEl = await page.waitForSelector('#result-graphic', { timeout: 8000 });
  if (graphicEl) {
    console.log('Capturing Ongoing 16:9 Landscape Graphic...');
    await graphicEl.screenshot({
      path: path.join(artifactDir, 'screenshot-ongoing-landscape.png'),
    });
  }

  // Switch to 4:5 Portrait
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((x) => x.textContent?.includes('4:5 Portrait'));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  if (graphicEl) {
    console.log('Capturing Ongoing 4:5 Portrait Graphic...');
    await graphicEl.screenshot({
      path: path.join(artifactDir, 'screenshot-ongoing-portrait.png'),
    });
  }

  await browser.close();
  console.log('Ongoing captures completed successfully.');
}

captureOngoing().catch(console.error);
