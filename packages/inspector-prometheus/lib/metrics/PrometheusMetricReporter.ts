import 'source-map-support'

import * as cluster from 'cluster'
import { randomBytes } from 'crypto'
import { EventEmitter } from 'events'
import {
  BucketCounting,
  Buckets,
  BucketToCountMap,
  Counter,
  Event,
  Gauge,
  getMetricBuckets,
  getMetricCounts,
  getMetricDescription,
  getMetricGroup,
  getMetricMetadata,
  getMetricName,
  getMetricTags,
  getSnapshot,
  Histogram,
  mapToTags,
  Metadata,
  Meter,
  Metric,
  MetricRegistry,
  MetricReporter,
  MetricSetReportContext,
  MetricType,
  MonotoneCounter,
  OverallReportContext,
  ReportingResult,
  Sampling,
  SerializableBucketCounting,
  SerializableMetric,
  SerializableSampling,
  StdClock,
  Taggable,
  Tags,
  Timer
} from 'inspector-metrics'
import { DefaultPrometheusClusterOptions } from './DefaultPrometheusClusterOptions'
import { InterprocessReportRequest } from './InterprocessReportRequest'
import { InterprocessReportResponse } from './InterprocessReportResponse'
import { Percentiles } from './Percentiles'
import { PrometheusReporterOptions } from './PrometheusReporterOptions'

/**
 * Enumeration used to determine valid metric types of prometheus.
 */
type PrometheusMetricType = 'counter' | 'gauge' | 'histogram' | 'summary' | 'untyped';

/**
 * Helper interface for reported fields.
 *
 * @interface PrometheusFields
 */
interface PrometheusFields { [key: string]: number | string }

/**
 * Helper interface for a report result.
 *
 * @interface PrometheusMetricResult
 */
interface PrometheusMetricResult {
  /**
   * Type of the metrics in fields property.
   *
   * @type {PrometheusMetricType}
   * @memberof PrometheusMetricResult
   */
  readonly type: PrometheusMetricType
  /**
   * Contains field-name to value mapping of this metric-result.
   *
   * @type {PrometheusFields}
   * @memberof PrometheusMetricResult
   */
  readonly fields: PrometheusFields
  /**
   * Indicates if this result can be handle by the reporter.
   *
   * @type {boolean}
   * @memberof PrometheusMetricResult
   */
  readonly canBeReported: boolean
}

/**
 * Metric reporter for prometheus.
 * This reporter only support the text format of prometheus / open-metrics.
 *
 * To get the metric report call the {@link PrometheusMetricReporter#getMetricsString} method.
 *
 * @see https://prometheus.io/docs/concepts/
 * @see https://prometheus.io/docs/instrumenting/exposition_formats/#text-based-format
 * @export
 * @class PrometheusMetricReporter
 * @extends {MetricReporter}
 */
export class PrometheusMetricReporter extends MetricReporter<PrometheusReporterOptions, PrometheusMetricResult> {
  /**
   * Constant for the "type" variable of process-level message identifying report-request-messages
   * from master process.
   *
   * @static
   * @memberof PrometheusMetricReporter
   */
  public static readonly MESSAGE_TYPE_REQUEST = 'inspector-prometheus:metric-reporter:request-metrics';
  /**
   * Constant for the "type" variable of process-level message identifying report-response-messages
   * from forked processes.
   *
   * @static
   * @memberof PrometheusMetricReporter
   */
  public static readonly MESSAGE_TYPE_RESPONSE = 'inspector-prometheus:metric-reporter:response-metrics';
  /**
   * Used to replace unsupported characters from label name.
   *
   * @private
   * @static
   * @memberof PrometheusMetricReporter
   */
  private static readonly LABEL_NAME_REPLACEMENT_REGEXP = new RegExp('[^a-zA-Z0-9_]', 'g');

  /**
   * used to replace the first character of a label name if needed.
   *
   * @private
   * @static
   * @memberof PrometheusMetricReporter
   */
  private static readonly LABEL_NAME_START_EXCLUSION = ['_', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].sort(
    (a: string, b: string) => a.localeCompare(b)
  );

  /**
   * Used to replace unsupported characters from metric name.
   *
   * @private
   * @static
   * @memberof PrometheusMetricReporter
   */
  private static readonly METRIC_NAME_REPLACEMENT_REGEXP = new RegExp('[^a-zA-Z0-9_:]', 'g');

  /**
   * used to replace the first character of a metric name if needed.
   *
   * @private
   * @static
   * @memberof PrometheusMetricReporter
   */
  private static readonly METRIC_NAME_START_EXCLUSION = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].sort(
    (a: string, b: string) => a.localeCompare(b)
  );

  /**
   * Checks if a given string is empty.
   *
   * @private
   * @static
   * @param {string} value
   * @returns {boolean}
   * @memberof PrometheusMetricReporter
   */
  private static isEmpty (value: string): boolean {
    return !value || value.trim() === ''
  }

  /**
   * Checks if a given value is a number.
   *
   * @private
   * @static
   * @param {*} value
   * @returns {value is number}
   * @memberof PrometheusMetricReporter
   */
  private static isNumber (value: any): value is number {
    return typeof (value) === 'number'
  }

  /**
   * The prometheus counter type string.
   *
   * @private
   * @type {PrometheusMetricType}
   * @memberof PrometheusMetricReporter
   */
  private readonly counterType: PrometheusMetricType = 'counter';
  /**
   * The prometheus gauge type string.
   *
   * @private
   * @type {PrometheusMetricType}
   * @memberof PrometheusMetricReporter
   */
  private readonly gaugeType: PrometheusMetricType = 'gauge';
  /**
   * The prometheus histogram type string.
   *
   * @private
   * @type {PrometheusMetricType}
   * @memberof PrometheusMetricReporter
   */
  private readonly histogramType: PrometheusMetricType = 'histogram';
  /**
   * The prometheus summary type string.
   *
   * @private
   * @type {PrometheusMetricType}
   * @memberof PrometheusMetricReporter
   */
  private readonly summaryType: PrometheusMetricType = 'summary';
  /**
   * Internal eventbus used to forward received messages from forked metric reporters.
   *
   * @private
   * @type {EventEmitter}
   * @memberof PrometheusMetricReporter
   */
  private readonly internalEventbus: EventEmitter;

  /**
   * Creates an instance of PrometheusMetricReporter.
   *
   * @param {string} [reporterType] the type of the reporter implementation - for internal use
   * @memberof PrometheusMetricReporter
   */
  public constructor ({
    clock = new StdClock(),
    emitComments = true,
    includeTimestamp = false,
    log = console,
    minReportingTimeout = 1,
    tags = new Map(),
    useUntyped = false,
    clusterOptions = new DefaultPrometheusClusterOptions()
  }: PrometheusReporterOptions,
  reporterType?: string) {
    super({
      clock,
      clusterOptions,
      emitComments,
      includeTimestamp,
      log,
      minReportingTimeout,
      tags,
      useUntyped
    }, reporterType)
    const co = this.options.clusterOptions
    if (co?.enabled) {
      this.internalEventbus = new EventEmitter()
      if (co.sendMetricsToMaster) {
        co.eventReceiver.on('message', async (worker, message, handle) => {
          await this.handleReportRequest(message)
        })
      } else {
        co.eventReceiver.on('message', async (worker, message, handle) => {
          await this.handleReportResponse(message)
        })
      }
    }
  }

  /**
   * Build the metric reporting string for all registered {@link MetricRegistry} instances.
   *
   * @returns {string}
   * @memberof PrometheusMetricReporter
   */
  public async getMetricsString (): Promise<string> {
    const workerPromises: Array<Promise<string>> = []
    const clusterOptions = this.options.clusterOptions
    if (this.canSendMessagesToWorkers()) {
      const workers = await clusterOptions.getWorkers()
      for (const worker of workers) {
        const message: InterprocessReportRequest = {
          id: this.generateRandomId(),
          targetReporterType: this.reporterType,
          type: PrometheusMetricReporter.MESSAGE_TYPE_REQUEST
        }
        const workerPromise: Promise<string> = new Promise((resolve) => {
          this.internalEventbus.once(message.id, (response: InterprocessReportResponse) => {
            resolve(response.metricsStr)
          })
        })
        const workerTimeout: Promise<string> = new Promise((resolve) => setTimeout(() => {
          resolve('')
          this.internalEventbus.removeAllListeners(message.id)
        }, clusterOptions.workerResponseTimeout))
        clusterOptions
          .sendToWorker(worker, message)
          .catch((error) => console.log(error))
        workerPromises.push(Promise.race([workerPromise, workerTimeout]))
      }
    }
    const workerResponses = await Promise.all(workerPromises)
    if (this.metricRegistries && this.metricRegistries.length > 0) {
      const ctx = await this.report()
      return `${ctx.result}${workerResponses.join('\n')}`
    }
    return workerResponses.join('\n') + '\n'
  }

  /**
   * Builds the text representation of the event specified.
   *
   * @param {MetricRegistry} event
   * @returns {string}
   * @memberof PrometheusMetricReporter
   */
  public async getEventString<TEventData, TEvent extends Event<TEventData>>(event: TEvent): Promise<string> {
    const overallCtx: OverallReportContext = {
      result: ''
    }

    const result = this.reportGauge(event, {
      date: null,
      metrics: [],
      overallCtx,
      registry: null,
      type: 'gauge'
    })

    await this.handleResults(
      overallCtx,
      null,
      event.getTime(),
      'gauge',
      [{
        metric: event,
        result
      }]
    )

    return overallCtx.result
  }

  /**
   * Use {@link #getEventString} instead.
   *
   * @param {TEvent} event
   * @returns {Promise<TEvent>}
   * @memberof PrometheusMetricReporter
   */
  public async reportEvent<TEventData, TEvent extends Event<TEventData>>(event: TEvent): Promise<TEvent> {
    return event
  }

  /**
   * Does nothing.
   *
   * @returns {Promise<void>}
   * @memberof PrometheusMetricReporter
   */
  public async flushEvents (): Promise<void> {
  }

  /**
   * Does nothing.
   *
   * @memberof PrometheusMetricReporter
   */
  public async start (): Promise<this> {
    return this
  }

  /**
   * Does nothing.
   *
   * @memberof PrometheusMetricReporter
   */
  public async stop (): Promise<this> {
    return this
  }

  /**
   * Always returns false, since the Prometheus reporter implements it's own messaging mechanism.
   *
   * @protected
   * @returns {boolean}
   * @memberof PrometheusMetricReporter
   */
  protected sendMetricsToMaster (): boolean {
    return false
  }

  /**
   * Checks if the clustering support is enabled and the 'getWorkers' and 'sendToWorker'
   * method is not null.
   *
   * @protected
   * @returns {boolean}
   * @memberof PrometheusMetricReporter
   */
  protected canSendMessagesToWorkers (): boolean {
    const clusterOptions = this.options.clusterOptions
    return clusterOptions.enabled &&
      !!clusterOptions.getWorkers &&
      !!clusterOptions.sendToWorker
  }

  /**
   * Generates a randomId used to identify worker report responses.
   *
   * @protected
   * @returns {string}
   * @memberof PrometheusMetricReporter
   */
  protected generateRandomId (): string {
    return randomBytes(32).toString('hex')
  }

  /**
   * Checks if the specified message is of type {@link PrometheusMetricReporter#MESSAGE_TYPE_REQUEST},
   * generates a response using {@link #getMetricsString} and sends it back to the master process
   * with the id given through the request.
   *
   * @protected
   * @param {*} message
   * @memberof PrometheusMetricReporter
   */
  protected async handleReportRequest (message: any): Promise<void> {
    if (this.canHandleMessage(message, PrometheusMetricReporter.MESSAGE_TYPE_REQUEST)) {
      const request: InterprocessReportRequest = message
      const metricsStr = await this.getMetricsString()
      const response: InterprocessReportResponse = {
        id: request.id,
        metricsStr,
        targetReporterType: request.targetReporterType,
        type: PrometheusMetricReporter.MESSAGE_TYPE_RESPONSE
      }
      if (this.options.clusterOptions.sendToMaster) {
        this.options.clusterOptions.sendToMaster(response)
          .catch((cause) => this.options.log?.error(
            'could not send metrics to master process',
            cause
          ))
      }
    }
  }

  /**
   * Checks if the specified message is of type {@link PrometheusMetricReporter#MESSAGE_TYPE_RESPONSE}
   * and forwards the message to the internal eventbus using the messages id as message and the message
   * object as argument.
   *
   * @protected
   * @param {*} message
   * @memberof PrometheusMetricReporter
   */
  protected async handleReportResponse (message: any): Promise<void> {
    if (this.canHandleMessage(message, PrometheusMetricReporter.MESSAGE_TYPE_RESPONSE)) {
      const response: InterprocessReportResponse = message
      this.internalEventbus.emit(response.id, response)
    }
  }

  /**
   * Ignores common report-messages.
   *
   * @protected
   * @param {cluster.Worker} worker
   * @param {*} message
   * @param {*} handle
   * @returns {Promise<void>}
   * @memberof PrometheusMetricReporter
   */
  protected async handleReportMessage (worker: cluster.Worker, message: any, handle: any): Promise<void> {
  }

  /**
   * Called before each reporting run.
   *
   * @protected
   * @memberof MetricReporter
   */
  protected async beforeReport (ctx: OverallReportContext): Promise<void> {
    ctx.result = ''
  }

  protected async handleResults (
    overallCtx: OverallReportContext,
    registry: MetricRegistry | null,
    date: Date,
    type: MetricType,
    results: Array<ReportingResult<any, PrometheusMetricResult>>): Promise<void> {
    const lines: string[] = []
    const registryTags = registry ? mapToTags(registry.getTags()) : null
    for (const result of results) {
      const metric = result.metric
      const ctx = result.result
      const line = this.getMetricString(date, metric, ctx.type, ctx.canBeReported, ctx.fields, registryTags)
      lines.push(line)
    }
    overallCtx.result = `${overallCtx.result}${lines.join('\n')}`
  }

  protected reportCounter (
    counter: MonotoneCounter | Counter,
    ctx: MetricSetReportContext<MonotoneCounter | Counter>): PrometheusMetricResult {
    if (counter instanceof Counter) {
      return {
        canBeReported: true,
        fields: {
          '': counter.getCount() || 0
        },
        type: this.gaugeType
      }
    }
    return {
      canBeReported: true,
      fields: {
        '': counter.getCount() || 0
      },
      type: this.counterType
    }
  }

  protected reportGauge (gauge: Gauge<any>, ctx: MetricSetReportContext<Gauge<any>>): PrometheusMetricResult {
    return {
      canBeReported: true,
      fields: {
        '': gauge.getValue()
      },
      type: this.gaugeType
    }
  }

  protected reportHistogram (histogram: Histogram, ctx: MetricSetReportContext<Histogram>): PrometheusMetricResult {
    return {
      canBeReported: !isNaN(histogram.getCount()),
      fields: {
        count: histogram.getCount() || 0,
        sum: histogram.getSum().toString() || 0
      },
      type: this.histogramType
    }
  }

  protected reportMeter (meter: Meter, ctx: MetricSetReportContext<Meter>): PrometheusMetricResult {
    return {
      canBeReported: !isNaN(meter.getCount()),
      fields: {
        '': meter.getCount() || 0
      },
      type: this.gaugeType
    }
  }

  protected reportTimer (timer: Timer, ctx: MetricSetReportContext<Timer>): PrometheusMetricResult {
    return {
      canBeReported: !isNaN(timer.getCount()),
      fields: {
        count: timer.getCount() || 0,
        sum: timer.getSum().toString() || 0
      },
      type: this.summaryType
    }
  }

  /**
   * Gets the mapping of tags with normalized names and filtered for reserved tags.
   *
   * @protected
   * @param {Taggable | SerializableMetric} taggable
   * @param {string[]} exclude
   * @param {Tags} [registryTags]
   * @returns {Tags}
   * @memberof PrometheusMetricReporter
   */
  protected buildPrometheusTags (
    taggable: Taggable | SerializableMetric,
    exclude: string[],
    registryTags?: Tags
  ): Tags {
    exclude.sort((a: string, b: string) => a.localeCompare(b))

    const tags: { [x: string]: string } = {}
    this.options.tags.forEach((value, key) => {
      const normalizedKey = key.replace(PrometheusMetricReporter.LABEL_NAME_REPLACEMENT_REGEXP, '_')
      if (!exclude.includes(normalizedKey) &&
        !PrometheusMetricReporter.LABEL_NAME_START_EXCLUSION.includes(normalizedKey.charAt(0))) {
        tags[normalizedKey] = value
      }
    })
    if (registryTags) {
      Object.keys(registryTags).forEach((key) => {
        const value = registryTags[key]
        const normalizedKey = key.replace(PrometheusMetricReporter.LABEL_NAME_REPLACEMENT_REGEXP, '_')
        if (!exclude.includes(normalizedKey) &&
          !PrometheusMetricReporter.LABEL_NAME_START_EXCLUSION.includes(normalizedKey.charAt(0))) {
          tags[normalizedKey] = value
        }
      })
    }
    const customTags = getMetricTags(taggable)
    Object.keys(customTags).forEach((key) => {
      const value = customTags[key]
      const normalizedKey = key.replace(PrometheusMetricReporter.LABEL_NAME_REPLACEMENT_REGEXP, '_')
      if (!exclude.includes(normalizedKey) &&
        !PrometheusMetricReporter.LABEL_NAME_START_EXCLUSION.includes(normalizedKey.charAt(0))) {
        tags[normalizedKey] = value
      }
    })
    return tags
  }

  /**
   * Builds the metric string based on the specified type of the metric instance.
   * Returns an empty string if the metric can't be reported - determined with the
   * specified function.
   *
   * @private
   * @template T
   * @param {Date} now
   * @param {T} metric
   * @param {PrometheusMetricType} metricType
   * @param {boolean} canReport
   * @param {PrometheusFields} fields
   * @param {Tags} [registryTags]
   * @returns {string}
   * @memberof PrometheusMetricReporter
   */
  private getMetricString<T extends Metric | SerializableMetric>(
    now: Date,
    metric: T,
    metricType: PrometheusMetricType,
    canReport: boolean,
    fields: PrometheusFields,
    registryTags?: Tags
  ): string {
    if (!canReport) {
      return ''
    }

    const metricName = this.getMetricName(metric)
    const description = this.getDescription(metric, metricName)
    const timestamp = this.getTimestamp(now)
    const tags = this.buildPrometheusTags(metric, ['le', 'quantile'], registryTags)
    const tagStr = Object
      .keys(tags)
      .map((tag) => `${tag}="${tags[tag]}"`)
      .join(',')
    let additionalFields = ''

    if (metricType === 'histogram') {
      additionalFields = this.getBuckets(metric as any, metricName, fields.count as number, tagStr, timestamp)
    } else if (metricType === 'summary') {
      additionalFields = this.getQuantiles(metric as any, metricName, tagStr, timestamp)
    }

    if (this.options.useUntyped) {
      metricType = 'untyped'
    }

    let comments = ''
    if (this.options.emitComments) {
      comments = `# HELP ${metricName} ${description}\n` +
        `# TYPE ${metricName} ${metricType}\n`
    }

    return comments + additionalFields + Object
      .keys(fields)
      .map((field) => {
        const fieldStr = PrometheusMetricReporter.isEmpty(field) ? '' : `_${field}`
        const valueStr = this.getValue(fields[field])

        return `${metricName}${fieldStr}{${tagStr}} ${valueStr}${timestamp}\n`
      })
      .join('')
  }

  /**
   * Builds the description for a metric instance based on the description property.
   * If no description was specified this function returns '<metric_name> description'.
   *
   * @private
   * @template T
   * @param {T} metric
   * @param {string} metricName
   * @returns {string}
   * @memberof PrometheusMetricReporter
   */
  private getDescription<T extends Metric | SerializableMetric>(metric: T, metricName: string): string {
    let description = getMetricDescription(metric)
    if (PrometheusMetricReporter.isEmpty(description)) {
      description = `${metricName} description`
    }
    return description
  }

  /**
   * Gets a numeric value in the correct format (mainly used to format +Inf and -Inf)
   *
   * @private
   * @param {*} value
   * @returns {string}
   * @memberof PrometheusMetricReporter
   */
  private getValue (value: any): string {
    let valueStr = `${value}`

    if (PrometheusMetricReporter.isNumber(value) && !Number.isFinite(value)) {
      if (value === -Infinity) {
        valueStr = '-Inf'
      } else if (value === Infinity) {
        valueStr = '+Inf'
      }
    }

    return valueStr
  }

  /**
   * Gets the UTC timestamp.
   *
   * @private
   * @param {Date} now
   * @returns {string}
   * @memberof PrometheusMetricReporter
   */
  private getTimestamp (now: Date): string {
    return this.options.includeTimestamp ? ` ${now.getUTCMilliseconds()}` : ''
  }

  /**
   * Builds the string for bucket data lines.
   *
   * @private
   * @template T
   * @param {T} metric
   * @param {string} metricName
   * @param {number} count
   * @param {string} tagStr
   * @param {string} timestamp
   * @returns {string}
   * @memberof PrometheusMetricReporter
   */
  private getBuckets<T extends (Metric | SerializableMetric) & (BucketCounting | SerializableBucketCounting)>(
    metric: T,
    metricName: string,
    count: number,
    tagStr: string,
    timestamp: string): string {
    const buckets: Buckets = getMetricBuckets(metric)
    if (buckets) {
      const tagPrefix = !PrometheusMetricReporter.isEmpty(tagStr) ? ',' : ''
      const bucketStrings: string[] = []
      const counts: BucketToCountMap = getMetricCounts(metric)

      for (const boundary of Object.keys(counts)) {
        const bucketCount: number = counts[boundary as any]
        bucketStrings.push(
          `${metricName}_bucket{${tagStr}${tagPrefix}le="${boundary}"} ${bucketCount}${timestamp}`
        )
      }

      return bucketStrings.join('\n') +
        `\n${metricName}_bucket{${tagStr}${tagPrefix}le="+Inf"} ${count}${timestamp}\n`
    }

    return ''
  }

  /**
   * Builds the string for percentile data lines.
   *
   * @private
   * @template T
   * @param {T} metric
   * @param {string} metricName
   * @param {string} tagStr
   * @param {string} timestamp
   * @returns {string}
   * @memberof PrometheusMetricReporter
   */
  private getQuantiles<T extends (Metric | SerializableMetric) & (Sampling | SerializableSampling)>(
    metric: T,
    metricName: string,
    tagStr: string,
    timestamp: string): string {
    const metadata: Metadata = getMetricMetadata(metric)
    let quantiles: Percentiles | null = metadata[Percentiles.METADATA_NAME]
    if (!quantiles) {
      quantiles = new Percentiles()
    }
    const tagPrefix = !PrometheusMetricReporter.isEmpty(tagStr) ? ',' : ''
    const snapshot = getSnapshot(metric)

    return quantiles
      .boundaries
      .map((boundary) => {
        const value = snapshot.getValue(boundary)
        return `${metricName}{${tagStr}${tagPrefix}quantile="${boundary}"} ${value}${timestamp}`
      })
      .join('\n') + '\n'
  }

  /**
   * Gets the normalized metric name.
   *
   * @private
   * @param {Metric | SerializableMetric} metric
   * @returns {string}
   * @memberof PrometheusMetricReporter
   */
  private getMetricName (metric: Metric | SerializableMetric): string {
    let name = getMetricName(metric)
    const group = getMetricGroup(metric)
    if (group) {
      name = `${group}:${name}`
    }

    name = name.replace(PrometheusMetricReporter.METRIC_NAME_REPLACEMENT_REGEXP, '_')
    if (PrometheusMetricReporter.METRIC_NAME_START_EXCLUSION.includes(name.charAt(0))) {
      name = '_' + name.slice(1)
    }
    return name
  }
}
