const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
if (typeof process.loadEnvFile === 'function' && fs.existsSync(envPath)) {
  try {
    process.loadEnvFile(envPath);
  } catch (e) {
    console.warn('Failed to load .env in test setup:', e.message);
  }
}
