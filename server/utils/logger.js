/**
 * Custom logger for standardized error reporting
 * @param {string} context - The context or method where the error occurred
 * @param {Error|any} error - The error object or message
 */
export const logError = (context, error) => {
  const timestamp = new Date().toISOString();
  const message = error.message || error;
  
  console.error(`[${timestamp}] [ERROR] [${context}]: ${message}`);
  
  if (error.stack && process.env.NODE_ENV === 'development') {
    console.debug(error.stack);
  }
};
