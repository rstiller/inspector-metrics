import { ClientOptions } from '@elastic/elasticsearch'
import { ElasticsearchMetricReporter } from 'inspector-elasticsearch'
import { Event, MetricRegistry } from 'inspector-metrics'
import {
  V8EventLoop,
  V8GCMetrics,
  V8MemoryMetrics,
  V8ProcessMetrics
} from 'inspector-vm'
import { hostname } from 'os'

export class MetricsSupport {
  public readonly reporter: ElasticsearchMetricReporter;
  public readonly registry: MetricRegistry;
  public readonly packageJson: any;

  public constructor () {
    const clientOptions: ClientOptions = {
      node: 'http://localhost:9200'
    }
    this.registry = new MetricRegistry()
    this.reporter = new ElasticsearchMetricReporter({
      clientOptions,
      indexnameDeterminator: ElasticsearchMetricReporter.dailyIndex('metric-elasticsearch-5'),
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
