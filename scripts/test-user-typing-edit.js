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

  // 1. Click "Edit Tournament" in top tab bar
  const editTab = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent && b.textContent.includes('Edit Tournament'));
  });
  if (editTab) {
    const el = editTab.asElement();
    if (el) await el.click();
    await new Promise(r => setTimeout(r, 600));
  } else {
    // Or from home click Edit Info
    const editBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.textContent && b.textContent.toLowerCase().includes('edit info'));
    });
    if (editBtn) {
      const el = editBtn.asElement();
      if (el) await el.click();
      await new Promise(r => setTimeout(r, 600));
    }
  }

  // 2. Clear and type into Title input using Puppeteer's native page.type
  const titleInput = await page.$('input[placeholder*="FREE FIRE CHAMPIONSHIP"]');
  if (titleInput) {
    await titleInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await titleInput.type('BANGLADESH PRO LEAGUE S1');
  }

  // Clear and type into Host input
  const hostInput = await page.$('input[placeholder*="BD ESPORTS ARENA"]');
  if (hostInput) {
    await hostInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await hostInput.type('GARENA OFFICIAL BD');
  }

  // Clear and type into Sponsor input
  const sponsorInput = await page.$('input[placeholder*="RED BULL / ASUS ROG"]');
  if (sponsorInput) {
    await sponsorInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await sponsorInput.type('MONSTER ENERGY / ROG STRIX');
  }

  // Change Squad 1 name
  const squadInputs = await page.$$('input[placeholder*="Squad"]');
  if (squadInputs.length > 0) {
    await squadInputs[0].click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await squadInputs[0].type('APEX PREDATORS');
  }

  // 3. Click "SAVE TOURNAMENT CHANGES"
  const saveBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent && b.textContent.includes('SAVE TOURNAMENT CHANGES'));
  });
  if (saveBtn) {
    const el = saveBtn.asElement();
    if (el) await el.click();
    await new Promise(r => setTimeout(r, 1500));
  }

  // 4. Capture graphic showing the updated tournament info
  await page.screenshot({
    path: path.join(artifactDir, 'screenshot-graphic-after-full-edit.png')
  });
  console.log('Saved screenshot-graphic-after-full-edit.png');

  await browser.close();
}

main().catch(console.error);
