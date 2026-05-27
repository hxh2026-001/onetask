const fastify = require('fastify')({ logger: true })
const path = require('path')

fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, '../client/dist'),
  prefix: '/'
})

fastify.register(require('./routes/graph'), { prefix: '/api/graph' })
fastify.register(require('./routes/simulation'), { prefix: '/api/simulation' })
fastify.register(require('./routes/presets'), { prefix: '/api/presets' })

fastify.addHook('onRequest', (request, reply, done) => {
  reply.header('Access-Control-Allow-Origin', '*')
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  reply.header('Access-Control-Allow-Headers', 'Content-Type')
  if (request.method === 'OPTIONS') {
    reply.send()
    return
  }
  done()
})

const start = async () => {
  try {
    await fastify.listen({ port: 3020 })
    console.log('Server listening on http://localhost:3020')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()