import puppeteer from 'puppeteer';
import path from 'path';

const artifactDir = 'C:\\Users\\johnc\\.gemini\\antigravity\\brain\\ab21e7b8-1a56-456b-aedf-459291632061';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // 1. Navigate to Edit Tournament view
  await page.evaluate(() => {
    const raw = localStorage.getItem('freefire_multi_tournament_store_v2');
    if (!raw) return;
    const data = JSON.parse(raw);
    data.state.currentTab = 'edit';
    localStorage.setItem('freefire_multi_tournament_store_v2', JSON.stringify(data));
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({
    path: path.join(artifactDir, 'screenshot-edit-view-with-tournament-logo.png')
  });
  console.log('Saved screenshot-edit-view-with-tournament-logo.png');

  // 2. Perform an edit: change tournament title, host, and squad #1 name, then save
  await page.evaluate(() => {
    const titleInput = document.querySelector('input[placeholder*="FREE FIRE CHAMPIONSHIP"]');
    if (titleInput) {
      titleInput.value = 'BANGLADESH PRO LEAGUE S1';
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));
      titleInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const hostInput = document.querySelector('input[placeholder*="BD ESPORTS ARENA"]');
    if (hostInput) {
      hostInput.value = 'GARENA OFFICIAL BD';
      hostInput.dispatchEvent(new Event('input', { bubbles: true }));
      hostInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  // Click Save
  const saveBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent && b.textContent.includes('SAVE TOURNAMENT CHANGES'));
  });
  if (saveBtn) {
    const elem = saveBtn.asElement();
    if (elem) await elem.click();
    await new Promise(r => setTimeout(r, 1200));
  }

  // Take screenshot of Landscape result graphic
  await page.screenshot({
    path: path.join(artifactDir, 'screenshot-graphic-landscape-centered.png')
  });
  console.log('Saved screenshot-graphic-landscape-centered.png');

  // Switch to Portrait mode
  const portraitBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent && b.textContent.includes('4:5 Portrait'));
  });
  if (portraitBtn) {
    const elem = portraitBtn.asElement();
    if (elem) await elem.click();
    await new Promise(r => setTimeout(r, 800));
  }

  // Take screenshot of Portrait result graphic
  await page.screenshot({
    path: path.join(artifactDir, 'screenshot-graphic-portrait-centered.png')
  });
  console.log('Saved screenshot-graphic-portrait-centered.png');

  await browser.close();
}

main().catch(console.error);
