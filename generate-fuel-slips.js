import inquirer from 'inquirer';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import moment from 'moment'; // Add this import

// Get __dirname equivalent in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getRandomString(length) {
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

export function getRandomFloat(min, max, decimals = 2) {
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

export function toUpperCase(str) {
  return str ? str.toUpperCase() : str;
}

export async function getUserInputs() {
  // First collect basic slip count
  const initialQuestions = [
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
      default: '94.50',
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
      validate: (value) => {
        if (value < 1) return 'At least one slip must be generated';
        return true;
      },
    },
    {
      type: 'number',
      name: 'maxDays',
      message: 'How many days to skip to pick next bill date?',
      default: 10,
      validate: (value) => {
        if (value < 1) return 'At least one slip must be generated';
        return true;
      },
    },
    {
      type: 'number',
      name: 'minDays',
      message: 'Minimum days between bills:',
      default: 5,
      validate: (value) => {
        if (value < 1) return 'Minimum days must be at least 1';
        return true;
      },
    },
  ];

  // Get initial answers including slipCount
  const initialAnswers = await inquirer.prompt(initialQuestions);

  // Now we can use the slipCount in the minSlipCount validation
  const remainingQuestions = [
    {
      type: 'number',
      name: 'minSlipCount',
      message:
        'Minimum number of slips to generate (if not specified, equals to slipCount):',
      default: initialAnswers.slipCount,
      validate: function (value) {
        if (value < 1) return 'Minimum slip count must be at least 1';
        if (value > initialAnswers.slipCount)
          return 'Minimum slip count cannot be greater than total slip count';
        return true;
      },
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
      name: 'minAmount',
      message: 'Minimum amount per bill:',
      default: 1500,
      validate: (value) => {
        if (value <= 0) return 'Amount must be greater than 0';
        return true;
      },
    },
    {
      type: 'number',
      name: 'maxAmount',
      message: 'Maximum amount per bill:',
      default: 3500,
      validate: (value) => {
        if (value <= 0) return 'Amount must be greater than 0';
        return true;
      },
    },
    {
      type: 'confirm',
      name: 'takeDebugScreenshots',
      message: 'Do you want to take debug screenshots?',
      default: false,
    },
  ];

  // Get remaining answers
  const remainingAnswers = await inquirer.prompt(remainingQuestions);

  // Combine all answers
  const answers = { ...initialAnswers, ...remainingAnswers };

  // Additional validation to ensure maxAmount > minAmount
  if (answers.maxAmount <= answers.minAmount) {
    throw new Error('Maximum amount must be greater than minimum amount');
  }

  return answers;
}

// Add new confirmation prompt function
export async function confirmContinue(message) {
  const answer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'continue',
      message: message,
      default: true,
    },
  ]);
  return answer.continue;
}

// Add new function to generate receipt numbers
let currentReceiptNumber = Date.now();
export function generateReceiptNumber() {
  return `RCPT${currentReceiptNumber++}`;
}

// Modify the price generation function
export function generatePrice(basePrice) {
  const variation = Math.random() < 0.5 ? -0.01 : 0.03;
  return (Math.round((basePrice + variation) * 100) / 100).toFixed(2);
}

export function generateRandomDate(fromMonth, toMonth, fromYear, toYear) {
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

// Add this new function after other utility functions
export function generateDateSequence(
  fromMonth,
  toMonth,
  fromYear,
  toYear,
  count,
  maxDays,
  minDays = 5
) {
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

  // Create moment objects for start and end dates
  let startDate = moment([fromYear, fromIndex, 1]);
  let endMonthStartDate = moment([toYear, toIndex, 1]);
  let endDate = endMonthStartDate.endOf('month');

  // Calculate total available days
  const totalDays = endDate.diff(startDate, 'days');
  const minRequiredDays = minDays * (count - 1);

  if (totalDays < minRequiredDays) {
    console.warn(
      `Warning: Time period (${totalDays} days) is not enough for ${count} slips with minimum ${minDays} days gap. Need at least ${minRequiredDays} days.`
    );
    return null;
  }

  // Ensure maxDays is greater than minDays
  if (maxDays <= minDays) {
    console.warn(
      `Warning: maxDays (${maxDays}) must be greater than minDays (${minDays}). Setting maxDays to ${
        minDays + 5
      }.`
    );
    maxDays = minDays + 5;
  }

  // Calculate available extra days for randomization
  const extraDays = totalDays - minRequiredDays;
  const avgExtraDaysPerInterval = Math.floor(extraDays / (count - 1));

  // Initialize array for dates
  let dates = [];

  // Start with a random date in first two weeks
  let firstDateOffset = Math.min(14, Math.floor(totalDays * 0.05));
  let currentDate = startDate
    .clone()
    .add(Math.floor(Math.random() * firstDateOffset), 'days');
  dates.push(currentDate.clone());

  // Debug information
  console.log(`Total days available: ${totalDays}`);
  console.log(`Minimum required days: ${minRequiredDays}`);
  console.log(`Extra days available for randomization: ${extraDays}`);
  console.log(`Average extra days per interval: ${avgExtraDaysPerInterval}`);

  // Force more varied interval distribution by creating an array of intervals first
  let intervals = [];
  let remainingExtraDays = extraDays;

  // Generate n-1 intervals with varied days
  for (let i = 0; i < count - 1; i++) {
    // Calculate how many extra days to use for this interval
    // Use non-uniform distribution to create more variation
    let extraForThisInterval;

    // As we get closer to the end, adjust the randomization strategy
    if (i < count - 2) {
      // For earlier intervals, use more randomization
      const maxExtraForThis = Math.min(
        remainingExtraDays,
        Math.max(avgExtraDaysPerInterval * 2, maxDays - minDays)
      );

      // Apply different randomization patterns
      if (Math.random() < 0.3) {
        // Sometimes use a low value (30% chance)
        extraForThisInterval = Math.floor(
          Math.random() * Math.min(3, maxExtraForThis)
        );
      } else if (Math.random() < 0.7) {
        // Sometimes use a medium value (40% chance)
        extraForThisInterval = Math.floor(
          Math.random() * (maxExtraForThis / 2) + 1
        );
      } else {
        // Sometimes use a high value (30% chance)
        extraForThisInterval = Math.floor(
          Math.random() * maxExtraForThis + maxExtraForThis / 2
        );
      }
    } else {
      // For the last interval, use whatever remains (but cap it)
      extraForThisInterval = Math.min(remainingExtraDays, maxDays - minDays);
    }

    // Ensure we stay within remaining extra days
    extraForThisInterval = Math.min(extraForThisInterval, remainingExtraDays);
    remainingExtraDays -= extraForThisInterval;

    // The interval is minDays plus the extra days
    intervals.push(minDays + extraForThisInterval);
  }

  // Shuffle the intervals to prevent any pattern
  intervals = intervals.sort(() => Math.random() - 0.5);

  // Now use these intervals to generate dates
  for (let i = 0; i < intervals.length; i++) {
    currentDate = currentDate.clone().add(intervals[i], 'days');

    // Check if we've gone past the end date
    if (currentDate.isAfter(endDate)) {
      break;
    }

    dates.push(currentDate.clone());
  }

  // If we couldn't generate enough dates, try again with a more direct approach
  if (dates.length < count) {
    console.warn(
      `Could only generate ${dates.length} dates. Trying alternative approach...`
    );

    // Distribute the dates more evenly
    const avgDaysBetweenDates = Math.floor(totalDays / (count - 1));

    dates = [];
    currentDate = startDate.clone();
    dates.push(currentDate.clone());

    for (let i = 1; i < count; i++) {
      // Use a random value between minDays and avgDaysBetweenDates
      const daysToAdd =
        minDays +
        Math.floor(
          Math.random() * (Math.min(maxDays, avgDaysBetweenDates) - minDays + 1)
        );

      currentDate = currentDate.clone().add(daysToAdd, 'days');

      if (currentDate.isAfter(endDate)) {
        break;
      }

      dates.push(currentDate.clone());
    }
  }

  // Final verification of minimum spacing
  let validSequence = true;
  for (let i = 1; i < dates.length; i++) {
    const daysDiff = dates[i].diff(dates[i - 1], 'days');
    if (daysDiff < minDays) {
      validSequence = false;
      console.error(
        `Invalid sequence detected: ${daysDiff} days between ${dates[
          i - 1
        ].format('M/D/YYYY')} and ${dates[i].format('M/D/YYYY')}`
      );
    }
  }

  // Fix any issues
  if (!validSequence) {
    console.warn('Fixing sequence to ensure minimum day constraints...');
    for (let i = 1; i < dates.length; i++) {
      const minRequired = dates[i - 1].clone().add(minDays, 'days');
      if (dates[i].isBefore(minRequired)) {
        dates[i] = minRequired.clone();
      }
    }
  }

  // Log the actual intervals for verification
  console.log('Actual intervals between dates:');
  for (let i = 1; i < dates.length; i++) {
    const daysBetween = dates[i].diff(dates[i - 1], 'days');
    console.log(`Between dates ${i} and ${i - 1}: ${daysBetween} days`);
  }

  // Format and return the dates
  return dates.slice(0, count).map((date) => date.format('M/D/YYYY'));
}

// Modified generateBillAmounts function with recursion limit
export function generateBillAmounts(
  totalAmount,
  numberOfBills,
  minAmount,
  maxAmount,
  minSlipCount = numberOfBills,
  recursionCount = 0
) {
  // Add recursion limit to prevent stack overflow
  const MAX_RECURSION = 100;
  if (recursionCount > MAX_RECURSION) {
    console.error(
      'Reached maximum recursion depth. The constraints may be impossible to satisfy.'
    );

    // Fallback: generate approximately equal amounts that satisfy total
    const equalAmount = Math.floor(totalAmount / numberOfBills);
    let amounts = new Array(numberOfBills).fill(equalAmount);

    // Adjust the last amount to make the total exact
    amounts[amounts.length - 1] += totalAmount - equalAmount * numberOfBills;

    return {
      amounts,
      total: totalAmount,
      isValid: true,
      isApproximation: true,
    };
  }

  // Initial validation to check if constraints are even theoretically possible
  const minPossibleTotal = minAmount * numberOfBills;
  const maxPossibleTotal = maxAmount * numberOfBills;

  if (totalAmount < minPossibleTotal || totalAmount > maxPossibleTotal) {
    console.warn(
      `Warning: Impossible constraints - Total amount (${totalAmount}) is outside possible range (${minPossibleTotal}-${maxPossibleTotal})`
    );

    // Try to adjust min/max amounts to make it possible
    let adjustedMinAmount = minAmount;
    let adjustedMaxAmount = maxAmount;

    if (totalAmount < minPossibleTotal) {
      adjustedMinAmount = Math.floor(totalAmount / numberOfBills);
    }

    if (totalAmount > maxPossibleTotal) {
      adjustedMaxAmount = Math.ceil(totalAmount / numberOfBills);
    }

    console.log(
      `Adjusting constraints: min=${adjustedMinAmount}, max=${adjustedMaxAmount}`
    );

    // Continue with adjusted constraints
    minAmount = adjustedMinAmount;
    maxAmount = adjustedMaxAmount;
  }

  if (minSlipCount > numberOfBills) {
    minSlipCount = numberOfBills; // Safety check
  }

  let amounts = [];
  let remainingAmount = totalAmount;
  let remainingBills = numberOfBills;

  // First, generate minSlipCount bills ensuring they all meet the criteria
  for (let i = 0; i < minSlipCount; i++) {
    let currentAmount;

    if (i === minSlipCount - 1 && minSlipCount === numberOfBills) {
      // Last bill if we're only generating the minimum required - use remaining amount
      currentAmount = remainingAmount;
    } else {
      // Calculate safe bounds for this bill
      const maxPossible = Math.min(
        maxAmount,
        remainingAmount - minAmount * (remainingBills - 1)
      );

      const minPossible = Math.max(
        minAmount,
        remainingAmount - maxAmount * (remainingBills - 1)
      );

      // Check if constraints are impossible at this point
      if (minPossible > maxPossible) {
        // Try again with a fresh start, increment recursion counter
        return generateBillAmounts(
          totalAmount,
          numberOfBills,
          minAmount,
          maxAmount,
          minSlipCount,
          recursionCount + 1
        );
      }

      // Generate a random amount within valid range
      currentAmount = Math.floor(
        Math.random() * (maxPossible - minPossible + 1) + minPossible
      );
    }

    amounts.push(currentAmount);
    remainingAmount -= currentAmount;
    remainingBills--;
  }

  // Generate any remaining bills if needed
  while (remainingBills > 0) {
    let currentAmount;

    if (remainingBills === 1) {
      // Last bill - use remaining amount
      currentAmount = remainingAmount;
    } else {
      // Calculate safe bounds for this bill
      const maxPossible = Math.min(
        maxAmount,
        remainingAmount - minAmount * (remainingBills - 1)
      );

      const minPossible = Math.max(
        minAmount,
        remainingAmount - maxAmount * (remainingBills - 1)
      );

      // Check if constraints are impossible at this point
      if (minPossible > maxPossible) {
        // Try again with a fresh start, increment recursion counter
        return generateBillAmounts(
          totalAmount,
          numberOfBills,
          minAmount,
          maxAmount,
          minSlipCount,
          recursionCount + 1
        );
      }

      // Generate a random amount within valid range
      currentAmount = Math.floor(
        Math.random() * (maxPossible - minPossible + 1) + minPossible
      );
    }

    // Validate the generated amount
    if (currentAmount < minAmount || currentAmount > maxAmount) {
      // If we have an invalid amount on the last bill, try again
      if (remainingBills === 1) {
        return generateBillAmounts(
          totalAmount,
          numberOfBills,
          minAmount,
          maxAmount,
          minSlipCount,
          recursionCount + 1
        );
      }
    }

    amounts.push(currentAmount);
    remainingAmount -= currentAmount;
    remainingBills--;
  }

  // Shuffle the amounts
  const sortedAmounts = amounts.sort(() => Math.random() - 0.5);
  const total = sortedAmounts.reduce((sum, amount) => sum + amount, 0);

  return {
    amounts: sortedAmounts,
    total,
    isValid: total === totalAmount,
    isApproximation: false,
  };
}

// Add new function to create date-amount pairs
export function createDateAmountPairs(amounts, dates) {
  return amounts.map((amount, index) => ({
    date: dates[index],
    amount: amount,
  }));
}

// Modified generateAllSlipsData function to use minSlipCount parameter
function generateAllSlipsData(config) {
  const billAmounts = generateBillAmounts(
    config.totalAmount,
    config.slipCount,
    config.minAmount,
    config.maxAmount,
    config.minSlipCount
  );

  return billAmounts.amounts.map((amount) => {
    const rate = generatePrice(config.approxRate);
    const quantity = +(amount / rate).toFixed(2);

    return {
      receiptNumber: generateReceiptNumber(),
      teleNumber: '1800-XXX-XXXX',
      fccId: `FCC${getRandomString(6)}`,
      fipId: `FIP${getRandomString(4)}`,
      nozzleId: `N${getRandomString(2)}`,
      rate,
      amount,
      quantity,
      fuelType: config.fuelType,
      vehicleType: 'Car',
      vehicleNumber: toUpperCase(config.vehicleNumber || ''),
      date: generateRandomDate(
        config.fromMonth,
        config.toMonth,
        config.fromYear,
        config.toYear
      ),
      customerName: toUpperCase(config.customerName) || '',
      stationName: `${config.oilCompany} ${config.fuelType} Pump`,
      stationAddress: config.stationAddress || '',
    };
  });
}

// Modify generateFuelSlip to accept pre-generated data
export async function generateFuelSlip(config, browser, slipData) {
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

    // Instead of generating random values, use the pre-generated slipData
    await page.type('#fs-station-name', slipData.stationName);
    await page.type('#fs-address', slipData.stationAddress);

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

    // Update template values using the pre-generated data
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
    }, slipData);

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
    await delay(2000); // Wait for download to complete

    // Take screenshot for debugging
    if (config.takeDebugScreenshots) {
      console.log('Taking debug screenshot...');
      await page.screenshot({
        path: path.join(downloadPath, `debug-${Date.now()}.png`),
        fullPage: true,
      });
    }

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

// add new method to generate slips
export async function generate(config) {
  config.approxRate = parseFloat(config.approxRate);

  console.log('\nGenerating fuel slips with these configurations:');
  console.log(config);

  // Do initial validation on the constraints
  const minPossibleTotal = config.minAmount * config.slipCount;
  const maxPossibleTotal = config.maxAmount * config.slipCount;

  if (
    config.totalAmount < minPossibleTotal ||
    config.totalAmount > maxPossibleTotal
  ) {
    console.warn(`Warning: Your constraints might be difficult to satisfy.`);
    console.warn(`With ${config.slipCount} slips:`);
    console.warn(
      `- Minimum possible total: ${minPossibleTotal} (${config.slipCount} slips × ${config.minAmount} min/slip)`
    );
    console.warn(
      `- Maximum possible total: ${maxPossibleTotal} (${config.slipCount} slips × ${config.maxAmount} max/slip)`
    );
    console.warn(`- Your requested total: ${config.totalAmount}`);

    const willContinue = await confirmContinue(
      'Would you like to continue anyway? (The system will try to approximate)'
    );
    if (!willContinue) {
      console.log('Operation cancelled by user.');
      return;
    }
  }

  // Generate and validate bill amounts first with minSlipCount
  const billData = generateBillAmounts(
    config.totalAmount,
    config.slipCount,
    config.minAmount,
    config.maxAmount,
    config.minSlipCount
  );

  // Generate dates sequence
  const dates = generateDateSequence(
    config.fromMonth,
    config.toMonth,
    config.fromYear,
    config.toYear,
    config.slipCount,
    config.maxDays,
    config.minDays // Pass the user-provided minDays
  );

  if (!dates || dates.length < config.slipCount) {
    console.error(
      'Failed to generate enough valid dates. Please adjust your date range or number of slips.'
    );
    return;
  }

  // Create date-amount pairs
  const dateAmountPairs = createDateAmountPairs(billData.amounts, dates);

  console.log('\nGenerated date-amount pairs:');
  dateAmountPairs.forEach((pair) => {
    console.log(`Date: ${pair.date}, Amount: ₹${pair.amount}`);
  });
  console.log('\nTotal:', billData.total);
  console.log('Expected Total:', config.totalAmount);
  console.log('Number of slips:', dateAmountPairs.length);

  if (billData.isApproximation) {
    console.warn(
      'Note: The system had to approximate values to meet your constraints.'
    );
  }

  if (!billData.isValid) {
    console.error('Error: Generated amounts do not match the total amount!');
    return;
  }

  if (billData.amounts.length < config.minSlipCount) {
    console.error(
      'Error: Could not generate the minimum number of slips required!'
    );
    return;
  }

  // First confirmation after amounts
  if (!(await confirmContinue('Do you want to continue with these amounts?'))) {
    console.log('Operation cancelled by user after amount generation.');
    return;
  }

  // Generate all slip data upfront
  const allSlipsData = dateAmountPairs.map((pair) => {
    const rate = generatePrice(config.approxRate);
    const quantity = +(pair.amount / rate).toFixed(2);

    return {
      receiptNumber: generateReceiptNumber(),
      teleNumber: '1800-XXX-XXXX',
      fccId: `FCC${getRandomString(6)}`,
      fipId: `FIP${getRandomString(4)}`,
      nozzleId: `N${getRandomString(2)}`,
      rate,
      amount: pair.amount,
      quantity,
      fuelType: config.fuelType,
      vehicleType: 'Car',
      vehicleNumber: toUpperCase(config.vehicleNumber || ''),
      date: pair.date,
      customerName: toUpperCase(config.customerName) || '',
      stationName: `${config.oilCompany} ${config.fuelType} Pump`,
      stationAddress: config.stationAddress || '',
    };
  });

  console.log(`Generated slip data for ${allSlipsData.length} slips.`);

  // Second confirmation after slip data
  if (
    !(await confirmContinue('Do you want to continue with slip generation?'))
  ) {
    console.log('Operation cancelled by user after slip data generation.');
    return;
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox'],
    defaultViewport: null,
  });

  try {
    for (let i = 0; i < config.slipCount; i++) {
      console.log(`\nGenerating slip ${i + 1} of ${config.slipCount}`);
      await generateFuelSlip(config, browser, allSlipsData[i]);
      // Increased delay between generations to prevent overlapping
      await delay(5000);
    }
  } finally {
    await browser.close();
    console.log('Browser closed');
  }
}

// Modified main function to handle approximations
async function main() {
  //clear the screen
  console.clear();

  const config = await getUserInputs();

  //todo: comment remaining line and call generateFuelSlips
  await generateFuelSlips(config);

  // config.approxRate = parseFloat(config.approxRate);

  // console.log('\nGenerating fuel slips with these configurations:');
  // console.log(config);

  // // Do initial validation on the constraints
  // const minPossibleTotal = config.minAmount * config.slipCount;
  // const maxPossibleTotal = config.maxAmount * config.slipCount;

  // if (
  //   config.totalAmount < minPossibleTotal ||
  //   config.totalAmount > maxPossibleTotal
  // ) {
  //   console.warn(`Warning: Your constraints might be difficult to satisfy.`);
  //   console.warn(`With ${config.slipCount} slips:`);
  //   console.warn(
  //     `- Minimum possible total: ${minPossibleTotal} (${config.slipCount} slips × ${config.minAmount} min/slip)`
  //   );
  //   console.warn(
  //     `- Maximum possible total: ${maxPossibleTotal} (${config.slipCount} slips × ${config.maxAmount} max/slip)`
  //   );
  //   console.warn(`- Your requested total: ${config.totalAmount}`);

  //   const willContinue = await confirmContinue(
  //     'Would you like to continue anyway? (The system will try to approximate)'
  //   );
  //   if (!willContinue) {
  //     console.log('Operation cancelled by user.');
  //     return;
  //   }
  // }

  // // Generate and validate bill amounts first with minSlipCount
  // const billData = generateBillAmounts(
  //   config.totalAmount,
  //   config.slipCount,
  //   config.minAmount,
  //   config.maxAmount,
  //   config.minSlipCount
  // );

  // // Generate dates sequence
  // const dates = generateDateSequence(
  //   config.fromMonth,
  //   config.toMonth,
  //   config.fromYear,
  //   config.toYear,
  //   config.slipCount
  // );

  // // Create date-amount pairs
  // const dateAmountPairs = createDateAmountPairs(billData.amounts, dates);

  // console.log('\nGenerated date-amount pairs:');
  // dateAmountPairs.forEach((pair) => {
  //   console.log(`Date: ${pair.date}, Amount: ₹${pair.amount}`);
  // });
  // console.log('\nTotal:', billData.total);
  // console.log('Expected Total:', config.totalAmount);
  // console.log('Number of slips:', dateAmountPairs.length);

  // if (billData.isApproximation) {
  //   console.warn(
  //     'Note: The system had to approximate values to meet your constraints.'
  //   );
  // }

  // if (!billData.isValid) {
  //   console.error('Error: Generated amounts do not match the total amount!');
  //   return;
  // }

  // if (billData.amounts.length < config.minSlipCount) {
  //   console.error(
  //     'Error: Could not generate the minimum number of slips required!'
  //   );
  //   return;
  // }

  // // First confirmation after amounts
  // if (!(await confirmContinue('Do you want to continue with these amounts?'))) {
  //   console.log('Operation cancelled by user after amount generation.');
  //   return;
  // }

  // // Generate all slip data upfront
  // const allSlipsData = dateAmountPairs.map((pair) => {
  //   const rate = generatePrice(config.approxRate);
  //   const quantity = +(pair.amount / rate).toFixed(2);

  //   return {
  //     receiptNumber: generateReceiptNumber(),
  //     teleNumber: '1800-XXX-XXXX',
  //     fccId: `FCC${getRandomString(6)}`,
  //     fipId: `FIP${getRandomString(4)}`,
  //     nozzleId: `N${getRandomString(2)}`,
  //     rate,
  //     amount: pair.amount,
  //     quantity,
  //     fuelType: config.fuelType,
  //     vehicleType: 'Car',
  //     vehicleNumber: toUpperCase(config.vehicleNumber || ''),
  //     date: pair.date,
  //     customerName: toUpperCase(config.customerName) || '',
  //     stationName: `${config.oilCompany} ${config.fuelType} Pump`,
  //     stationAddress: config.stationAddress || '',
  //   };
  // });

  // console.log(`Generated slip data for ${allSlipsData.length} slips.`);

  // // Second confirmation after slip data
  // if (
  //   !(await confirmContinue('Do you want to continue with slip generation?'))
  // ) {
  //   console.log('Operation cancelled by user after slip data generation.');
  //   return;
  // }

  // const browser = await puppeteer.launch({
  //   headless: 'new',
  //   args: ['--no-sandbox'],
  //   defaultViewport: null,
  // });

  // try {
  //   for (let i = 0; i < config.slipCount; i++) {
  //     console.log(`\nGenerating slip ${i + 1} of ${config.slipCount}`);
  //     await generateFuelSlip(config, browser, allSlipsData[i]);
  //     // Increased delay between generations to prevent overlapping
  //     await delay(5000);
  //   }
  // } finally {
  //   await browser.close();
  //   console.log('Browser closed');
  // }
}

// Check if the module is being run directly or via npm script
if (
  process.env.npm_lifecycle_event === 'start' ||
  !process.env.npm_lifecycle_event
) {
  main().catch(console.error);
}
