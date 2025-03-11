# Fuel Slip Generator

A utility to generate fuel slips for record-keeping purposes.

## Setup

1. Ensure you have Node.js installed
2. Clone this repository
3. Install dependencies:

```bash
npm install
```

## Usage

There are two ways to generate fuel slips:

### 1. Using config.json

1. Edit the `config.json` file with your desired settings:

```json
{
  "fromYear": 2024,
  "fromMonth": "April",
  "toYear": 2025,
  "toMonth": "March",
  "oilCompany": "Indian Oil",
  "fuelType": "Petrol",
  "pumpTemplate": "template-1",
  "approxRate": 94.5,
  "customerName": "Your Name",
  "slipCount": 2,
  "minSlipCount": 2,
  "totalAmount": 6000,
  "stationAddress": "",
  "vehicleNumber": "XX00XX0000",
  "minAmount": 1500,
  "maxAmount": 3500,
  "takeDebugScreenshots": false
}
```

2. Run the config-based generator:

```bash
npm run start-config
```

### 2. Using Interactive CLI

Run the interactive version which will prompt for all required inputs:

```bash
npm run start
```

## Configuration Options

- `fromYear`: Select start year (choices: 2023, 2024, 2025)
- `fromMonth`/`toMonth`: Select month from full month names ("January" through "December")
- `toYear`: Select end year (choices: 2023, 2024, 2025)
- `oilCompany`: Choose from:
  - "Bharat Petroleum"
  - "Indian Oil"
  - "HP Oil"
  - "Essar Oil"
- `fuelType`: Choose from:
  - "Petrol"
  - "Diesel"
  - "CNG"
- `pumpTemplate`: Choose from:
  - "template-1"
  - "template-2"
  - "template-3"
  - "template-4"
- `approxRate`: Enter approximate fuel rate (accepts decimal values)
- `customerName`: Name to appear on slips (optional, will be converted to uppercase)
- `slipCount`: Total number of slips to generate (minimum: 1)
- `minSlipCount`: Minimum number of slips to generate (must be ≤ slipCount)
- `totalAmount`: Total amount to be distributed across all slips
- `stationAddress`: Address of the fuel station (optional)
- `vehicleNumber`: Vehicle registration number (will be converted to uppercase)
- `minAmount`: Minimum amount per slip (must be > 0)
- `maxAmount`: Maximum amount per slip (must be > minAmount)
- `takeDebugScreenshots`: Enable/disable debug screenshots (true/false)

## Important Validation Rules

- Minimum slip count cannot be greater than total slip count
- Maximum amount must be greater than minimum amount
- The total amount must be achievable with the given constraints
- Vehicle numbers and customer names are automatically converted to uppercase
- The system will try to distribute dates evenly across the selected date range
- Each slip will have unique receipt numbers and other identifiers

## Output

Generated slips will be saved in the `downloads` directory.

## Notes

- The program will validate your inputs and warn if the constraints might be difficult to satisfy
- If using config.json, ensure all required fields are filled correctly
- The interactive CLI provides step-by-step guidance and validation
