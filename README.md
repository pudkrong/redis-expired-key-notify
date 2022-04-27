[![Moleculer](https://badgen.net/badge/Powered%20by/Moleculer/0e83cd)](https://moleculer.services)

# redis-expired-key-notify
This project is POC to test how to redis notifies when a key is expired. Redis has a feature called **Keyspace Notification**. To enable this feature, we have to explicitly configure the redis as described here, https://redis.io/docs/manual/keyspace-notifications/.

## Prerequisite
- Run Redis server
```
$ docker run -d --name redis -p 6379:6379 redis:6
```
- Turn on keyspace notification feature
```
$ docker exec -it redis redis-cli
> config set notify-keyspace-events Ex
```

## Usage
- Create `.env` file as follows
```
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=10
```
- Open 3 terminals
- On terminal #2, #3, run command
```
$ npm run dev
```
- On terminal #1, run command
```
$ NOTIFY_MODE=command npm run dev
```
- On terminal #1, run command
```
mol $ call notify.genOnce
```
- There will be a message saying `Expired Key TempKey` on either termnial #2 or #3
- If you see message on terminal #2, go to terminal #2 then type `mol $ call notify.demote`
- Leave it for a few seconds
- Go to terminal #1, type `mol $ call notify.genOnce`
- Now you will see the message will appear on other terminal
- You can try to call `mol $ call notify.demote` between worker nodes to see how it works