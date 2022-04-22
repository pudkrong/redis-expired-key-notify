require('dotenv').config();
const RedisNotify = require('./lib/index');
const { setTimeout } = require('timers/promises');

async function main () {
  const notify = new RedisNotify({
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
    db: process.env.REDIS_DB,
    mode: 'worker',
    callback: (key) => {
      console.log('expired key:', key);
    }
  });

  async function stop () {
    const delay = Math.random() * 10000;
    console.log(`waiting for ${delay} ms`);
    await setTimeout(delay);
    await notify.leader.stop();
    await setTimeout(delay);
    await notify.leader.elect();
    stop();
  }

  stop();
}

main().catch(console.error);
