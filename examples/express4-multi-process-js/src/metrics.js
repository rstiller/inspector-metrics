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
  const metrics = require('inspector-metrics')
  const vm = require('inspector-vm')

  const registry = new metrics.MetricRegistry()
  const memoryMetric = new vm.V8MemoryMetrics('memory')
  const gcMetric = new vm.V8GCMetrics('gc', registry.getDefaultClock())
  const eventLoop = new vm.V8EventLoop('eventLoop')
  const processMetric = new vm.V8ProcessMetrics('process')

  registry.registerMetric(gcMetric)
  registry.registerMetric(memoryMetric)
  registry.registerMetric(eventLoop)
  registry.registerMetric(processMetric)

  const reportingTags = new Map()
  reportingTags.set('application', 'express4-multi-process')
  reportingTags.set('version', '1.0.0')
  reportingTags.set('pid', process.pid)

  module.exports.registry = registry
  module.exports.reporter = {
    influx: await influxReporter(registry, reportingTags)
  }
}

module.exports = {
  install
}
