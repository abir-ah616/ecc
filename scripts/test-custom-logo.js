import puppeteer from 'puppeteer';
import path from 'path';

const artifactDir = 'C:\\Users\\johnc\\.gemini\\antigravity\\brain\\ab21e7b8-1a56-456b-aedf-459291632061';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testUploadLogo() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // Update squad #1 and squad #2 with a logo in localStorage
  await page.evaluate(() => {
    const raw = localStorage.getItem('freefire_multi_tournament_store_v2');
    if (!raw) return;
    const data = JSON.parse(raw);
    const activeTourn = data.state.tournaments.find(t => t.id === data.state.activeTournamentId);
    if (activeTourn && activeTourn.teams.length > 1) {
      // Small test badge dataUrl
      const badge1 = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="%23e02a36"/><text x="16" y="22" font-size="16" font-family="sans-serif" font-weight="bold" text-anchor="middle" fill="white">AX</text></svg>';
      const badge2 = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="%23d9a93b"/><text x="16" y="22" font-size="16" font-family="sans-serif" font-weight="bold" text-anchor="middle" fill="black">BD</text></svg>';
      activeTourn.teams[0].logoUrl = badge1;
      activeTourn.teams[1].logoUrl = badge2;
      data.state.currentTab = 'results';
      localStorage.setItem('freefire_multi_tournament_store_v2', JSON.stringify(data));
    }
  });

  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({
    path: path.join(artifactDir, 'screenshot-graphic-custom-logo-rendered.png')
  });

  console.log('Screenshot saved: screenshot-graphic-custom-logo-rendered.png');
  await browser.close();
}

testUploadLogo().catch(console.error);
