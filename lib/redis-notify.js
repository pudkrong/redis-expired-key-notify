const { default: Redis } = require('ioredis');
const { createSafeRedisLeader } = require('safe-redis-leader');

function deferred () {
  let resolve, reject;
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });

  return {
    resolve,
    reject,
    promise
  };
}

class RedisNotify {
  constructor (options) {
    this.options = Object.assign({
      redis: {
        host: 'localhost',
        port: 6379,
        db: 10
      },
      mode: 'worker',
      autoSetup: false
    }, options);

    this.init();
  }

  async init () {
    this._deferredClient = deferred();

    this._setupCommands();
  }

  _setupCommands () {
    this.client = new Redis(this.options.redis);
    this.client.on('ready', this._deferredClient.resolve);

    ['set', 'del'].forEach((method) => {
      this[method] = async (...args) => {
        await this._deferredClient.promise;
        return this.client[method](...args);
      };
    });
  }

  async _setupRedisKeyspaceNotification () {
    if (this.options.autoSetup) {
      await this.subscriber.config('SET', 'notify-keyspace-events', 'Ex');
    }
  }

  async _subscribe (callback) {
    this.subscriber.subscribe(`__keyevent@${this.options.redis.db}__:expired`);
    this.subscriber.on('message', callback);
  }

  async _unsubscribe () {
    await this.subscriber.unsubscribe();
    this.subscriber.removeAllListeners();
  }

  async subscribe (callback) {
    if (!this.leader) {
      this.subscriber = new Redis(this.options.redis);
      this.subscriber.on('ready', this._setupRedisKeyspaceNotification.bind(this));

      this.leaderClient = new Redis(Object.assign({}, this.options.redis, { db: 0 }));
      this.leader = await createSafeRedisLeader({
        asyncRedis: this.leaderClient,
        ttl: 1500,
        wait: 3000,
        key: 'redis-key-expired-notify-election'
      });
    }

    this.leader.on('elected', () => {
      // console.log('Leader');
      this._subscribe(callback);
    });
    this.leader.on('demoted', this._unsubscribe.bind(this));
    return this.leader.elect();
  }

  async unsubscribe () {
    if (this.leader) {
      // console.log('Demoted');
      await this.leader.shutdown();
      this.leader.removeAllListeners();
    }
  }
}

module.exports = RedisNotify;
