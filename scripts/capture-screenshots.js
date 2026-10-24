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

  // Clear localStorage and reload
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));

  // 1. Capture Home View
  console.log('Capturing Home Dashboard...');
  await page.screenshot({
    path: path.join(artifactDir, 'screenshot-home-dashboard.png'),
  });

  // 2. Click Create Tournament tab
  console.log('Navigating to Create Tournament view...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((x) => x.textContent?.includes('Create Tournament'));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({
    path: path.join(artifactDir, 'screenshot-create-tournament.png'),
  });

  // 3. Load full demo tournament via header button to have rich history
  console.log('Loading full 5-match demo data...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((x) => x.textContent?.includes('Load Full 5-Match Demo'));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  // 4. Click Tournament History tab
  console.log('Capturing History Archive...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((x) => x.textContent?.trim() === 'History');
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({
    path: path.join(artifactDir, 'screenshot-history-matrix.png'),
  });

  // 5. Switch to Standings Graphic
  console.log('Switching to Standings Graphic...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((x) => x.textContent?.includes('Standings Graphic'));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  const graphicEl = await page.waitForSelector('#result-graphic', { timeout: 8000 });
  if (graphicEl) {
    console.log('Capturing Landscape Graphic (Crimson)...');
    await graphicEl.screenshot({
      path: path.join(artifactDir, 'screenshot-graphic-landscape-ended-champion.png'),
    });

    // 6. Test Cyber Blue Theme
    console.log('Switching to Cyber Blue Theme...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find((x) => x.textContent?.includes('Cyber Blue'));
      if (b) b.click();
    });
    await new Promise((r) => setTimeout(r, 500));
    await graphicEl.screenshot({
      path: path.join(artifactDir, 'screenshot-graphic-blue-theme.png'),
    });

    // 7. Test Championship Gold Theme
    console.log('Switching to Championship Gold Theme...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find((x) => x.textContent?.includes('Championship Gold'));
      if (b) b.click();
    });
    await new Promise((r) => setTimeout(r, 500));
    await graphicEl.screenshot({
      path: path.join(artifactDir, 'screenshot-graphic-gold-theme.png'),
    });
  }

  // 8. Test Champion Rush Mode with Crown on Left of Position
  console.log('Testing Champion Rush Mode with Crown on Left of Position...');
  await page.evaluate(() => {
    const raw = localStorage.getItem('freefire_multi_tournament_store_v2');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.state?.tournaments?.[0]) {
          parsed.state.tournaments[0].settings.mode = 'CHAMPION_RUSH';
          parsed.state.tournaments[0].settings.championRush = {
            targetPoints: 50,
            maxMatches: 8,
            allowSameMatchBooyahActivation: false,
          };
          localStorage.setItem('freefire_multi_tournament_store_v2', JSON.stringify(parsed));
        }
      }
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((x) => x.textContent?.includes('Standings Graphic'));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  const rushGraphicEl = await page.$('#result-graphic');
  if (rushGraphicEl) {
    await rushGraphicEl.screenshot({
      path: path.join(artifactDir, 'screenshot-rush-crown-graphic.png'),
    });
  }

  await browser.close();
  console.log('All upgraded screenshots captured successfully.');
}

capture().catch((err) => {
  console.error('Capture error:', err);
  process.exit(1);
});
