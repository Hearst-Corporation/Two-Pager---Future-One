const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5005/pitch', { waitUntil: 'networkidle0' });
  const html = await page.evaluate(() => document.body.innerHTML);
  console.log(html.substring(0, 1000));
  await browser.close();
})();
