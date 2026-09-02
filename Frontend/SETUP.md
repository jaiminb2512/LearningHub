# Setup Guide - Interest Comparator

This guide provides detailed instructions for setting up and running the Interest Comparator application on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

1. **Node.js** (version 18.0.0 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **npm** (comes with Node.js) or **yarn**
   - Verify npm installation: `npm --version`
   - Alternatively, install yarn: `npm install -g yarn`

3. **Git** (recommended for version control)
   - Download from [git-scm.com](https://git-scm.com/)
   - Verify installation: `git --version`

### Recommended Tools

- **Visual Studio Code** or any modern code editor
- **Chrome/Firefox DevTools** for debugging
- **React Developer Tools** browser extension

## Installation Steps

### 1. Clone or Download the Repository

If using Git:
```bash
git clone <repository-url>
cd "Intrest calculator"
```

If you have the project as a zip file, extract it and navigate to the project directory.

### 2. Install Dependencies

Run the following command in the project root directory:

```bash
npm install
```

This will install all required dependencies including:
- React and React DOM
- Material-UI and related packages
- React Router DOM
- Vite build tool
- ESLint and development tools

**Note**: The installation may take a few minutes depending on your internet connection.

### 3. Verify Installation

Check that all dependencies are installed correctly:

```bash
npm list --depth=0
```

You should see a list of installed packages without any errors.

## Running the Application

### Development Mode

To start the application in development mode with hot reload:

```bash
npm run dev
```

The development server will start, and you should see output similar to:

```
VITE v7.1.14  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

Open your browser and navigate to `http://localhost:5173/` to view the application.

**Features in Development Mode:**
- Hot Module Replacement (HMR) - changes reflect instantly
- Source maps for easier debugging
- Detailed error messages
- React DevTools support

### Production Build

To create an optimized production build:

```bash
npm run build
```

This will:
- Create a `dist` folder with optimized files
- Minify JavaScript and CSS
- Optimize assets for production
- Generate sourcemaps

### Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

This starts a local server serving the production build from the `dist` folder.

## Configuration

### Port Configuration

If port 5173 is already in use, Vite will automatically try the next available port. To specify a custom port, modify `vite.config.js`:

```javascript
export default defineConfig({
  server: {
    port: 3000, // Your preferred port
  },
})
```

### Theme Customization

The application theme can be customized in `src/styles/theme.js`. You can modify:
- Color schemes
- Typography
- Component styles
- Spacing and breakpoints

### Environment Variables

If your application requires environment variables, create a `.env` file in the project root:

```env
VITE_APP_TITLE=Interest Calculator
VITE_API_URL=http://localhost:3000
```

Access these variables in your code using `import.meta.env.VITE_APP_TITLE`.

## Troubleshooting

### Common Issues and Solutions

#### 1. Port Already in Use

**Error**: `Port 5173 is already in use`

**Solution**:
- Close other applications using the port
- Or let Vite use an alternative port automatically
- Or specify a different port in vite.config.js

#### 2. Module Not Found Errors

**Error**: `Cannot find module 'xyz'`

**Solution**:
```bash
# Clear node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install
```

#### 3. Build Failures

**Error**: Build fails with various errors

**Solution**:
```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Try building again
npm run build
```

#### 4. ESLint Errors

**Error**: ESLint configuration errors

**Solution**:
```bash
# Run ESLint manually to see specific errors
npm run lint

# Or disable ESLint temporarily in vite.config.js
```

#### 5. React Version Conflicts

**Error**: Hook or component errors related to React versions

**Solution**:
```bash
# Ensure only one version of React is installed
npm list react react-dom

# If multiple versions exist, clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Windows-Specific Issues

If you encounter path-related issues on Windows:

1. Use PowerShell or Command Prompt as Administrator
2. Ensure your antivirus isn't blocking Node.js
3. Try using forward slashes (/) instead of backslashes (\) in paths
4. Consider using Windows Subsystem for Linux (WSL) for better compatibility

## Development Workflow

### Recommended Workflow

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Make Changes**
   - Edit files in `src/` directory
   - Changes will automatically reload in the browser

3. **Test Your Changes**
   - Verify functionality in the browser
   - Check console for errors
   - Test on different screen sizes

4. **Lint Your Code**
   ```bash
   npm run lint
   ```

5. **Build for Production**
   ```bash
   npm run build
   ```

6. **Preview Production Build**
   ```bash
   npm run preview
   ```

### Code Style Guidelines

- Use functional components with hooks
- Follow Material-UI component patterns
- Keep components small and focused
- Use custom hooks for shared logic
- Maintain proper file organization in src/ folders

## Additional Setup

### Setting Up Git (Optional)

If you want to track changes with Git:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit"
```

The project includes a `.gitignore` file that excludes:
- node_modules/
- dist/
- .env files
- Build artifacts

### IDE Configuration

#### Visual Studio Code

Recommended extensions:
- ESLint
- Prettier - Code formatter
- ES7+ React/Redux/React-Native snippets
- Material-UI Snippets

Add these settings to `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.validate": ["javascript", "javascriptreact"]
}
```

## Next Steps

After successful setup:

1. Familiarize yourself with the project structure
2. Review the main components in `src/components/`
3. Understand the calculation logic in `src/utils/calculations.js`
4. Explore the custom hooks in `src/hooks/`
5. Try modifying the theme in `src/styles/theme.js`

## Getting Help

If you encounter issues not covered in this guide:

1. Check the browser console for error messages
2. Review the terminal output for build errors
3. Ensure all prerequisites are correctly installed
4. Try clearing caches and reinstalling dependencies
5. Consult the main [README.md](README.md) for project overview

## Performance Tips

For optimal development experience:

- Close unnecessary browser tabs
- Disable browser extensions that might interfere
- Keep your Node.js version updated
- Use SSD storage for faster file operations
- Allocate sufficient RAM (minimum 4GB recommended)

---

**Setup Complete!** You should now have a fully functional development environment for the Interest Comparator application.

