[![Moleculer](https://badgen.net/badge/Powered%20by/Moleculer/0e83cd)](https://moleculer.services)

# redis-expird-key-notify
This project is POC to test how to redis notifies when a key is expired. Redis has a feature called **Keyspace Notification**. To enable this feature, we have to explicitly configure the redis as described here, https://redis.io/docs/manual/keyspace-notifications/.

## Usage
Start the project with `npm run dev` command.
In the terminal, try the following commands:
- `nodes` - List all connected nodes.
- `actions` - List all registered service actions.