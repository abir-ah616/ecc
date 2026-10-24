const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:/Users/johnc/.gemini/antigravity/brain/ab21e7b8-1a56-456b-aedf-459291632061');

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));

  // 1. Capture Home Page with new Header and Footer
  const homeShotPath = path.join(ARTIFACT_DIR, 'home-with-header-and-footer.png');
  await page.screenshot({ path: homeShotPath, fullPage: true });
  console.log('Saved home-with-header-and-footer.png');

  // Verify footer link
  const footerLink = await page.evaluate(() => {
    const link = document.querySelector('footer a[href="https://mroppy.netlify.app/"]');
    return link ? { text: link.textContent.trim(), href: link.href } : null;
  });
  console.log('Footer link verified:', footerLink);

  // 2. Click "Continue Match Scoring" or enter a tournament
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent && b.textContent.includes('Continue Match Scoring')
    );
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  // Count how many "Dashboard" buttons are visible on the tournament page
  const dashboardButtonsCount = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button')).filter(
      (b) => b.textContent && b.textContent.trim().toLowerCase().includes('dashboard')
    );
    return buttons.length;
  });
  console.log('Number of Dashboard buttons in tournament page:', dashboardButtonsCount);

  // 3. Capture Tournament Page showing clean single Dashboard button and enhanced header
  const tournamentShotPath = path.join(ARTIFACT_DIR, 'tournament-page-single-dashboard-button.png');
  await page.screenshot({ path: tournamentShotPath, fullPage: false });
  console.log('Saved tournament-page-single-dashboard-button.png');

  // 4. Capture bottom of tournament page showing footer
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise((r) => setTimeout(r, 500));
  const footerShotPath = path.join(ARTIFACT_DIR, 'tournament-page-footer.png');
  await page.screenshot({ path: footerShotPath });
  console.log('Saved tournament-page-footer.png');

  await browser.close();
  console.log('Verification finished successfully!');
}

run().catch((err) => {
  console.error('Error in verification:', err);
  process.exit(1);
});
