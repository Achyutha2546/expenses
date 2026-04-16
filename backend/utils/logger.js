// backend/utils/logger.js
const logger = {
  error: (info) => {
    console.error('[ERROR]', info);
  },
  info: (msg) => {
    console.log('[INFO]', msg);
  }
};
module.exports = logger;
