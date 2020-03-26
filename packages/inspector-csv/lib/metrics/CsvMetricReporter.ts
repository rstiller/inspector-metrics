import 'source-map-support'

import * as cluster from 'cluster'
import {
  Counter,
  DefaultClusterOptions,
  Event,
  Gauge,
  getMetricDescription,
  getMetricGroup,
  getMetricMetadata,
  getMetricName,
  Histogram,
  InterprocessReportMessage,
  Metadata,
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
  SerializableMetric,
  StdClock,
  Timer
} from 'inspector-metrics'
import * as moment from 'moment-timezone'

/**
 * Lists all possible column types.
 */
export type ColumnType = 'date' | 'name' | 'field' | 'group' | 'description' | 'value' | 'tags' | 'type' | 'metadata';

/**
 * Shortcut type for a row.
 */
export type Row = string[];

/**
 * Shortcut type for many rows.
 */
export type Rows = Row[];

/**
 * Type for a tag or metadata filter.
 */
export type Filter = (metric: Metric, key: string, value: string) => Promise<boolean>;

/**
 * Helper interface for Fields.
 *
 * @interface Fields
 */
interface Fields {
  [field: string]: string
}

/**
 * Tags and metadata can be exported in one row or in separate rows.
 *
 * @export
 * @enum {number}
 */
export enum ExportMode {
  ALL_IN_ONE_COLUMN,
  EACH_IN_OWN_COLUMN,
}

/**
 * Delegation interface for writing the actual value to a file.
 *
 * @export
 * @interface CsvFileWriter
 */
export interface CsvFileWriter {

  /**
   * Called on every metrics-report run one time - behavior is implementation specific.
   *
   * @param {Row} header
   * @returns {Promise<void>}
   * @memberof CsvFileWriter
   */
  init(header: Row): Promise<void>

  /**
   * Called for each field of each metric and after init finished - behavior is implementation specific.
   *
   * @param {Metric | SerializableMetric} metric
   * @param {Row} values
   * @returns {Promise<void>}
   * @memberof CsvFileWriter
   */
  writeRow(metric: Metric | SerializableMetric, values: Row): Promise<void>
}

/**
 * Options for {@link CsvMetricReporter}.
 *
 * @export
 * @interface CsvMetricReporterOptions
 */
export interface CsvMetricReporterOptions extends ScheduledMetricReporterOptions {
  /**
   * The writer used to store the rows.
   *
   * @type {CsvFileWriter}
   * @memberof CsvMetricReporterOptions
   */
  readonly writer?: CsvFileWriter
  /**
   * Indicates that single quotes are used instead of double quotes.
   *
   * @type {boolean}
   * @memberof CsvMetricReporterOptions
   */
  readonly useSingleQuotes?: boolean
  /**
   * ExportMode for tags.
   *
   * @type {ExportMode}
   * @memberof CsvMetricReporterOptions
   */
  readonly tagExportMode?: ExportMode
  /**
   * ExportMode for metadata.
   *
   * @type {ExportMode}
   * @memberof CsvMetricReporterOptions
   */
  readonly metadataExportMode?: ExportMode
  /**
   * Prefix for tag columns if exported separately.
   *
   * @type {string}
   * @memberof CsvMetricReporterOptions
   */
  readonly tagColumnPrefix?: string
  /**
   * Delimiter between the tags if exported in one column.
   *
   * @type {string}
   * @memberof CsvMetricReporterOptions
   */
  readonly tagDelimiter?: string
  /**
   * Prefix for metadata columns if exported separately.
   *
   * @type {string}
   * @memberof CsvMetricReporterOptions
   */
  readonly metadataColumnPrefix?: string
  /**
   * Delimiter between the metadata if exported in one column.
   *
   * @type {string}
   * @memberof CsvMetricReporterOptions
   */
  readonly metadataDelimiter?: string
  /**
   * The columns to export.
   *
   * @type {ColumnType[]}
   * @memberof CsvMetricReporterOptions
   */
  readonly columns?: ColumnType[]
  /**
   * The format for the date column.
   *
   * @type {string}
   * @memberof CsvMetricReporterOptions
   */
  readonly dateFormat?: string
  /**
   * The timezone used to determine the date.
   *
   * @type {string}
   * @memberof CsvMetricReporterOptions
   */
  readonly timezone?: string
  /**
   * An async filter function used to filter out unwanted tags.
   *
   * @type {Filter}
   * @memberof CsvMetricReporterOptions
   */
  readonly tagFilter?: Filter
  /**
   * An async filter function used to filter out unwanted metadata.
   *
   * @type {Filter}
   * @memberof CsvMetricReporterOptions
   */
  readonly metadataFilter?: Filter
}

/**
 * Metric reporter for csv files.
 *
 * @export
 * @class CsvMetricReporter
 * @extends {ScheduledMetricReporter}
 */
export class CsvMetricReporter extends ScheduledMetricReporter<CsvMetricReporterOptions, Fields> {
  /**
   * Header row.
   *
   * @private
   * @type {Row}
   * @memberof CsvMetricReporter
   */
  private header: Row;
  /**
   * All metadata names
   *
   * @private
   * @type {string[]}
   * @memberof CsvMetricReporter
   */
  private readonly metadataNames: string[] = [];
  /**
   * All tags names.
   *
   * @private
   * @type {string[]}
   * @memberof CsvMetricReporter
   */
  private readonly tagsNames: string[] = [];

  /**
   * Creates an instance of CsvMetricReporter.
   *
   * @param {string} [reporterType] the type of the reporter implementation - for internal use
   * @memberof CsvMetricReporter
   */
  public constructor ({
    writer,
    useSingleQuotes = false,
    tagExportMode = ExportMode.ALL_IN_ONE_COLUMN,
    metadataExportMode = ExportMode.ALL_IN_ONE_COLUMN,
    tagColumnPrefix = 'tag_',
    tagDelimiter = ';',
    metadataColumnPrefix = 'meta_',
    metadataDelimiter = ';',
    columns = [],
    dateFormat = 'YYYYMMDDHHmmss.SSSZ',
    timezone = 'UTC',
    tagFilter = async () => true,
    metadataFilter = async () => true,
    reportInterval = 1000,
    unit = MILLISECOND,
    clock = new StdClock(),
    scheduler = setInterval,
    minReportingTimeout = 1,
    tags = new Map(),
    clusterOptions = new DefaultClusterOptions()
  }: CsvMetricReporterOptions,
  reporterType?: string) {
    super({
      clock,
      clusterOptions,
      columns,
      dateFormat,
      metadataColumnPrefix,
      metadataDelimiter,
      metadataExportMode,
      metadataFilter,
      minReportingTimeout,
      reportInterval,
      scheduler,
      tagColumnPrefix,
      tagDelimiter,
      tagExportMode,
      tagFilter,
      tags,
      timezone,
      unit,
      useSingleQuotes,
      writer
    }, reporterType)
  }

  /**
   * Builds all headers and starts scheduling reporting runs.
   * When call this method all metadata and tags in each metric
   * in the application need to be set / known, otherwise it cannot be
   * reported.
   *
   * @returns {Promise<this>}
   * @memberof CsvMetricReporter
   */
  public async start (): Promise<this> {
    if (this.metricRegistries && this.metricRegistries.length > 0) {
      // rebuild header on every call to start
      this.header = await this.buildHeaders()
      // only call init on master process
      if (this.shouldCallInit()) {
        await this.options.writer.init(this.header)
      }
      await super.start()
    }
    return this
  }

  /**
   * Reports an {@link Event}.
   *
   * @param {TEvent} event
   * @returns {Promise<TEvent>}
   * @memberof CsvMetricReporter
   */
  public async reportEvent<TEventData, TEvent extends Event<TEventData>>(event: TEvent): Promise<TEvent> {
    if (!this.header) {
      this.header = await this.buildHeaders()
    }

    const result = this.reportGauge(event, {
      date: event.getTime(),
      metrics: [],
      overallCtx: null,
      registry: null,
      type: 'gauge'
    })

    if (result) {
      if (this.options.clusterOptions &&
        this.options.clusterOptions.enabled &&
        this.options.clusterOptions.sendMetricsToMaster) {
        const message: InterprocessReportMessage<Fields> = {
          ctx: {},
          date: event.getTime(),
          metrics: {
            counters: [],
            gauges: [{
              metric: event,
              result
            }],
            histograms: [],
            meters: [],
            monotoneCounters: [],
            timers: []
          },
          tags: this.buildTags(null, null),
          targetReporterType: this.reporterType,
          type: CsvMetricReporter.MESSAGE_TYPE
        }
        await this.options.clusterOptions.sendToMaster(message)
      } else {
        await this.options.writer.init(this.header)
        await this.handleResults(null, null, event.getTime(), 'gauge', [{
          metric: event,
          result
        }])
      }
    }
    return event
  }

  /**
   * Does nothing.
   *
   * @returns {Promise<void>}
   * @memberof CsvMetricReporter
   */
  public async flushEvents (): Promise<void> {
  }

  /**
   * Indicates if the init method of the writer instance should be called.
   *
   * @protected
   * @returns {boolean}
   * @memberof CsvMetricReporter
   */
  protected shouldCallInit (): boolean {
    return !this.options.clusterOptions ||
      !this.options.clusterOptions.enabled ||
      (this.options.clusterOptions.enabled && !this.options.clusterOptions.sendMetricsToMaster)
  }

  /**
   * Makes sure the csv headers are built, written to the file to then
   * call the parent class's implementation of this method.
   *
   * @protected
   * @param {cluster.Worker} worker
   * @param {*} message
   * @param {*} handle
   * @memberof CsvMetricReporter
   */
  protected async handleReportMessage (worker: cluster.Worker, message: any, handle: any): Promise<void> {
    if (this.canHandleMessage(message)) {
      if (!this.header) {
        this.header = await this.buildHeaders()
      }
      await this.options.writer.init(this.header)
      await super.handleReportMessage(worker, message, handle)
    }
  }

  /**
   * Calls the init method of the writer instance if
   * the metrics are not send to the master process
   * (so probably only called by master-process if clustering is enabled).
   *
   * @protected
   * @memberof CsvMetricReporter
   */
  protected async beforeReport (ctx: OverallReportContext): Promise<void> {
    if (this.shouldCallInit()) {
      await this.options.writer.init(this.header)
    }
  }

  /**
   * Writes the reporting results to the writer instance.
   *
   * @protected
   * @param {MetricRegistry | null} registry
   * @param {Date} date
   * @param {MetricType} type
   * @param {Array<ReportingResult<any, Fields>>} results
   * @memberof CsvMetricReporter
   */
  protected async handleResults (
    ctx: OverallReportContext,
    registry: MetricRegistry | null,
    date: Date,
    type: MetricType,
    results: Array<ReportingResult<any, Fields>>): Promise<void> {
    const dateStr = moment.tz(date, this.options.timezone).format(this.options.dateFormat)
    for (const result of results) {
      const fields = result.result
      const metric = result.metric
      if (fields) {
        const rows: Rows = []
        for (const field of Object.keys(fields)) {
          const row = this.buildRow(registry, dateStr, metric, type, field, fields[field])
          rows.push(row)
        }
        if (rows.length > 0) {
          await this.writeRows(metric, rows, type)
        }
      }
    }
  }

  /**
   * Gathers the fields for a counter metric.
   *
   * @protected
   * @param {(MonotoneCounter | Counter)} counter
   * @param {(ReportingContext<MonotoneCounter | Counter>)} ctx
   * @returns {Fields}
   * @memberof CsvMetricReporter
   */
  protected reportCounter (
    counter: MonotoneCounter | Counter, ctx: MetricSetReportContext<MonotoneCounter | Counter>): Fields {
    return {
      count: `${counter.getCount()}`
    }
  }

  /**
   * Gathers the fields for a gauge metric.
   *
   * @protected
   * @param {Gauge<any>} gauge
   * @param {ReportingContext<Gauge<any>>} ctx
   * @returns {Fields}
   * @memberof CsvMetricReporter
   */
  protected reportGauge (gauge: Gauge<any>, ctx: MetricSetReportContext<Gauge<any>>): Fields {
    return {
      value: `${gauge.getValue()}`
    }
  }

  /**
   * Gathers the fields for a histogram metric.
   *
   * @protected
   * @param {Histogram} histogram
   * @param {ReportingContext<Histogram>} ctx
   * @returns {Fields}
   * @memberof CsvMetricReporter
   */
  protected reportHistogram (histogram: Histogram, ctx: MetricSetReportContext<Histogram>): Fields {
    const snapshot = histogram.getSnapshot()
    const bucketFields: Fields = {}
    histogram
      .getCounts()
      .forEach((value, bucket): void => {
        bucketFields[`bucket_${bucket}`] = `${value}`
      })
    bucketFields.bucket_inf = `${this.getNumber(histogram.getCount())}`
    return {
      ...bucketFields,
      count: `${this.getNumber(histogram.getCount())}`,
      max: `${this.getNumber(snapshot.getMax())}`,
      mean: `${this.getNumber(snapshot.getMean())}`,
      min: `${this.getNumber(snapshot.getMin())}`,
      p50: `${this.getNumber(snapshot.getMedian())}`,
      p75: `${this.getNumber(snapshot.get75thPercentile())}`,
      p95: `${this.getNumber(snapshot.get95thPercentile())}`,
      p98: `${this.getNumber(snapshot.get98thPercentile())}`,
      p99: `${this.getNumber(snapshot.get99thPercentile())}`,
      p999: `${this.getNumber(snapshot.get999thPercentile())}`,
      stddev: `${this.getNumber(snapshot.getStdDev())}`,
      sum: histogram.getSum().toString()
    }
  }

  /**
   * Gathers the fields for a meter metric.
   *
   * @protected
   * @param {Meter} meter
   * @param {ReportingContext<Meter>} ctx
   * @returns {Fields}
   * @memberof CsvMetricReporter
   */
  protected reportMeter (meter: Meter, ctx: MetricSetReportContext<Meter>): Fields {
    return {
      count: `${this.getNumber(meter.getCount())}`,
      m15_rate: `${this.getNumber(meter.get15MinuteRate())}`,
      m1_rate: `${this.getNumber(meter.get1MinuteRate())}`,
      m5_rate: `${this.getNumber(meter.get5MinuteRate())}`,
      mean_rate: `${this.getNumber(meter.getMeanRate())}`
    }
  }

  /**
   * Gathers the fields for a timer metric.
   *
   * @protected
   * @param {Timer} timer
   * @param {ReportingContext<Timer>} ctx
   * @returns {Fields}
   * @memberof CsvMetricReporter
   */
  protected reportTimer (timer: Timer, ctx: MetricSetReportContext<Timer>): Fields {
    const snapshot = timer.getSnapshot()
    const bucketFields: Fields = {}
    timer
      .getCounts()
      .forEach((value, bucket): void => {
        bucketFields[`bucket_${bucket}`] = `${value}`
      })
    bucketFields.bucket_inf = `${this.getNumber(timer.getCount())}`
    return {
      ...bucketFields,
      count: `${timer.getCount() || 0}`,
      m15_rate: `${this.getNumber(timer.get15MinuteRate())}`,
      m1_rate: `${this.getNumber(timer.get1MinuteRate())}`,
      m5_rate: `${this.getNumber(timer.get5MinuteRate())}`,
      max: `${this.getNumber(snapshot.getMax())}`,
      mean: `${this.getNumber(snapshot.getMean())}`,
      mean_rate: `${this.getNumber(timer.getMeanRate())}`,
      min: `${this.getNumber(snapshot.getMin())}`,
      p50: `${this.getNumber(snapshot.getMedian())}`,
      p75: `${this.getNumber(snapshot.get75thPercentile())}`,
      p95: `${this.getNumber(snapshot.get95thPercentile())}`,
      p98: `${this.getNumber(snapshot.get98thPercentile())}`,
      p99: `${this.getNumber(snapshot.get99thPercentile())}`,
      p999: `${this.getNumber(snapshot.get999thPercentile())}`,
      stddev: `${this.getNumber(snapshot.getStdDev())}`,
      sum: timer.getSum().toString()
    }
  }

  /**
   * Builds a row / string array with all headers. Also updated the internal data of the reporter.
   *
   * @private
   * @returns {Promise<Row>}
   * @memberof CsvMetricReporter
   */
  private async buildHeaders (): Promise<Row> {
    const headers: Row = []

    for (const columnType of this.options.columns) {
      if (columnType === 'metadata' && this.options.metadataExportMode === ExportMode.EACH_IN_OWN_COLUMN) {
        const metadataNames = this.getAllMetadataKeys()
        const filteredNames = await this.filterKeys(metadataNames, this.options.metadataFilter)
        filteredNames.forEach((metadataName) => {
          headers.push(`${this.options.metadataColumnPrefix}${metadataName}`)
          this.metadataNames.push(metadataName)
        })
      } else if (columnType === 'tags' && this.options.tagExportMode === ExportMode.EACH_IN_OWN_COLUMN) {
        const tagNames = this.getAllTagKeys()
        const filteredTags = await this.filterKeys(tagNames, this.options.tagFilter)
        filteredTags.forEach((tag) => {
          headers.push(`${this.options.tagColumnPrefix}${tag}`)
          this.tagsNames.push(tag)
        })
      } else {
        headers.push(columnType)
      }
    }

    return headers
  }

  /**
   * Filters the given set of strings using the given filter and returns the filtered set.
   *
   * @private
   * @param {Set<string>} keys
   * @param {Filter} filter
   * @returns {Promise<Set<string>>}
   * @memberof CsvMetricReporter
   */
  private async filterKeys (keys: Set<string>, filter: Filter): Promise<Set<string>> {
    const filteredKeys = new Set<string>()
    const tasks: Array<Promise<any>> = []
    keys.forEach((key) => {
      tasks.push((async () => {
        if (!filter || await filter(null, key, null)) {
          filteredKeys.add(key)
        }
      })())
    })
    await Promise.all(tasks)
    return filteredKeys
  }

  /**
   * Gets all metadata keys - no filtering.
   *
   * @private
   * @returns {Set<string>}
   * @memberof CsvMetricReporter
   */
  private getAllMetadataKeys (): Set<string> {
    const metadataNames = new Set<string>()
    this.metricRegistries
      .map((registry) => registry.getMetricList())
      .map((metrics) => metrics.map((metric) => metric.getMetadataMap()))
      .forEach((metadataMapArray) => {
        metadataMapArray.forEach((metadataMap) => {
          for (const metadataName of metadataMap.keys()) {
            metadataNames.add(metadataName)
          }
        })
      })
    return metadataNames
  }

  /**
   * Gets all tag names - no filtering.
   *
   * @private
   * @returns {Set<string>}
   * @memberof CsvMetricReporter
   */
  private getAllTagKeys (): Set<string> {
    const tags = new Set<string>()
    this.options.tags.forEach((value, tag) => tags.add(tag))
    this.metricRegistries
      .map((registry) => ({
        metrics: registry.getMetricList(),
        registry
      }))
      .map((result) => result.metrics.map((metric) => this.buildTags(result.registry, metric)))
      .forEach((metricTagsArray) => {
        metricTagsArray.forEach((metricTags) => {
          Object.keys(metricTags).forEach((tag) => tags.add(tag))
        })
      })
    return tags
  }

  /**
   * Builds the row of a single metric.
   *
   * @private
   * @template T
   * @param {MetricRegistry | null} registry
   * @param {string} dateStr
   * @param {T} metric
   * @param {MetricType} type
   * @param {string} field
   * @param {string} value
   * @returns {Row}
   * @memberof CsvMetricReporter
   */
  private buildRow<T extends Metric | SerializableMetric>(
    registry: MetricRegistry | null,
    dateStr: string,
    metric: T,
    type: MetricType,
    field: string,
    value: string): Row {
    const quote = this.options.useSingleQuotes ? "'" : '"'
    const row: Row = []
    const tags = this.buildTags(registry, metric)

    let metadataStr = ''
    if (this.options.metadataExportMode === ExportMode.ALL_IN_ONE_COLUMN) {
      const metadata: Metadata = getMetricMetadata(metric)
      Object.keys(metadata).forEach((metadataName) => {
        const metadataValue = metadata[metadataName]
        metadataStr += `${metadataName}=${quote}${metadataValue}${quote}${this.options.metadataDelimiter}`
      })
      metadataStr = metadataStr.slice(0, -1)
    }

    let tagStr = ''
    if (this.options.tagExportMode === ExportMode.ALL_IN_ONE_COLUMN) {
      tagStr = Object.keys(tags)
        .map((tag) => `${tag}=${quote}${tags[tag]}${quote}`)
        .join(this.options.tagDelimiter)
    }

    for (const columnType of this.options.columns) {
      let tmpStr = ''
      switch (columnType) {
        case 'date':
          row.push(dateStr)
          break
        case 'description':
          tmpStr = encodeURIComponent(getMetricDescription(metric) || '')
          if (quote === "'") {
            tmpStr = tmpStr.replace(/'/g, "\\'")
          }
          row.push(`${quote}${tmpStr}${quote}`)
          break
        case 'field':
          row.push(`${quote}${field || ''}${quote}`)
          break
        case 'group':
          row.push(`${quote}${getMetricGroup(metric) || ''}${quote}`)
          break
        case 'metadata':
          if (this.options.metadataExportMode === ExportMode.ALL_IN_ONE_COLUMN) {
            row.push(metadataStr)
          } else {
            const metadata: Metadata = getMetricMetadata(metric)
            for (const metadataName of this.metadataNames) {
              row.push(`${quote}${metadata[metadataName] || ''}${quote}`)
            }
          }
          break
        case 'name':
          row.push(`${quote}${getMetricName(metric) || ''}${quote}`)
          break
        case 'tags':
          if (this.options.tagExportMode === ExportMode.ALL_IN_ONE_COLUMN) {
            row.push(tagStr)
          } else {
            for (const tag of this.tagsNames) {
              row.push(`${quote}${tags[tag] || ''}${quote}`)
            }
          }
          break
        case 'type':
          row.push(`${quote}${type || ''}${quote}`)
          break
        case 'value':
          row.push(value || '')
          break
        default:
      }
    }

    return row
  }

  /**
   * Writes the rows by calling the corresponding {@link CsvFileWriter}.
   *
   * @private
   * @template T
   * @param {T} metric
   * @param {Rows} rows
   * @param {MetricType} type
   * @memberof CsvMetricReporter
   */
  private async writeRows<T extends Metric | SerializableMetric>(
    metric: T,
    rows: Rows,
    type: MetricType
  ): Promise<void> {
    for (const row of rows) {
      await this.options.writer.writeRow(metric, row)
    }
  }
}
