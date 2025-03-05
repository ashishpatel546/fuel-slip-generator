import puppeteer from 'puppeteer';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import cliProgress from 'cli-progress';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAX_BROWSERS = Math.max(1, os.cpus().length - 1);

// Import necessary functions from existing file
import {
  getUserInputs,
  generateReceiptNumber,
  generateRandomDate,
  getRandomString,
  getRandomFloat,
  generatePrice,
  toUpperCase,
} from './generate-fuel-slips.js';

class BrowserPool {
  constructor(size) {
    this.size = size;
    this.browsers = [];
    this.currentIndex = 0;
  }

  async initialize() {
    console.log(`Initializing ${this.size} browsers...`);
    for (let i = 0; i < this.size; i++) {
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox'],
        defaultViewport: null,
      });
      this.browsers.push(browser);
    }
    console.log('All browsers initialized');
  }

  getBrowser() {
    const browser = this.browsers[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.size;
    return browser;
  }

  async closeAll() {
    await Promise.all(this.browsers.map((browser) => browser.close()));
  }
}

async function generateSlipInBrowser(browser, config, slipIndex) {
  const page = await browser.newPage();

  try {
    // Setup download path and navigate
    const downloadPath = path.join(__dirname, 'downloads');
    await page.goto('https://freeforonline.com/fuel-bills/index.html', {
      waitUntil: 'networkidle0',
      timeout: 60000,
    });

    // Generate random data
    const quantity = getRandomFloat(config.minQuantity, config.maxQuantity, 2);
    const rate = generatePrice(config.approxRate);
    const amount = Math.round(quantity * rate);
    const randomData = {
      receiptNumber: generateReceiptNumber(),
      teleNumber: '1800-XXX-XXXX',
      fccId: `FCC${getRandomString(6)}`,
      fipId: `FIP${getRandomString(4)}`,
      nozzleId: `N${getRandomString(2)}`,
      rate,
      amount,
      quantity: quantity.toFixed(2),
      fuelType: config.fuelType,
      vehicleType: 'Car',
      vehicleNumber: toUpperCase(
        config.vehicleNumber || `${getRandomString(2)}-${getRandomString(4)}`
      ),
      date: generateRandomDate(
        config.fromMonth,
        config.toMonth,
        config.fromYear,
        config.toYear
      ),
      customerName: toUpperCase(config.customerName) || '',
      stationName: `${config.oilCompany} ${
        config.fuelType
      } Pump ${getRandomString(5)}`,
    };

    // Fill form fields (simplified version of original code)
    await page.type('#fs-station-name', randomData.stationName);
    await page.type(
      '#fs-address',
      config.stationAddress || `${getRandomString(10)} Street`
    );

    // Select template and company
    await page.evaluate((templateId) => {
      const template = document.querySelector(`#${templateId}`);
      if (template) {
        template.checked = true;
        template.click();
      }
    }, config.pumpTemplate);

    // Fill other fields
    await page.evaluate((data) => {
      const updateElement = (selector, value) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
          if (el.tagName === 'INPUT') {
            el.value = value;
            el.dispatchEvent(new Event('input', { bubbles: true }));
          } else {
            el.textContent = value;
          }
        });
      };

      // Update form fields
      Object.entries({
        '[data-tm="fs-fuel-rate"]': data.rate,
        '[data-tm="fs-amount"]': data.amount,
        '[data-tm="u-vehicle-type"]': data.vehicleType,
        '[data-tm="u-vechicle-number"]': data.vehicleNumber,
        '[data-tm="fs-date"]': data.date,
        '.value-ltr': data.quantity,
        '.product-type': data.fuelType,
        '.fs-receipt-number': data.receiptNumber,
        '.customer-name': data.customerName,
      }).forEach(([selector, value]) => updateElement(selector, value));
    }, randomData);

    // Download slip
    await page.click('#download-fuel-bills');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    return true;
  } catch (error) {
    console.error(`Error in slip ${slipIndex}:`, error);
    return false;
  } finally {
    await page.close();
  }
}

async function generateSlipsInParallel(config) {
  const browserPool = new BrowserPool(MAX_BROWSERS);
  await browserPool.initialize();

  const progressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );
  progressBar.start(config.slipCount, 0);

  try {
    const slips = Array.from({ length: config.slipCount }, (_, i) => i);
    const batchSize = MAX_BROWSERS * 2; // Process twice as many slips as browsers
    const results = [];

    // Process in optimized batches
    for (let i = 0; i < slips.length; i += batchSize) {
      const batch = slips.slice(i, i + batchSize);
      const batchPromises = batch.map((slipIndex) => {
        const browser = browserPool.getBrowser();
        return generateSlipInBrowser(browser, config, slipIndex).then(
          (result) => {
            progressBar.increment();
            return result;
          }
        );
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    const successful = results.filter(Boolean).length;
    console.log(
      `\nGenerated ${successful} out of ${config.slipCount} slips successfully`
    );
  } finally {
    progressBar.stop();
    await browserPool.closeAll();
  }
}

async function main() {
  try {
    const config = await getUserInputs();
    config.approxRate = parseFloat(config.approxRate);
    console.log(
      `\nStarting parallel generation with ${MAX_BROWSERS} browsers...`
    );
    await generateSlipsInParallel(config);
  } catch (error) {
    console.error('Main process error:', error);
  }
}

// Start the script
main().catch(console.error);
