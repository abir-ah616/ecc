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

  // 1. Click "Edit Info" on Home page live tournament
  const editBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent && b.textContent.toLowerCase().includes('edit info'));
  });
  if (editBtn) {
    const el = editBtn.asElement();
    if (el) await el.click();
    await new Promise(r => setTimeout(r, 600));
  }

  // 2. Change fields in the Edit view
  await page.evaluate(() => {
    const titleInput = document.querySelector('input[placeholder*="FREE FIRE CHAMPIONSHIP"]');
    if (titleInput) {
      titleInput.value = 'BANGLADESH MASTERS 2026';
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));
      titleInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const hostInput = document.querySelector('input[placeholder*="BD ESPORTS ARENA"]');
    if (hostInput) {
      hostInput.value = 'ESPORTS FEDERATION BD';
      hostInput.dispatchEvent(new Event('input', { bubbles: true }));
      hostInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const sponsorInput = document.querySelector('input[placeholder*="RED BULL / ASUS ROG"]');
    if (sponsorInput) {
      sponsorInput.value = 'MONSTER ENERGY / ROG STRIX';
      sponsorInput.dispatchEvent(new Event('input', { bubbles: true }));
      sponsorInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Change squad #1 name
    const squad1Input = document.querySelector('input[placeholder="Squad 1"]');
    if (squad1Input) {
      squad1Input.value = 'APEX PREDATORS';
      squad1Input.dispatchEvent(new Event('input', { bubbles: true }));
      squad1Input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  // 3. Click "SAVE TOURNAMENT CHANGES"
  const saveBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent && b.textContent.includes('SAVE TOURNAMENT CHANGES'));
  });
  if (saveBtn) {
    const el = saveBtn.asElement();
    if (el) await el.click();
    await new Promise(r => setTimeout(r, 1200));
  }

  // 4. Capture graphic showing the updated tournament info
  await page.screenshot({
    path: path.join(artifactDir, 'screenshot-graphic-after-full-edit.png')
  });
  console.log('Saved screenshot-graphic-after-full-edit.png');

  await browser.close();
}

main().catch(console.error);
