

const fs = require('fs');
const Path = require('path');

const getSettingsObject = (settings) => {
  try {
    return JSON.parse(settings);
  } catch {
    return null;
  }
};

const getSettingsFromFile = (settingsPath) => {
  if (fs.existsSync(settingsPath)) {
    const file = fs.readFileSync(settingsPath, 'utf8');
    try {
      return JSON.parse(file);
    } catch {
      return null;
    }
  }
  return null;
};

const fetchConfig = () => {
  if (process.env.settings) {
    const settings = process.env.settings;
    let settingsObject = getSettingsObject(settings);
    if (settingsObject !== null) {
      return settingsObject;
    }
    const settingsPath = Path.resolve(settings);
    if (fs.existsSync(settingsPath)) {
      settingsObject = getSettingsFromFile(settingsPath);
      if (settingsObject !== null) {
        return settingsObject;
      }
    }
  }

  throw new Error('Missing configuration');
};

module.exports = fetchConfig();
