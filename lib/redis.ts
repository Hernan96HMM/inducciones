import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redis: Redis
  redisSub: Redis
}

function createRedis() {
  const client = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  })
  client.on('error', (err) => console.error('[redis]', err.message))
  return client
}

// redis pub client (shared)
export const redis = globalForRedis.redis ?? createRedis()

// redis sub client — separate connection required for subscribe mode
export const redisSub = globalForRedis.redisSub ?? createRedis()

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis
  globalForRedis.redisSub = redisSub
}

export async function publish(channel: string, data: unknown) {
  await redis.publish(channel, JSON.stringify(data))
}
