'use strict';

const fs = require('fs');
const path = require('path');

const TRACKER_PATH = path.join(__dirname, '..', '..', 'data', 'history_tracker.json');

function readTracker() {
  try {
    if (fs.existsSync(TRACKER_PATH)) {
      const raw = fs.readFileSync(TRACKER_PATH, 'utf8');
      const data = JSON.parse(raw);
      return typeof data === 'object' && data !== null ? data : {};
    }
  } catch (_) {}
  return {};
}

function writeTracker(data) {
  try {
    const dir = path.dirname(TRACKER_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(TRACKER_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (_) {}
}

function hasPostedDate(key, dateStr) {
  if (!dateStr) return false;
  const tracker = readTracker();
  return tracker[key] === dateStr;
}

function recordPostedDate(key, dateStr) {
  if (!dateStr) return;
  const tracker = readTracker();
  tracker[key] = dateStr;
  writeTracker(tracker);
}

module.exports = {
  hasPostedDate,
  recordPostedDate
};
