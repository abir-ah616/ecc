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

  // 1. Reset demo data cleanly
  await page.evaluate(() => {
    localStorage.removeItem('freefire_multi_tournament_store_v2');
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  // 2. Open Standing Graphic (Results)
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('View Standing Graphic'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // Landscape centered screenshot
  await page.screenshot({
    path: path.join(artifactDir, 'final-landscape-centered.png')
  });
  console.log('Saved final-landscape-centered.png');

  // Switch to Portrait
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('4:5 Portrait'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // Portrait centered screenshot
  await page.screenshot({
    path: path.join(artifactDir, 'final-portrait-centered.png')
  });
  console.log('Saved final-portrait-centered.png');

  // Go to Edit Tournament
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Edit Tournament Info'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // Edit view screenshot
  await page.screenshot({
    path: path.join(artifactDir, 'final-edit-view.png')
  });
  console.log('Saved final-edit-view.png');

  // Go to Create Tournament tab
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Create Tournament'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // Create view screenshot
  await page.screenshot({
    path: path.join(artifactDir, 'final-create-view.png')
  });
  console.log('Saved final-create-view.png');

  await browser.close();
}

main().catch(console.error);
