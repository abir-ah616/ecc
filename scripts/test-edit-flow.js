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

  // 1. Click on "EDIT INFO" button on the live tournament card
  const editBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent && b.textContent.toLowerCase().includes('edit info'));
  });

  if (editBtn) {
    const el = editBtn.asElement();
    if (el) await el.click();
    await new Promise(r => setTimeout(r, 600));
  }

  // Screenshot 1: Edit Tournament View
  await page.screenshot({
    path: path.join(artifactDir, 'screenshot-edit-view-live.png')
  });
  console.log('Saved screenshot-edit-view-live.png');

  // 2. Click "SAVE TOURNAMENT CHANGES" to go to results
  const saveBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent && b.textContent.includes('SAVE TOURNAMENT CHANGES'));
  });
  if (saveBtn) {
    const el = saveBtn.asElement();
    if (el) await el.click();
    await new Promise(r => setTimeout(r, 1200));
  }

  // Screenshot 2: Landscape Standing Graphic Centered
  await page.screenshot({
    path: path.join(artifactDir, 'screenshot-graphic-landscape-centered.png')
  });
  console.log('Saved screenshot-graphic-landscape-centered.png');

  // 3. Switch to 4:5 Portrait
  const portraitBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent && b.textContent.includes('4:5 Portrait'));
  });
  if (portraitBtn) {
    const el = portraitBtn.asElement();
    if (el) await el.click();
    await new Promise(r => setTimeout(r, 800));
  }

  // Screenshot 3: Portrait Standing Graphic Centered
  await page.screenshot({
    path: path.join(artifactDir, 'screenshot-graphic-portrait-centered.png')
  });
  console.log('Saved screenshot-graphic-portrait-centered.png');

  await browser.close();
}

main().catch(console.error);
