import 'source-map-support/register'

import {
  Counter,
  DefaultClusterOptions,
  Event,
  Gauge,
  Histogram,
  Logger,
  Meter,
  Metric,
  MetricRegistry,
  MetricSetReportContext,
  MetricType,
  MILLISECOND,
  MonotoneCounter,
  OverallReportContext,
  ReportingResult,
  ScheduledMetricReporter,
  ScheduledMetricReporterOptions,
  StdClock,
  Tags,
  Timer
} from 'inspector-metrics'

/**
 * Graphite / carbon client module.
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const graphite = require('graphite')

/**
 * Extending standard options with `host` and `log` properties.
 *
 * @export
 * @interface CarbonMetricReporterOptions
 * @extends {ScheduledMetricReporterOptions}
 */
export interface CarbonMetricReporterOptions extends ScheduledMetricReporterOptions {
  /**
   * The graphite / carbon host.
   *
   * @type {string}
   * @memberof CarbonMetricReporterOptions
   */
  readonly host: string
  /**
   * Minimal logger interface to report failures.
   *
   * @type {Logger}
   * @memberof CarbonMetricReporterOptions
   */
  log: Logger
}

/**
 * Helper interface for representing the result of a metric report.
 *
 * @export
 * @interface CarbonData
 */
export interface CarbonData {
  /**
   * Document that is getting sent to the carbon / graphite server.
   *
   * @type {*}
   * @memberof CarbonData
   */
  measurement: any
  /**
   * Combined tags for the metric.
   *
   * @type {Tags}
   * @memberof CarbonData
   */
  tags: Tags
}

/**
 * Metric reporter for graphite / carbon.
 *
 * @export
 * @class CarbonMetricReporter
 * @extends {ScheduledMetricReporter<CarbonMetricReporterOptions, CarbonData>}
 */
export class CarbonMetricReporter extends ScheduledMetricReporter<CarbonMetricReporterOptions, CarbonData> {
  /**
   * Metadata for the logger.
   *
   * @private
   * @type {*}
   * @memberof CarbonMetricReporter
   */
  private readonly logMetadata: any;
  /**
   * Graphite / carbon client instance.
   *
   * @private
   * @type {*}
   * @memberof CarbonMetricReporter
   */
  private client: any;

  /**
   * Creates an instance of CarbonMetricReporter.
   *
   * @param {string} [reporterType] the type of the reporter implementation - for internal use
   * @memberof CarbonMetricReporter
   */
  public constructor ({
    host,
    log = console,
    reportInterval = 1000,
    unit = MILLISECOND,
    clock = new StdClock(),
    scheduler = setInterval,
    minReportingTimeout = 1,
    tags = new Map(),
    clusterOptions = new DefaultClusterOptions()
  }: CarbonMetricReporterOptions,
  reporterType?: string) {
    super({
      clock,
      clusterOptions,
      host,
      log,
      minReportingTimeout,
      reportInterval,
      scheduler,
      tags,
      unit
    }, reporterType)

    this.logMetadata = {
      reportInterval,
      tags,
      unit
    }
  }

  /**
   * Gets the logger instance.
   *
   * @returns {Logger}
   * @memberof CarbonMetricReporter
   */
  public getLog (): Logger {
    return this.options.log
  }

  /**
   * Sets the logger instance.
   *
   * @param {Logger} log
   * @memberof CarbonMetricReporter
   */
  public setLog (log: Logger): void {
    this.options.log = log
  }

  /**
   * Reports an {@link Event}.
   *
   * @template TEventData
   * @template TEvent
   * @param {TEvent} event
   * @returns {Promise<TEvent>}
   * @memberof CarbonMetricReporter
   */
  public async reportEvent<TEventData, TEvent extends Event<TEventData>>(event: TEvent): Promise<TEvent> {
    const result = this.reportGauge(event, {
      date: event.getTime(),
      metrics: [],
      overallCtx: null,
      registry: null,
      type: 'gauge'
    })

    if (result) {
      await this.handleResults(
        this.createOverallReportContext(),
        null,
        event.getTime(),
        'gauge',
        [{
          metric: event,
          result
        }]
      )
    }

    return event
  }

  /**
   * Does nothing
   *
   * @returns {Promise<void>}
   * @memberof CarbonMetricReporter
   */
  public async flushEvents (): Promise<void> {
  }

  /**
   * Uses the scheduler function to trigger periodical reporting.
   *
   * @returns {Promise<this>}
   * @memberof CarbonMetricReporter
   */
  public async start (): Promise<this> {
    this.client = graphite.createClient(this.options.host)
    return await super.start()
  }

  /**
   * Stops the timer reference returned by the scheduler function.
   *
   * @returns {Promise<this>}
   * @memberof CarbonMetricReporter
   */
  public async stop (): Promise<this> {
    await super.stop()
    if (this.client) {
      await this.client.end()
    }
    return this
  }

  /**
   * Uses the client instance to report the given metric results.
   *
   * @protected
   * @param {OverallReportContext} ctx
   * @param {MetricRegistry | null} registry
   * @param {Date} timestamp
   * @param {MetricType} type
   * @param {ReportingResult<any, CarbonData>[]} results
   * @returns {Promise<any>}
   * @memberof CarbonMetricReporter
   */
  protected async handleResults (
    ctx: OverallReportContext,
    registry: MetricRegistry | null,
    timestamp: Date,
    type: MetricType,
    results: Array<ReportingResult<any, CarbonData>>): Promise<void> {
    await Promise.all(results
      .map((result) => result.result)
      .map(async (carbonData) => await new Promise<void>((resolve, reject) => {
        // can happen during serialization
        if (!(timestamp instanceof Date)) {
          timestamp = new Date(timestamp)
        }
        this.client.writeTagged(carbonData.measurement, carbonData.tags, timestamp, (err: any) => {
          if (err != null) {
            if (this.options.log) {
              this.options.log.error(err, this.logMetadata)
            }
            reject(err)
            return
          }
          resolve()
        })
      }).catch((err) => {
        if (this.options.log) {
          this.options.log.error(err, this.logMetadata)
        }
      })))
  }

  /**
   * Builds the {@link CarbonData} for the specified {@link Counter} or {@link MonotoneCounter}.
   *
   * @protected
   * @param {(MonotoneCounter | Counter)} counter
   * @param {(MetricSetReportContext<MonotoneCounter | Counter>)} ctx
   * @returns {CarbonData}
   * @memberof CarbonMetricReporter
   */
  protected reportCounter (
    counter: MonotoneCounter | Counter,
    ctx: MetricSetReportContext<MonotoneCounter | Counter>): CarbonData {
    const value = counter.getCount()
    if (!value || isNaN(value)) {
      return null
    }
    const tags = this.buildTags(ctx.registry, counter)
    tags.group = counter.getGroup()
    tags.name = counter.getName()

    const prefix = this.getMetricName(counter)
    const measurement: any = {}
    measurement[`${prefix}.count`] = counter.getCount() || 0

    return {
      measurement,
      tags
    }
  }

  /**
   * Builds the {@link CarbonData} for the specified {@link Gauge}.
   *
   * @protected
   * @param {Gauge<any>} gauge
   * @param {MetricSetReportContext<Gauge<any>>} ctx
   * @returns {CarbonData}
   * @memberof CarbonMetricReporter
   */
  protected reportGauge (gauge: Gauge<any>, ctx: MetricSetReportContext<Gauge<any>>): CarbonData {
    const value = gauge.getValue()
    if (!value || isNaN(value)) {
      return null
    }
    const tags = this.buildTags(ctx.registry, gauge)
    tags.group = gauge.getGroup()
    tags.name = gauge.getName()

    const prefix = this.getMetricName(gauge)
    const measurement: any = {}
    measurement[`${prefix}.value`] = gauge.getValue() || 0

    return {
      measurement,
      tags
    }
  }

  /**
   * Builds the {@link CarbonData} for the specified {@link Histogram}.
   *
   * @protected
   * @param {Histogram} histogram
   * @param {MetricSetReportContext<Histogram>} ctx
   * @returns {CarbonData}
   * @memberof CarbonMetricReporter
   */
  protected reportHistogram (histogram: Histogram, ctx: MetricSetReportContext<Histogram>): CarbonData {
    const value = histogram.getCount()
    if (!value || isNaN(value)) {
      return null
    }
    const snapshot = histogram.getSnapshot()
    const tags = this.buildTags(ctx.registry, histogram)
    tags.group = histogram.getGroup()
    tags.name = histogram.getName()

    const prefix = this.getMetricName(histogram)
    const measurement: any = {}
    measurement[`${prefix}.count`] = histogram.getCount() || 0
    measurement[`${prefix}.max`] = this.getNumber(snapshot.getMax())
    measurement[`${prefix}.mean`] = this.getNumber(snapshot.getMean())
    measurement[`${prefix}.min`] = this.getNumber(snapshot.getMin())
    measurement[`${prefix}.p50`] = this.getNumber(snapshot.getMedian())
    measurement[`${prefix}.p75`] = this.getNumber(snapshot.get75thPercentile())
    measurement[`${prefix}.p95`] = this.getNumber(snapshot.get95thPercentile())
    measurement[`${prefix}.p98`] = this.getNumber(snapshot.get98thPercentile())
    measurement[`${prefix}.p99`] = this.getNumber(snapshot.get99thPercentile())
    measurement[`${prefix}.p999`] = this.getNumber(snapshot.get999thPercentile())
    measurement[`${prefix}.stddev`] = this.getNumber(snapshot.getStdDev())

    return {
      measurement,
      tags
    }
  }

  /**
   * Builds the {@link CarbonData} for the specified {@link Meter}.
   *
   * @protected
   * @param {Meter} meter
   * @param {MetricSetReportContext<Meter>} ctx
   * @returns {CarbonData}
   * @memberof CarbonMetricReporter
   */
  protected reportMeter (meter: Meter, ctx: MetricSetReportContext<Meter>): CarbonData {
    const value = meter.getCount()
    if (value === undefined || value === null || isNaN(value)) {
      return null
    }
    const tags = this.buildTags(ctx.registry, meter)
    tags.group = meter.getGroup()
    tags.name = meter.getName()

    const prefix = this.getMetricName(meter)
    const measurement: any = {}
    measurement[`${prefix}.count`] = meter.getCount() || 0
    measurement[`${prefix}.m15_rate`] = this.getNumber(meter.get15MinuteRate())
    measurement[`${prefix}.m1_rate`] = this.getNumber(meter.get1MinuteRate())
    measurement[`${prefix}.m5_rate`] = this.getNumber(meter.get5MinuteRate())
    measurement[`${prefix}.mean_rate`] = this.getNumber(meter.getMeanRate())

    return {
      measurement,
      tags: this.buildTags(ctx.registry, meter)
    }
  }

  /**
   * Builds the {@link CarbonData} for the specified {@link Timer}.
   *
   * @protected
   * @param {Timer} timer
   * @param {MetricSetReportContext<Timer>} ctx
   * @returns {CarbonData}
   * @memberof CarbonMetricReporter
   */
  protected reportTimer (timer: Timer, ctx: MetricSetReportContext<Timer>): CarbonData {
    const value = timer.getCount()
    if (!value || isNaN(value)) {
      return null
    }
    const snapshot = timer.getSnapshot()
    const tags = this.buildTags(ctx.registry, timer)
    tags.group = timer.getGroup()
    tags.name = timer.getName()

    const prefix = this.getMetricName(timer)
    const measurement: any = {}
    measurement[`${prefix}.count`] = timer.getCount() || 0
    measurement[`${prefix}.m15_rate`] = this.getNumber(timer.get15MinuteRate())
    measurement[`${prefix}.m1_rate`] = this.getNumber(timer.get1MinuteRate())
    measurement[`${prefix}.m5_rate`] = this.getNumber(timer.get5MinuteRate())
    measurement[`${prefix}.max`] = this.getNumber(snapshot.getMax())
    measurement[`${prefix}.mean`] = this.getNumber(snapshot.getMean())
    measurement[`${prefix}.mean_rate`] = this.getNumber(timer.getMeanRate())
    measurement[`${prefix}.min`] = this.getNumber(snapshot.getMin())
    measurement[`${prefix}.p50`] = this.getNumber(snapshot.getMedian())
    measurement[`${prefix}.p75`] = this.getNumber(snapshot.get75thPercentile())
    measurement[`${prefix}.p95`] = this.getNumber(snapshot.get95thPercentile())
    measurement[`${prefix}.p98`] = this.getNumber(snapshot.get98thPercentile())
    measurement[`${prefix}.p99`] = this.getNumber(snapshot.get99thPercentile())
    measurement[`${prefix}.p999`] = this.getNumber(snapshot.get999thPercentile())
    measurement[`${prefix}.stddev`] = this.getNumber(snapshot.getStdDev())

    return {
      measurement,
      tags: this.buildTags(ctx.registry, timer)
    }
  }

  /**
   * Builds a name for the metric.
   *
   * @protected
   * @param {Metric} metric
   * @returns {string}
   * @memberof CarbonMetricReporter
   */
  protected getMetricName (metric: Metric): string {
    if (metric.getGroup()) {
      return `${metric.getGroup()}.${metric.getName()}`
    }
    return metric.getName()
  }
}
