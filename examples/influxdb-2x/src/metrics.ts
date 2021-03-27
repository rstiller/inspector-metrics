import { ClientOptions } from '@influxdata/influxdb-client'
import { Influxdb2Sender, InfluxMetricReporter } from 'inspector-influx'
import { Event, MetricRegistry } from 'inspector-metrics'
import {
  V8EventLoop,
  V8GCMetrics,
  V8MemoryMetrics,
  V8ProcessMetrics
} from 'inspector-vm'
import { hostname } from 'os'

export class MetricsSupport {
  public readonly reporter: InfluxMetricReporter;
  public readonly registry: MetricRegistry;
  public readonly packageJson: any;

  public constructor () {
    // settings from docker-compose.yml
    const clientOptions: ClientOptions = {
      url: 'http://localhost:8087',
      token: 'che2u4kqsajBirtunseKpCOX0Z4sebMB6JEzibbc3prOyyAkzdMCfFLgQhVqRUgQRlAlyKz8PlWq-Z2NhAVkNw=='
    }
    this.registry = new MetricRegistry()
    this.reporter = new InfluxMetricReporter({
      sender: new Influxdb2Sender(clientOptions, 'testing', 'test-bucket', [], 'ms', {
        batchSize: 10,
        defaultTags: {},
        flushInterval: 0,
        maxBufferLines: 10_000,
        maxRetries: 3,
        maxRetryDelay: 3000,
        minRetryDelay: 1000,
        retryJitter: 1000,
        writeFailed: function(error, lines, failedAttempts) { console.log(error, lines, failedAttempts)},
      }),
      log: null,
      minReportingTimeout: 30,
      reportInterval: 5000
    })

    this.packageJson = require('../../package.json')
  }

  public async init (): Promise<void> {
    this.registry.registerMetric(new V8GCMetrics('gc', this.registry.getDefaultClock()))
    this.registry.registerMetric(new V8MemoryMetrics('memory'))
    this.registry.registerMetric(new V8EventLoop('eventLoop'))
    this.registry.registerMetric(new V8ProcessMetrics('process'))
    this.registry.setTag('hostname', hostname())

    const reportingTags = new Map()
    reportingTags.set('pid', `${process.pid}`)
    reportingTags.set('application', this.packageJson.name)
    reportingTags.set('version', this.packageJson.version)

    this.reporter.setTags(reportingTags)
    this.reporter.addMetricRegistry(this.registry)

    await this.reporter.start()
  }

  public async reportEvent (event: Event<any>): Promise<Event<any>> {
    return await this.reporter.reportEvent(event)
  }
}
