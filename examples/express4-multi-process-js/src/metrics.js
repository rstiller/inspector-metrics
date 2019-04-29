const cluster = require('cluster')
const os = require('os')
const packageJson = require('../package.json')

// async function consoleReporter (registry, tags) {
//   const {
//     LoggerReporter
//   } = require('inspector-metrics')

//   const reporter = new LoggerReporter({
//     log: console
//   })

//   reporter.setTags(tags)
//   reporter.addMetricRegistry(registry)

//   await reporter.start()

//   return reporter
// }

async function carbonReporter (registry, tags) {
  const {
    CarbonMetricReporter
  } = require('inspector-carbon')

  const reporter = new CarbonMetricReporter({
    host: 'http://localhost/',
    log: null,
    minReportingTimeout: 30,
    reportInterval: 5000
  })

  reporter.setTags(tags)
  reporter.addMetricRegistry(registry)

  await reporter.start()

  return reporter
}

async function csvReporter (registry, tags) {
  const {
    CsvMetricReporter,
    DefaultCsvFileWriter
  } = require('inspector-csv')

  const reporter = new CsvMetricReporter({
    columns: ['date', 'group', 'name', 'field', 'type', 'value', 'tags'],
    log: null,
    minReportingTimeout: 30,
    reportInterval: 5000,
    writer: new DefaultCsvFileWriter({})
  })

  reporter.setTags(tags)
  reporter.addMetricRegistry(registry)

  await reporter.start()

  return reporter
}

async function elasticsearchReporter (registry, tags) {
  const {
    ElasticsearchMetricReporter
  } = require('inspector-elasticsearch')

  const clientOptions = {
    apiVersion: '6.0',
    host: 'localhost:9200'
  }
  const reporter = new ElasticsearchMetricReporter({
    clientOptions,
    indexnameDeterminator: ElasticsearchMetricReporter.dailyIndex('metric-express-multi-process-js'),
    log: null,
    minReportingTimeout: 30,
    reportInterval: 5000
  })

  reporter.setTags(tags)
  reporter.addMetricRegistry(registry)

  await reporter.start()

  return reporter
}

async function influxReporter (registry, tags) {
  const {
    DefaultSender,
    InfluxMetricReporter
  } = require('inspector-influx')

  const sender = new DefaultSender({
    database: 'express4',
    hosts: [{
      host: '127.0.0.1',
      port: 8086
    }]
  })
  const reporter = new InfluxMetricReporter({
    log: null,
    minReportingTimeout: 30,
    reportInterval: 5000,
    sender
  })

  reporter.setTags(tags)
  reporter.addMetricRegistry(registry)

  await reporter.start()

  return reporter
}

async function prometheusReporter (registry, tags) {
  const {
    PrometheusMetricReporter
  } = require('inspector-prometheus')
  const express = require('express')

  const reporter = new PrometheusMetricReporter({})

  reporter.setTags(tags)
  reporter.addMetricRegistry(registry)

  await reporter.start()

  if (cluster.isMaster) {
    const app = express()
    const port = 3001
    app.get('/metrics', async (req, res) => {
      const metricStr = await reporter.getMetricsString()
      res
        .status(200)
        .type('text/plain')
        .send(metricStr)
    })
    app.listen(port, () => console.log(`/metrics endpoint listening on port ${port} with pid ${process.pid}!`))
  }

  return reporter
}

async function install () {
  const {
    MetricRegistry
  } = require('inspector-metrics')
  const {
    V8MemoryMetrics,
    V8GCMetrics,
    V8EventLoop,
    V8ProcessMetrics
  } = require('inspector-vm')

  const registry = new MetricRegistry()
  registry.registerMetric(new V8GCMetrics('gc', registry.getDefaultClock()))
  registry.registerMetric(new V8MemoryMetrics('memory'))
  registry.registerMetric(new V8EventLoop('eventLoop'))
  registry.registerMetric(new V8ProcessMetrics('process'))
  registry.setTag('isMaster', `${cluster.isMaster}`)
  registry.setTag('hostname', os.hostname())

  const reportingTags = new Map()
  reportingTags.set('pid', `${process.pid}`)
  reportingTags.set('application', packageJson.name)
  reportingTags.set('version', packageJson.version)

  module.exports.registry = registry
  module.exports.reporter = {
    carbon: await carbonReporter(registry, reportingTags),
    csv: await csvReporter(registry, reportingTags),
    elasticsearch: await elasticsearchReporter(registry, reportingTags),
    influx: await influxReporter(registry, reportingTags),
    prometheus: await prometheusReporter(registry, reportingTags)
  }
}

module.exports = {
  install
}
