import puppeteer from 'puppeteer';
import path from 'path';

const artifactDir = 'C:\\Users\\johnc\\.gemini\\antigravity\\brain\\ab21e7b8-1a56-456b-aedf-459291632061';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testClickStandingGraphic() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // Click on "VIEW STANDING GRAPHIC"
  const graphicBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent && b.textContent.includes('VIEW STANDING GRAPHIC'));
  });

  if (graphicBtn) {
    await graphicBtn.click();
    await new Promise(r => setTimeout(r, 800));
  }

  await page.screenshot({
    path: path.join(artifactDir, 'screenshot-graphic-full-page.png')
  });

  console.log('Saved screenshot-graphic-full-page.png');
  await browser.close();
}

testClickStandingGraphic().catch(console.error);
