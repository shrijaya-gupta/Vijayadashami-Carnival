const { chromium } = require('playwright');
const path = require('path');

const ARTIFACTS_DIR = 'C:/Users/HP/.gemini/antigravity-ide/brain/7263d96b-69b2-4e97-9082-4ba116e14838';

async function captureMelaVisuals() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log('Navigating to homepage for intro screenshots...');
  await page.goto('http://localhost:3000/index.html');

  // Screenshot 1: Step 1 Festive Entrance (10-headed Ravana effigy)
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '01_mela_welcome_intro.png') });
  console.log('Saved 01_mela_welcome_intro.png');

  // Screenshot 2: Step 3 Effigy burning & sparks
  await page.waitForTimeout(3200);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '02_effigy_burning_celebration.png') });
  console.log('Saved 02_effigy_burning_celebration.png');

  // Screenshot 3: Step 4 Welcome card & enter button
  await page.waitForTimeout(1600);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '03_welcome_card_reveal.png') });
  console.log('Saved 03_welcome_card_reveal.png');

  // Click Enter Carnival
  const enterBtn = page.locator('#btnEnterCarnival');
  if (await enterBtn.isVisible()) {
    await enterBtn.click();
    await page.waitForTimeout(800);
  }

  // Screenshot 4: Homepage with Mela bunting, arch frame, and games
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '04_mela_decorated_homepage.png') });
  console.log('Saved 04_mela_decorated_homepage.png');

  // Screenshot 5: Mobile viewport (375x667)
  const mobilePage = await context.newPage();
  await mobilePage.setViewportSize({ width: 375, height: 667 });
  await mobilePage.goto('http://localhost:3000/index.html');
  await mobilePage.waitForTimeout(500);
  await mobilePage.screenshot({ path: path.join(ARTIFACTS_DIR, '05_mobile_welcome_intro.png') });
  console.log('Saved 05_mobile_welcome_intro.png');

  await browser.close();
  console.log('All screenshots captured successfully!');
}

captureMelaVisuals().catch(console.error);
