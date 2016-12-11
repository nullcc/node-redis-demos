const redis = require('redis');

function redisClient(conf, cb) {
  const client = redis.createClient();

  client.on('error', (error) => {
    console.error('redis error: ', error);
  });

  client.on('end', () => {
    console.log('redis disconnected');
  });

  client.on('connect', () => {
    console.log(`redis connected to ${conf.url}`);
    cb();
  });

  return client;
};

module.exports = {
  redisClient
};
