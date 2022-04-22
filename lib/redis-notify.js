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
    this._deferredSubscriber = deferred();

    this._setupCommands();
    await this._setupSubscriber();
  }

  async _setupSubscriber () {
    if (this.options.mode && (this.options.mode !== 'command')) {
      this.subscriber = new Redis(this.options.redis);
      this.subscriber.on('ready', this._setup.bind(this));

      this.leaderClient = new Redis(Object.assign({}, this.options.redis, { db: 0 }));
      this.leader = await createSafeRedisLeader({
        asyncRedis: this.leaderClient,
        ttl: 1500,
        wait: 3000,
        key: 'redis-notify-election'
      });

      this.leader.on('elected', this._subscribe.bind(this));
      this.leader.on('demoted', this._unsubscribe.bind(this));
      await this.leader.elect();
    }

    this._deferredSubscriber.resolve();
  }

  _setupCommands () {
    this.client = new Redis(this.options.redis);
    this.client.on('ready', this._deferredClient.resolve);

    ['set', 'del'].forEach((method) => {
      this[method] = async (...args) => {
        await Promise.all([
          this._deferredClient.promise,
          this._deferredSubscriber.promise
        ]);

        return this.client[method](...args);
      };
    });
  }

  async _setup () {
    if (this.options.autoSetup) {
      await this.subscriber.config('SET', 'notify-keyspace-events', 'Ex');
    }
  }

  async _subscribe () {
    this.subscriber.subscribe(`__keyevent@${this.options.redis.db}__:expired`);
    this.subscriber.on('message', this.options.callback);
  }

  async _unsubscribe () {
    await this.subscriber.unsubscribe();
    this.subscriber.removeAllListeners();
  }

  ready () {
    return Promise.all([
      this._deferredClient.promise,
      this._deferredSubscriber.promise
    ]);
  }

  async stop () {
    if (this.leader) {
      await this.leader.shutdown();
      this.leader.removeAllListeners();
    }
  }
}

module.exports = RedisNotify;
