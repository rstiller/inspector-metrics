const cluster = require('cluster')
const os = require('os')
const metrics = require('./metrics')
const Event = require('inspector-metrics').Event

async function start () {
  await metrics.install()

  if (cluster.isMaster) {
    const cpuCount = require('os').cpus().length
    cluster.on('exit', function (worker) {
      console.log(`respawning worker ${worker.id}`)
      cluster.fork()
    })
    for (let i = 0; i < cpuCount; i++) {
      cluster.fork()
    }
    console.log(`master process with pid ${process.pid}`)

    const event = new Event('event', 'marks the startup of this application', null, new Date())
      .setTag('type', 'application-start')
      .setTag('text', `application started at ${new Date()} on host ${os.hostname()}`)
      .setValue(1)
    // metrics.reporter.carbon.reportEvent(event)
    // metrics.reporter.csv.reportEvent(event)
    // metrics.reporter.elasticsearch.reportEvent(event)
    // metrics.reporter.influx.reportEvent(event)
    metrics.reporter.prometheus.reportEvent(event)
  } else {
    const express = require('express')
    const app = express()
    const port = 8080
    app.get('/', (req, res) => res.send('Hello World!'))
    app.listen(port, () => console.log(`worker process listening on port ${port} with pid ${process.pid}!`))
  }
}

start()
