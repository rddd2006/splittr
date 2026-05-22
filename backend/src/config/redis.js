const { createClient } = require('redis');

let client = null;

const getRedisClient = async () => {
  if (client && client.isOpen) return client;

  client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.error('Redis: too many reconnect attempts, giving up');
          return new Error('Too many retries');
        }
        return Math.min(retries * 100, 3000);
      },
    },
  });

  client.on('error', (err) => console.error('Redis client error:', err));
  client.on('connect', () => console.log('✅ Redis connected'));
  client.on('reconnecting', () => console.warn('⚠️  Redis reconnecting...'));

  await client.connect();
  return client;
};

const isRedisAvailable = async () => {
  try {
    const c = await getRedisClient();
    await c.ping();
    return true;
  } catch {
    return false;
  }
};

module.exports = { getRedisClient, isRedisAvailable };
