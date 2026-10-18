const dotenv = require('dotenv');
// Load environment variables before anything else
dotenv.config();

const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(
      `[StaffSync Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
    );
    console.log(`[StaffSync Server] API Base URL: http://localhost:${PORT}/api`);
    console.log(`[StaffSync Server] Health Check: http://localhost:${PORT}/api/health`);
  });

  // Graceful shutdown
  const handleExit = async () => {
    console.log('\n[StaffSync Server] Shutting down gracefully...');
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on('SIGINT', handleExit);
  process.on('SIGTERM', handleExit);
}).catch((err) => {
  console.error('[StaffSync Server] Critical startup error:', err);
  process.exit(1);
});
