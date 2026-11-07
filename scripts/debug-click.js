import puppeteer from 'puppeteer';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  const state1 = await page.evaluate(() => {
    return {
      tab: window.localStorage.getItem('freefire_multi_tournament_store_v2')
    };
  });
  console.log('Initial localStorage present:', !!state1.tab);

  // Click Edit Info
  const editBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.toLowerCase().includes('edit info'));
    return btn;
  });

  console.log('editBtn found:', !!editBtn);
  if (editBtn) {
    const el = editBtn.asElement();
    if (el) {
      console.log('Clicking editBtn...');
      await el.click();
      await new Promise(r => setTimeout(r, 500));
    }
  }

  const currentTab = await page.evaluate(() => {
    const raw = localStorage.getItem('freefire_multi_tournament_store_v2');
    return raw ? JSON.parse(raw).state.currentTab : null;
  });
  console.log('currentTab after click:', currentTab);

  const h1Text = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    return h1 ? h1.textContent : 'none';
  });
  console.log('Active h1 in DOM:', h1Text);

  await browser.close();
}

main().catch(console.error);
