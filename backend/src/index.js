require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Splittr API running on port ${PORT} [${process.env.NODE_ENV}]`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});
