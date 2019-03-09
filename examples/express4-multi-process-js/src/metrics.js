const cluster = require('cluster')
const packageJson = require('../package.json')

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
    minReportingTimeout: 1440,
    reportInterval: 1000,
    sender
  })

  reporter.setTags(tags)
  reporter.addMetricRegistry(registry)

  await reporter.start()

  return reporter
}

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

async function csvReporter (registry, tags) {
  const {
    CsvMetricReporter,
    DefaultCsvFileWriter
  } = require('inspector-csv')

  const reporter = new CsvMetricReporter({
    log: null,
    columns: ['date', 'group', 'name', 'field', 'type', 'value', 'tags'],
    writer: new DefaultCsvFileWriter({})
  })

  reporter.setTags(tags)
  reporter.addMetricRegistry(registry)

  await reporter.start()

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
  registry.setTag('pid', process.pid)
  registry.setTag('isMaster', cluster.isMaster)

  const reportingTags = new Map()
  reportingTags.set('application', packageJson.name)
  reportingTags.set('version', packageJson.version)

  module.exports.registry = registry
  module.exports.reporter = {
    influx: await influxReporter(registry, reportingTags),
    // console: await consoleReporter(registry, reportingTags),
    csv: await csvReporter(registry, reportingTags)
  }
}

module.exports = {
  install
}
