import inquirer from 'inquirer';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getRandomString(length) {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max, decimals = 2) {
  const str = (Math.random() * (max - min) + min).toFixed(decimals);
  return parseFloat(str);
}

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

// Add these utility functions after the existing helper functions
function toSentenceCase(str) {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function toUpperCase(str) {
  return str ? str.toUpperCase() : str;
}

async function getUserInputs() {
  const questions = [
    {
      type: 'list',
      name: 'fromYear',
      message: 'Select start year:',
      choices: [2023, 2024, 2025],
      default: new Date().getFullYear(),
    },
    {
      type: 'list',
      name: 'fromMonth',
      message: 'Select start month:',
      choices: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ],
    },
    {
      type: 'list',
      name: 'toYear',
      message: 'Select end year:',
      choices: [2023, 2024, 2025],
      default: new Date().getFullYear(),
    },
    {
      type: 'list',
      name: 'toMonth',
      message: 'Select end month:',
      choices: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ],
    },
    {
      type: 'list',
      name: 'oilCompany',
      message: 'Select oil company:',
      choices: ['Bharat Petroleum', 'Indian Oil', 'HP Oil', 'Essar Oil'],
    },
    {
      type: 'list',
      name: 'fuelType',
      message: 'Select fuel type:',
      choices: ['Petrol', 'Diesel', 'CNG'],
    },
    {
      type: 'list',
      name: 'pumpTemplate',
      message: 'Select pump template:',
      choices: ['template-1', 'template-2', 'template-3', 'template-4'],
    },
    {
      type: 'input', // Changed from 'number' to 'input' to allow decimals
      name: 'approxRate',
      message: 'Enter approximate fuel rate (can use decimals):',
      default: '100.00',
      validate: (value) => {
        if (isNaN(parseFloat(value))) {
          return 'Please enter a valid number';
        }
        return true;
      },
      filter: (value) => parseFloat(value), // Convert to float
    },
    {
      type: 'input',
      name: 'customerName',
      message: 'Customer name (optional, press enter to skip):',
      default: '',
    },
    {
      type: 'number',
      name: 'slipCount',
      message: 'How many slips to generate?',
      default: 1,
    },
    {
      type: 'number',
      name: 'totalAmount',
      message: 'Total amount for all bills:',
      default: 10000,
    },
    {
      type: 'input',
      name: 'stationAddress',
      message: 'Fuel station address (optional, press enter to skip):',
      default: '',
    },
    {
      type: 'input',
      name: 'vehicleNumber',
      message: 'Vehicle number (optional, press enter to skip):',
      default: '',
    },
    {
      type: 'number',
      name: 'minQuantity',
      message: 'Minimum fuel quantity (in liters):',
      default: 5,
    },
    {
      type: 'number',
      name: 'maxQuantity',
      message: 'Maximum fuel quantity (in liters):',
      default: 50,
    },
  ];

  return inquirer.prompt(questions);
}

// Add new function to generate receipt numbers
let currentReceiptNumber = Date.now();
function generateReceiptNumber() {
  return `RCPT${currentReceiptNumber++}`;
}

// Modify the price generation function
function generatePrice(basePrice) {
  const variation = Math.random() < 0.5 ? -0.01 : 0.03;
  return (Math.round((basePrice + variation) * 100) / 100).toFixed(2);
}

function generateRandomDate(fromMonth, toMonth, fromYear, toYear) {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const fromIndex = months.indexOf(fromMonth);
  const toIndex = months.indexOf(toMonth);

  const startDate = new Date(fromYear, fromIndex, 1);
  const endDate = new Date(toYear, toIndex, 28);

  const randomTimestamp =
    startDate.getTime() +
    Math.random() * (endDate.getTime() - startDate.getTime());
  return new Date(randomTimestamp).toLocaleDateString();
}

async function generateFuelSlip(config, browser) {
  const page = await browser.newPage();

  try {
    const downloadPath = path.join(__dirname, 'downloads');
    if (!fs.existsSync(downloadPath)) {
      fs.mkdirSync(downloadPath);
    }

    // Remove request interception completely
    // await page.setRequestInterception(true);

    console.log('Navigating to page...');
    await page.goto('https://freeforonline.com/fuel-bills/index.html', {
      waitUntil: 'networkidle0',
      timeout: 60000,
    });

    // Wait for core elements first
    console.log('Waiting for core elements...');
    const coreSelectors = [
      '#fs-station-name',
      '#fs-address',
      '#download-fuel-bills',
    ];

    for (const selector of coreSelectors) {
      await page.waitForSelector(selector);
    }

    // Calculate random amount based on quantity and rate with decimal support
    const quantity = getRandomFloat(config.minQuantity, config.maxQuantity, 2);
    const rate = generatePrice(config.approxRate);
    const amount = Math.round(quantity * rate); // Round to whole number

    // Updated station name to include oil company name
    const stationName = `${config.oilCompany} ${
      config.fuelType
    } Pump ${getRandomString(5)}`;
    await page.type('#fs-station-name', stationName);

    // Fill address
    await page.type(
      '#fs-address',
      config.stationAddress ||
        `${getRandomString(10)} Street, ${getRandomString(8)} City`
    );

    await delay(2000);

    // Select the chosen template
    await page.evaluate((templateId) => {
      const template = document.querySelector(`#${templateId}`);
      if (template) {
        template.checked = true;
        template.click();
        const event = new Event('change', { bubbles: true });
        template.dispatchEvent(event);
      }
    }, config.pumpTemplate);

    await delay(2000);

    // Updated company mapping with correct IDs
    await page.evaluate((oilCompany) => {
      const companyMap = {
        'Bharat Petroleum': '#pump-logo-bharat-petroleum',
        'Indian Oil': '#pump-logo-indian-oil',
        'HP Oil': '#pump-logo-hp',
        'Essar Oil': '#pump-logo-essar-oil',
      };

      // First uncheck all radio buttons
      document.querySelectorAll('input[name="fs-logo"]').forEach((radio) => {
        radio.checked = false;
      });

      // Select the correct company
      const selector = companyMap[oilCompany];
      if (selector) {
        const radio = document.querySelector(selector);
        if (radio) {
          radio.checked = true;
          radio.click();
          radio.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    }, config.oilCompany);

    await delay(2000);

    // Update customer and vehicle info - Updated selectors
    await page.evaluate(
      (data) => {
        // Set customer name using correct selector
        const customerNameInput = document.querySelector('#u-name');
        if (customerNameInput && data.customerName) {
          customerNameInput.value = data.customerName.toUpperCase(); // Convert to uppercase
          customerNameInput.dispatchEvent(
            new Event('input', { bubbles: true })
          );
          customerNameInput.dispatchEvent(
            new Event('change', { bubbles: true })
          );
        }

        // Set vehicle number using correct selector
        const vehicleNumberInput = document.querySelector('#u-vechicle-number');
        if (vehicleNumberInput && data.vehicleNumber) {
          vehicleNumberInput.value = data.vehicleNumber.toUpperCase(); // Convert to uppercase
          vehicleNumberInput.dispatchEvent(
            new Event('input', { bubbles: true })
          );
          vehicleNumberInput.dispatchEvent(
            new Event('change', { bubbles: true })
          );
        }
      },
      {
        customerName: config.customerName,
        vehicleNumber: config.vehicleNumber,
      }
    );

    await delay(2000);

    // Generate all random values before evaluate
    const randomData = {
      receiptNumber: generateReceiptNumber(),
      teleNumber: '1800-XXX-XXXX',
      fccId: `FCC${getRandomString(6)}`,
      fipId: `FIP${getRandomString(4)}`,
      nozzleId: `N${getRandomString(2)}`,
      rate,
      amount,
      quantity: quantity.toFixed(2), // Ensure 2 decimal places
      fuelType: config.fuelType,
      vehicleType: 'Car',
      vehicleNumber: toUpperCase(
        config.vehicleNumber ||
          `${getRandomString(2)}-${getRandomNumber(1000, 9999)}`
      ),
      date: generateRandomDate(
        config.fromMonth,
        config.toMonth,
        config.fromYear,
        config.toYear
      ),
      customerName: toUpperCase(config.customerName) || '', // Changed from toSentenceCase to toUpperCase
    };

    // Update template values using JavaScript evaluation with pre-generated data
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
          el.dispatchEvent(new Event('change', { bubbles: true }));
        });
      };

      // Update all fields with pre-generated values
      updateElement('[data-tm="fs-fuel-rate"]', data.rate);
      updateElement('[data-tm="fs-amount"]', data.amount);
      updateElement('[data-tm="u-vehicle-type"]', data.vehicleType);
      updateElement('[data-tm="u-vechicle-number"]', data.vehicleNumber);
      updateElement('[data-tm="fs-date"]', data.date);
      updateElement('.value-ltr', data.quantity);
      updateElement('.product-type', data.fuelType);
      updateElement('.fs-receipt-number', data.receiptNumber);
      updateElement('.tele-number', data.teleNumber);
      updateElement('.fcc-id', data.fccId);
      updateElement('.fip-id', data.fipId);
      updateElement('.nozzle-id', data.nozzleId);

      // Add customer name if provided
      if (data.customerName) {
        updateElement('[data-tm="customer-name"]', data.customerName);
        updateElement('#customer-name', data.customerName);
        updateElement('.customer-name', data.customerName);
      }

      // Make currency visible if needed
      const currencyElements = document.querySelectorAll('[com-tm="currency"]');
      currencyElements.forEach((el) => el.classList.remove('d-none'));

      // Update any hidden elements that might affect the template
      const vatElements = document.querySelectorAll('[data-tm="vat-none"]');
      vatElements.forEach((el) => el.classList.remove('d-none'));
    }, randomData);

    await delay(3000); // Give more time for template to update

    console.log('Attempting to download slip...');

    // Single download attempt with better event handling
    await page.evaluate(() => {
      return new Promise((resolve) => {
        const downloadBtn = document.querySelector('#download-fuel-bills');
        if (downloadBtn) {
          downloadBtn.addEventListener(
            'click',
            () => {
              setTimeout(resolve, 1000);
            },
            { once: true }
          );
          downloadBtn.click();
        } else {
          resolve();
        }
      });
    });

    console.log('Download button clicked');
    await delay(8000); // Wait for download to complete

    // Take screenshot for debugging
    console.log('Taking debug screenshot...');
    await page.screenshot({
      path: path.join(downloadPath, `debug-${Date.now()}.png`),
      fullPage: true,
    });

    // Clear the form to prevent duplicate generation
    console.log('Clearing form...');
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) form.reset();
    });

    await delay(2000);
    console.log('Process completed');
  } catch (error) {
    console.error('Detailed Error:', error);
    // Take error screenshot
    await page.screenshot({
      path: path.join(downloadPath, `error-${Date.now()}.png`),
      fullPage: true,
    });
  } finally {
    await page.close(); // Close page instead of browser
    console.log('Page closed');
  }
}

// Modified main function to prevent duplicates
async function main() {
  const config = await getUserInputs();
  config.approxRate = parseFloat(config.approxRate);

  console.log('\nGenerating fuel slips with these configurations:');
  console.log(config);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox'],
    defaultViewport: null,
  });

  try {
    for (let i = 0; i < config.slipCount; i++) {
      console.log(`\nGenerating slip ${i + 1} of ${config.slipCount}`);
      await generateFuelSlip(config, browser); // Pass browser instance
      // Increased delay between generations to prevent overlapping
      await delay(5000);
    }
  } finally {
    await browser.close();
    console.log('Browser closed');
  }
}

// Start the script
main().catch(console.error);
