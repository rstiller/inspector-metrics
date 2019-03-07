const cluster = require('cluster')
const packageJson = require('../package.json')

async function influxReporter (registry, tags) {
  const influx = require('inspector-influx')

  const sender = new influx.DefaultSender({
    database: 'express4',
    hosts: [{
      host: '127.0.0.1',
      port: 8086
    }]
  })
  const reporter = new influx.InfluxMetricReporter({
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
    influx: await influxReporter(registry, reportingTags)
  }
}

module.exports = {
  install
}
