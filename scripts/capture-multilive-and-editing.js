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

  // Clear localStorage and populate 2 LIVE tournaments to verify multi-live behavior
  console.log('Setting up 2 live tournaments...');
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload({ waitUntil: 'networkidle0' });

  // Create a second live tournament via store
  await page.evaluate(() => {
    const raw = localStorage.getItem('freefire_multi_tournament_store_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      // Tournament 1 is default
      // Add Tournament 2 (Under-18 Scrims)
      const t2 = {
        id: 'tourn_live_2',
        name: 'FF UNDER-18 PRO SCRIMS - ROOM 2',
        createdAt: 'Oct 24, 2026, 08:30 PM',
        createdAtTimestamp: Date.now() - 3600000,
        settings: {
          ...parsed.state.tournaments[0].settings,
          name: 'FF UNDER-18 PRO SCRIMS - ROOM 2',
          roundOrDay: 'WEEK 2 - DAY 3',
          hostName: 'ESPORTS BANGLADESH HUB',
          sponsorName: 'LOGITECH G',
          totalMatchesPlanned: 3,
          isManuallyEnded: false,
        },
        teams: [
          { id: 't2_1', name: 'APEX LEGENDS BD', shortCode: 'APX' },
          { id: 't2_2', name: 'CYBER TIGERS', shortCode: 'CT' },
          { id: 't2_3', name: 'DELTA FORCE', shortCode: 'DF' },
          { id: 't2_4', name: 'ELITE WARRIORS', shortCode: 'EW' },
        ],
        matches: [
          {
            id: 'm1_t2',
            matchNumber: 1,
            isCompleted: true,
            createdAt: Date.now() - 2000000,
            entries: {
              't2_1': { teamId: 't2_1', placement: 1, kills: 8 },
              't2_2': { teamId: 't2_2', placement: 2, kills: 6 },
              't2_3': { teamId: 't2_3', placement: 3, kills: 4 },
              't2_4': { teamId: 't2_4', placement: 4, kills: 2 },
            },
          },
          {
            id: 'm2_t2',
            matchNumber: 2,
            isCompleted: false,
            createdAt: Date.now() - 1000000,
            entries: {
              't2_1': { teamId: 't2_1', placement: null, kills: 0 },
              't2_2': { teamId: 't2_2', placement: null, kills: 0 },
              't2_3': { teamId: 't2_3', placement: null, kills: 0 },
              't2_4': { teamId: 't2_4', placement: null, kills: 0 },
            },
          },
        ],
        isEnded: false,
      };

      parsed.state.tournaments = [parsed.state.tournaments[0], t2];
      parsed.state.currentTab = 'home';
      localStorage.setItem('freefire_multi_tournament_store_v2', JSON.stringify(parsed));
    }
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));

  // 1. Capture Clean Home Page with Multiple Live Tournaments (No tournament controls on top!)
  console.log('Capturing Clean Home Page with Multiple Live Tournaments...');
  await page.screenshot({
    path: path.join(artifactDir, 'screenshot-home-clean-multilive.png'),
  });

  // 2. Click Create Tournament tab
  console.log('Navigating to Create Tournament with logo uploads...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((x) => x.textContent?.includes('Create Tournament'));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  console.log('Capturing Create Tournament view with Logo uploaders...');
  await page.screenshot({
    path: path.join(artifactDir, 'screenshot-create-with-logos.png'),
  });

  // 3. Navigate to Edit Tournament view
  console.log('Navigating to Edit Tournament view for Tournament 2...');
  await page.evaluate(() => {
    // Click Home first
    const btns = Array.from(document.querySelectorAll('button'));
    const bHome = btns.find((x) => x.textContent?.trim() === 'Home');
    if (bHome) bHome.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  await page.evaluate(() => {
    // Click Edit on second tournament
    const editBtns = Array.from(document.querySelectorAll('button')).filter((b) => b.textContent?.includes('Edit'));
    if (editBtns[1]) editBtns[1].click();
    else if (editBtns[0]) editBtns[0].click();
  });
  await new Promise((r) => setTimeout(r, 600));

  console.log('Capturing Edit Tournament view...');
  await page.screenshot({
    path: path.join(artifactDir, 'screenshot-edit-tournament-view.png'),
  });

  // 4. Navigate into tournament workspace and view Standings Graphic
  console.log('Viewing Standings Graphic inside tournament workspace...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const bGraphic = btns.find((x) => x.textContent?.includes('Standings Graphic'));
    if (bGraphic) bGraphic.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  const graphicEl = await page.waitForSelector('#result-graphic', { timeout: 8000 });
  if (graphicEl) {
    console.log('Capturing Standings Graphic showing logos next to team names...');
    await graphicEl.screenshot({
      path: path.join(artifactDir, 'screenshot-graphic-with-logos.png'),
    });
  }

  await browser.close();
  console.log('All verification screenshots captured successfully.');
}

capture().catch((err) => {
  console.error('Capture error:', err);
  process.exit(1);
});
