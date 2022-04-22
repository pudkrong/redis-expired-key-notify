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
    },

    demote: {
      async handler (ctx) {
        await this.notify.leader.stop();
        await setTimeout(5000);
        await ctx.call('notify.elect');
      }
    },

    elect: {
      async handler () {
        console.log('ELECT');
        await this.notify.leader.elect();
      }
    }
  },

  created () {
    this.notify = new RedisNotify({
      redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        db: process.env.REDIS_DB,
      }
    });
  },

  async started () {
    if (this.settings.mode === 'worker') {
      await this.notify.subscribe((channel, key) => {
        console.log('Expired Key', key);
      });
    }
  },

  async stopped () {
    await this.notify.unsubscribe();
  }
};
