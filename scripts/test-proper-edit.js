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

  // 1. Click "Edit Info" button directly inside the browser DOM
  const clicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.toLowerCase().includes('edit info'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('Edit Info button clicked:', clicked);
  await new Promise(r => setTimeout(r, 600));

  // 2. Clear and type into Title input
  const titleInput = await page.$('input[placeholder*="FREE FIRE CHAMPIONSHIP"]');
  if (titleInput) {
    await titleInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await titleInput.type('BANGLADESH PRO LEAGUE S1');
    console.log('Typed new tournament title.');
  }

  // Clear and type into Host input
  const hostInput = await page.$('input[placeholder*="BD ESPORTS ARENA"]');
  if (hostInput) {
    await hostInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await hostInput.type('GARENA OFFICIAL BD');
    console.log('Typed new host name.');
  }

  // Clear and type into Sponsor input
  const sponsorInput = await page.$('input[placeholder*="RED BULL / ASUS ROG"]');
  if (sponsorInput) {
    await sponsorInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await sponsorInput.type('MONSTER ENERGY / ROG STRIX');
    console.log('Typed new sponsor name.');
  }

  // Clear and type into Squad 1 input
  const squad1Input = await page.$('input[placeholder="Squad 1"]');
  if (squad1Input) {
    await squad1Input.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await squad1Input.type('APEX PREDATORS');
    console.log('Typed new squad 1 name.');
  }

  // 3. Click "SAVE TOURNAMENT CHANGES"
  const saveClicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.includes('SAVE TOURNAMENT CHANGES'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('Save button clicked:', saveClicked);
  await new Promise(r => setTimeout(r, 1500));

  // 4. Capture graphic showing the updated tournament info
  await page.screenshot({
    path: path.join(artifactDir, 'screenshot-graphic-after-full-edit.png')
  });
  console.log('Saved screenshot-graphic-after-full-edit.png');

  await browser.close();
}

main().catch(console.error);
