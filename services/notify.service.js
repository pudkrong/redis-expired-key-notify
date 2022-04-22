'use strict';

const RedisNotify = require('../lib/redis-notify');
const { setTimeout } = require('timers/promises');

module.exports = {
  name: 'notify',

  settings: {
    mode: process.env.NOTIFY_MODE || 'worker'
  },

  actions: {
    gen: {
      params: {
        n: 'number'
      },
      async handler (ctx) {
        for (let i = 0; i < ctx.params.n; i++) {
          console.info(`Set key${i} with 2s ttl`);
          this.notify.set(`key${i}`, i, 'ex', (i + 1) * 2);
        }
      }
    },

    genOnce: {
      async handler () {
        this.notify.set('TempKey', 'test', 'ex', 2);
      }
    }
  },

  created () {
    this.notify = new RedisNotify({
      redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        db: process.env.REDIS_DB,
      },
      mode: this.settings.mode,
      callback: (channel, key) => {
        console.info(`Expired key: ${key}`);
      }
    });
  },

  async started () {
    await this.notify.ready();
  },

  async stopped () {
    await this.notify.stop();
  }
};
