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
  Timer
} from 'inspector-metrics'

/**
 * measurement point definition
 */
export interface MeasurementPoint {
  /**
   * Measurement is the Influx measurement name.
   */
  measurement: string;
  /**
   * Tags is the list of tag values to insert.
   */
  tags: {
      [name: string]: string;
  };
  /**
   * Fields is the list of field values to insert.
   */
  fields: {
      [name: string]: any;
  };
  /**
   * Timestamp tags this measurement with a date. This can be a Date object,
   * in which case we'll adjust it to the desired precision, or a numeric
   * string or number, in which case it gets passed directly to Influx.
   */
  timestamp: Date | string | number;
}

/**
 * Sender interface for influxdb client abstraction.
 *
 * @export
 * @interface Sender
 */
export interface Sender {

  /**
   * Indicates if the sender is ready to send data.
   *
   * @returns {Promise<boolean>}
   * @memberof Sender
   */
  isReady(): Promise<boolean>

  /**
   * Triggers the initialization process.
   *
   * @returns {Promise<any>}
   * @memberof Sender
   */
  init(): Promise<any>

  /**
   * Sends the given data points to influxdb.
   *
   * @param {T[]} points
   * @returns {Promise<any>}
   * @memberof Sender
   */
  send(points: MeasurementPoint[]): Promise<void>

}

/**
 * Options for {@link InfluxMetricReporter}.
 *
 * @export
 * @interface InfluxMetricReporterOptions
 * @extends {ScheduledMetricReporterOptions}
 */
export interface InfluxMetricReporterOptions extends ScheduledMetricReporterOptions {
  /**
   * A logger instance used to report errors.
   *
   * @type {(Logger | null)}
   * @memberof InfluxMetricReporterOptions
   */
  log: Logger | null
  /**
   * A sender implementation used to send metrics to influx DB server.
   *
   * @type {Sender}
   * @memberof InfluxMetricReporterOptions
   */
  readonly sender: Sender
}

/**
 * InfluxDB reporter implementation.
 *
 * @export
 * @class InfluxMetricReporter
 * @extends {ScheduledMetricReporter}
 */
export class InfluxMetricReporter extends ScheduledMetricReporter<InfluxMetricReporterOptions, MeasurementPoint> {
  /**
   * Metadata for the logger.
   *
   * @private
   * @type {*}
   * @memberof InfluxMetricReporter
   */
  private readonly logMetadata: any;

  /**
   * Creates an instance of InfluxMetricReporter.
   *
   * @param {string} [reporterType] the type of the reporter implementation - for internal use
   * @memberof InfluxMetricReporter
   */
  public constructor ({
    sender,
    log = console,
    reportInterval = 1000,
    unit = MILLISECOND,
    clock = new StdClock(),
    scheduler = setInterval,
    minReportingTimeout = 1,
    clusterOptions = new DefaultClusterOptions(),
    tags = new Map()
  }: InfluxMetricReporterOptions,
  reporterType?: string) {
    super({
      clock,
      clusterOptions,
      log,
      minReportingTimeout,
      reportInterval,
      scheduler,
      sender,
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
   * @memberof InfluxMetricReporter
   */
  public getLog (): Logger {
    return this.options.log
  }

  /**
   * Sets the logger instance.
   *
   * @param {(Logger | null)} log
   * @memberof InfluxMetricReporter
   */
  public setLog (log: Logger | null): void {
    this.options.log = log
  }

  /**
   * Starts the sender and calls the super method to start scheduling.
   *
   * @returns {Promise<this>}
   * @memberof ScheduledMetricReporter
   */
  public async start (): Promise<this> {
    await this.options.sender.init()
    return await super.start()
  }

  /**
   * Sends an event directly to influxdb.
   *
   * @param {TEvent} event
   * @returns {Promise<TEvent>}
   * @memberof InfluxMetricReporter
   */
  public async reportEvent<TEventData, TEvent extends Event<TEventData>>(event: TEvent): Promise<TEvent> {
    if (!(await this.options.sender.isReady())) {
      throw new Error("Sender is not ready. Wait for the 'start' method to complete.")
    }

    const value = event.getValue()
    if (!value) {
      return await Promise.reject(new Error('Invalid event value'))
    }

    const point = this.reportGauge(event, {
      date: event.getTime(),
      metrics: [],
      overallCtx: {},
      registry: null,
      type: 'gauge'
    })
    point.timestamp = event.getTime()

    try {
      await this.handleResults({}, null, null, 'gauge', [{
        metric: event,
        result: point
      }])

      if (this.options.log) {
        this.options.log.debug('wrote event', this.logMetadata)
      }
      return event
    } catch (reason) {
      if (this.options.log) {
        const message = reason.message as string
        this.options.log
          .error(`error writing event - reason: ${message}`, reason, this.logMetadata)
      }
      throw reason
    }
  }

  /**
   * Reports the data points for each registered {@link MetricRegistry}.
   *
   * @protected
   * @memberof InfluxMetricReporter
   */
  protected async report (): Promise<OverallReportContext> {
    const senderReady = await this.options.sender.isReady()
    if (senderReady) {
      return await super.report()
    }
    return {}
  }

  /**
   * Uses the sender to report the given data points.
   *
   * @protected
   * @param {OverallReportContext} ctx
   * @param {MetricRegistry | null} registry
   * @param {Date} date
   * @param {MetricType} type
   * @param {Array<ReportingResult<any, T>>} results
   * @returns {Promise<any>}
   * @memberof InfluxMetricReporter
   */
  protected async handleResults (
    ctx: OverallReportContext,
    registry: MetricRegistry | null,
    date: Date,
    type: MetricType,
    results: Array<ReportingResult<any, MeasurementPoint>>): Promise<any> {
    const points = results.map((result) => result.result)
    if (points.length === 0) {
      return
    }

    try {
      points.forEach((point) => {
        if (!(point.timestamp instanceof Date)) {
          point.timestamp = new Date(point.timestamp)
        }
      })

      await this.options.sender.send(points)
      if (this.options.log) {
        this.options.log.debug(`wrote ${type} metrics`, this.logMetadata)
      }
    } catch (reason) {
      if (this.options.log) {
        const message = reason.message as string
        this.options.log
          .error(`error writing ${type} metrics - reason: ${message}`, reason, this.logMetadata)
      }
    }
  }

  /**
   * Builds a measure point (type T) instance for the given {@link Counter} or  {@link MonotoneCounter}.
   *
   * @protected
   * @param {(MonotoneCounter | Counter)} counter
   * @param {(MetricSetReportContext<MonotoneCounter | Counter>)} ctx
   * @returns {T}
   * @memberof InfluxMetricReporter
   */
  protected reportCounter (
    counter: MonotoneCounter | Counter,
    ctx: MetricSetReportContext<MonotoneCounter | Counter>): MeasurementPoint {
    const value = counter.getCount()
    if (!value || isNaN(value)) {
      return null
    }
    const fields: any = {}
    const fieldNamePrefix = this.getFieldNamePrefix(counter)
    const measurement = this.getMeasurementName(counter)

    fields[`${fieldNamePrefix}count`] = counter.getCount() || 0

    return {
      fields,
      measurement,
      tags: this.buildTags(ctx.registry, counter),
      timestamp: ctx.date
    }
  }

  /**
   * Builds a measure point (type T) instance for the given {@link Gauge}.
   *
   * @protected
   * @param {Gauge<any>} gauge
   * @param {MetricSetReportContext<Gauge<any>>} ctx
   * @returns {T}
   * @memberof InfluxMetricReporter
   */
  protected reportGauge (gauge: Gauge<any>, ctx: MetricSetReportContext<Gauge<any>>): MeasurementPoint {
    const value = gauge.getValue()
    if (!value || isNaN(value)) {
      return null
    }
    const fields: any = {}
    const fieldNamePrefix = this.getFieldNamePrefix(gauge)
    const measurement = this.getMeasurementName(gauge)

    fields[`${fieldNamePrefix}value`] = gauge.getValue() || 0

    return {
      fields,
      measurement,
      tags: this.buildTags(ctx ? ctx.registry : null, gauge),
      timestamp: ctx.date
    }
  }

  /**
   * Builds a measure point (type T) instance for the given {@link Histogram}.
   *
   * @protected
   * @param {Histogram} histogram
   * @param {MetricSetReportContext<Histogram>} ctx
   * @returns {T}
   * @memberof InfluxMetricReporter
   */
  protected reportHistogram (histogram: Histogram, ctx: MetricSetReportContext<Histogram>): MeasurementPoint {
    const value = histogram.getCount()
    if (!value || isNaN(value)) {
      return null
    }
    const snapshot = histogram.getSnapshot()
    const fields: any = {}
    const fieldNamePrefix = this.getFieldNamePrefix(histogram)
    const measurement = this.getMeasurementName(histogram)

    fields[`${fieldNamePrefix}count`] = histogram.getCount() || 0
    fields[`${fieldNamePrefix}max`] = this.getNumber(snapshot.getMax())
    fields[`${fieldNamePrefix}mean`] = this.getNumber(snapshot.getMean())
    fields[`${fieldNamePrefix}min`] = this.getNumber(snapshot.getMin())
    fields[`${fieldNamePrefix}p50`] = this.getNumber(snapshot.getMedian())
    fields[`${fieldNamePrefix}p75`] = this.getNumber(snapshot.get75thPercentile())
    fields[`${fieldNamePrefix}p95`] = this.getNumber(snapshot.get95thPercentile())
    fields[`${fieldNamePrefix}p98`] = this.getNumber(snapshot.get98thPercentile())
    fields[`${fieldNamePrefix}p99`] = this.getNumber(snapshot.get99thPercentile())
    fields[`${fieldNamePrefix}p999`] = this.getNumber(snapshot.get999thPercentile())
    fields[`${fieldNamePrefix}stddev`] = this.getNumber(snapshot.getStdDev())

    return {
      fields,
      measurement,
      tags: this.buildTags(ctx.registry, histogram),
      timestamp: ctx.date
    }
  }

  /**
   * Builds a measure point (type T) instance for the given {@link Meter}.
   *
   * @protected
   * @param {Meter} meter
   * @param {MetricSetReportContext<Meter>} ctx
   * @returns {T}
   * @memberof InfluxMetricReporter
   */
  protected reportMeter (meter: Meter, ctx: MetricSetReportContext<Meter>): MeasurementPoint {
    const value = meter.getCount()
    if (!value || isNaN(value)) {
      return null
    }
    const fields: any = {}
    const fieldNamePrefix = this.getFieldNamePrefix(meter)
    const measurement = this.getMeasurementName(meter)

    fields[`${fieldNamePrefix}count`] = meter.getCount() || 0
    fields[`${fieldNamePrefix}m15_rate`] = this.getNumber(meter.get15MinuteRate())
    fields[`${fieldNamePrefix}m1_rate`] = this.getNumber(meter.get1MinuteRate())
    fields[`${fieldNamePrefix}m5_rate`] = this.getNumber(meter.get5MinuteRate())
    fields[`${fieldNamePrefix}mean_rate`] = this.getNumber(meter.getMeanRate())

    return {
      fields,
      measurement,
      tags: this.buildTags(ctx.registry, meter),
      timestamp: ctx.date
    }
  }

  /**
   * Builds a measure point (type T) instance for the given {@link Timer}.
   *
   * @protected
   * @param {Timer} timer
   * @param {MetricSetReportContext<Timer>} ctx
   * @returns {T}
   * @memberof InfluxMetricReporter
   */
  protected reportTimer (timer: Timer, ctx: MetricSetReportContext<Timer>): MeasurementPoint {
    const value = timer.getCount()
    if (!value || isNaN(value)) {
      return null
    }
    const snapshot = timer.getSnapshot()
    const fields: any = {}
    const fieldNamePrefix = this.getFieldNamePrefix(timer)
    const measurement = this.getMeasurementName(timer)

    fields[`${fieldNamePrefix}count`] = timer.getCount() || 0
    fields[`${fieldNamePrefix}m15_rate`] = this.getNumber(timer.get15MinuteRate())
    fields[`${fieldNamePrefix}m1_rate`] = this.getNumber(timer.get1MinuteRate())
    fields[`${fieldNamePrefix}m5_rate`] = this.getNumber(timer.get5MinuteRate())
    fields[`${fieldNamePrefix}max`] = this.getNumber(snapshot.getMax())
    fields[`${fieldNamePrefix}mean`] = this.getNumber(snapshot.getMean())
    fields[`${fieldNamePrefix}mean_rate`] = this.getNumber(timer.getMeanRate())
    fields[`${fieldNamePrefix}min`] = this.getNumber(snapshot.getMin())
    fields[`${fieldNamePrefix}p50`] = this.getNumber(snapshot.getMedian())
    fields[`${fieldNamePrefix}p75`] = this.getNumber(snapshot.get75thPercentile())
    fields[`${fieldNamePrefix}p95`] = this.getNumber(snapshot.get95thPercentile())
    fields[`${fieldNamePrefix}p98`] = this.getNumber(snapshot.get98thPercentile())
    fields[`${fieldNamePrefix}p99`] = this.getNumber(snapshot.get99thPercentile())
    fields[`${fieldNamePrefix}p999`] = this.getNumber(snapshot.get999thPercentile())
    fields[`${fieldNamePrefix}stddev`] = this.getNumber(snapshot.getStdDev())

    return {
      fields,
      measurement,
      tags: this.buildTags(ctx.registry, timer),
      timestamp: ctx.date
    }
  }

  /**
   * Builds the prefix for a field name.
   *
   * @private
   * @param {Metric} metric
   * @returns {string}
   * @memberof InfluxMetricReporter
   */
  private getFieldNamePrefix (metric: Metric): string {
    if (metric.getGroup()) {
      return `${metric.getName()}.`
    }
    return ''
  }

  /**
   * Builds the prefix for the metric name.
   *
   * @private
   * @param {Metric} metric
   * @returns {string}
   * @memberof InfluxMetricReporter
   */
  private getMeasurementName (metric: Metric): string {
    if (metric.getGroup()) {
      return metric.getGroup()
    }
    return metric.getName()
  }
}
