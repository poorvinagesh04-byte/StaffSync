const mongoose = require('mongoose');

/**
 * Connects to MongoDB using MONGODB_URI from environment variables.
 * Exits the process immediately if the URI is missing or the connection fails.
 * The full URI (which contains credentials) is never logged — only the host name.
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error(
      '[Database] CRITICAL: MONGODB_URI is not defined in environment variables.\n' +
      '           Please set it in server/.env before starting the application.'
    );
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    // Log only the host — never the full URI which contains credentials
    console.log(`[Database] Connected to MongoDB: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error('[Database] Connection FAILED:', err.message);
    console.error('[Database] Verify your MONGODB_URI in server/.env and that your Atlas cluster is reachable.');
    process.exit(1);
  }
};

/**
 * Gracefully disconnects from MongoDB.
 */
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('[Database] MongoDB disconnected successfully.');
  } catch (err) {
    console.error('[Database] Error while disconnecting:', err.message);
  }
};

module.exports = { connectDB, disconnectDB };
