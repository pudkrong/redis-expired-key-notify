require('dotenv').config();
const RedisNotify = require('./lib/index');
const { setTimeout } = require('timers/promises');

async function main () {
  const notify = new RedisNotify({
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
    db: process.env.REDIS_DB,
    mode: 'command'
  });

  for (let i = 0; i < 1000; i++) {
    await notify.set(`key${i}`, 1, 'ex', 2);
    console.log(`SET key${i}`);
    await setTimeout(200);
  }
}

main().catch(console.error);
