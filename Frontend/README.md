# Interest Comparator

A modern, feature-rich web application for comparing multiple investments and analyzing their returns with an intuitive user interface. Built with React, Vite, and Material-UI.

## Overview

Interest Comparator is a comprehensive financial comparison tool that helps users add multiple investments, compare their returns side by side, and identify the best investment options. The application features a clean, responsive design with light and dark theme support, making it easy to manage and compare various investment opportunities.

## Features

### Core Functionality
- **Multiple Investment Management**: Add unlimited investments with custom names and parameters
- **Interest Calculation**: Calculate interest using simple interest formula with cycle support
- **Flexible Time Input**: Support for years, months, and days for each investment
- **Cycle-Based Calculations**: Support for multiple interest cycles with compounding
- **Date-Based Calculations**: Automatically calculate end dates based on start date and time period
- **Investment Comparison**: Select multiple investments and compare them side by side

### Comparison Features
- **Side-by-Side Comparison**: View all selected investments in a detailed comparison table
- **Best Investment Identification**: Automatically highlights the investment with the best return rate
- **Highest Amount Tracking**: Identifies the investment with the highest total amount
- **Summary Statistics**: View combined totals, average returns, and other aggregate data
- **Return Percentage**: Calculate and display return percentage for each investment
- **Visual Indicators**: Color-coded chips and badges to identify top performers

### User Interface
- **Material-UI Components**: Modern, professional design using Material-UI
- **Theme Toggle**: Switch between light and dark themes with persistent preference storage
- **Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices
- **Form Validation**: Input validation to ensure accurate calculations
- **Interactive Selection**: Checkbox-based selection system for choosing investments to compare
- **Quick Actions**: Easy add, remove, and clear all functionality

### Additional Pages
- **Interest Comparator**: Main comparison interface (home page)
- **Salary Page**: Dedicated page for salary-related calculations
- **Interest Schemes**: Information and tools for various interest schemes

## Tech Stack

- **Frontend Framework**: React 19.1.1
- **Build Tool**: Vite (using Rolldown)
- **UI Library**: Material-UI 5.14.18
- **Routing**: React Router DOM 7.9.4
- **Styling**: Emotion (CSS-in-JS)
- **Icons**: Material-UI Icons

## Project Structure

```
src/
├── components/
│   ├── calculator/       # Calculator-specific components
│   ├── display/          # Display components
│   │   ├── InvestmentList.jsx   # List of all investments
│   │   ├── ComparisonView.jsx   # Comparison table and stats
│   │   └── ResultsDisplay.jsx   # Individual results display
│   ├── forms/            # Form components
│   │   └── InputForm.jsx        # Investment input form
│   └── Header.jsx        # Navigation header
├── pages/
│   ├── InterestCalculator.jsx  # Main comparator page
│   ├── SalaryPage.jsx          # Salary calculations page
│   └── InterestSchemePage.jsx  # Interest schemes page
├── hooks/
│   └── useInterestCalculator.js # Custom hook for managing investments
├── utils/
│   ├── calculations.js   # Interest calculation utilities
│   └── validators.js     # Input validation functions
├── styles/
│   └── theme.js          # Material-UI theme configuration
├── App.jsx               # Main application component
└── main.jsx              # Application entry point
```

## Getting Started

For detailed installation and setup instructions, please refer to [SETUP.md](SETUP.md).

### Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

### Adding Investments

1. Enter a descriptive name for your investment (e.g., "Bank FD", "Stock Portfolio")
2. Enter the principal amount
3. Specify the interest rate (as a percentage)
4. Enter the time period (years, months, and/or days)
5. Set the number of cycles (1 for single calculation, 2+ for compound cycles)
6. Optionally, select a start date for date-based tracking
7. Optionally, enter an end date to highlight which cycle reaches it
8. Click "Add Investment" to add it to your list

### Comparing Investments

1. After adding multiple investments, they will appear in cards below the form
2. Check the box next to each investment you want to compare
3. The comparison view automatically appears when you select investments
4. View the comparison table showing all details side by side
5. See which investment offers the best return rate (highlighted in green)
6. Review summary statistics showing totals and averages

### Managing Investments

- **Remove Individual Investment**: Click the delete icon on any investment card
- **Clear All Investments**: Click the "Clear All" button in the top-right corner
- **Toggle Selection**: Check/uncheck boxes to add or remove from comparison

### Understanding Results

Each investment card shows:
- Principal amount invested
- Interest rate
- Duration and number of cycles
- Total interest earned
- Final total amount
- Return percentage (gain as % of principal)

The comparison view provides:
- Side-by-side table of all selected investments
- Best return rate indicator
- Highest total amount indicator
- Combined totals for all selected investments
- Average return across selected investments

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Create production build
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint to check code quality

## Browser Support

The application supports all modern browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

This project is currently in development. Contributions, issues, and feature requests are welcome.

## License

This project is private and not licensed for public use.

## Version

Current Version: 0.0.0

## Contact

For questions or support, please contact the project maintainer.

---

## How It Works

The Interest Comparator uses a cycle-based simple interest calculation where each cycle's ending amount becomes the principal for the next cycle. This simulates a reinvestment scenario:

**Formula**: SI = (P × R × T) / 100

For multiple cycles:
- Cycle 1: Interest = (P × R × T) / 100, Ending Amount = P + Interest
- Cycle 2: Interest = (Ending Amount from Cycle 1 × R × T) / 100
- And so on...

**Return Percentage** = ((Total Amount - Principal) / Principal) × 100

---

**Note**: This application is designed for educational and personal financial planning purposes. Always consult with financial professionals for important financial decisions.
