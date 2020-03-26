import "source-map-support/register";

import * as cluster from "cluster";
import { Counter, MonotoneCounter } from "../counter";
import { Event } from "../event";
import { Gauge } from "../gauge";
import { Histogram } from "../histogram";
import { Meter } from "../meter";
import { MetricRegistry } from "../metric-registry";
import { getMetricTags, Metric } from "../model/metric";
import { Taggable, Tags, tagsToMap } from "../model/taggable";
import { MILLISECOND, MINUTE } from "../model/time-unit";
import { Timer } from "../timer";
import { InterprocessMessage, InterprocessReportMessage } from "./interprocess-message";
import { MetricEntry } from "./metric-entry";
import { MetricReporterOptions } from "./metric-reporter-options";
import { MetricSetReportContext } from "./metric-set-report-context";
import { MetricType } from "./metric-type";
import { OverallReportContext } from "./overall-report-context";
import { ReportingResult } from "./reporting-result";

/**
 * Interface for metric-reporter.
 *
 * @export
 * @interface IMetricReporter
 */
export interface IMetricReporter {
  /**
   * Gets the reporter tags.
   *
   * @returns {Map<string, string>}
   * @memberof IMetricReporter
   */
  getTags(): Map<string, string>;

  /**
   * Sets the reporter tags.
   *
   * @param {Map<string, string>} tags
   * @returns {this}
   * @memberof IMetricReporter
   */
  setTags(tags: Map<string, string>): this;

  /**
   * Implementations start reporting metrics when called.
   *
   * @abstract
   * @returns {Promise<this>}
   * @memberof IMetricReporter
   */
  start(): Promise<this>;

  /**
   * Implementations stop reporting metrics when called.
   *
   * @abstract
   * @returns {Promise<this>}
   * @memberof IMetricReporter
   */
  stop(): Promise<this>;

  /**
   * Adds a new {@link MetricRegistry} to be reported.
   *
   * @param {MetricRegistry} metricRegistry
   * @returns {this}
   * @memberof IMetricReporter
   */
  addMetricRegistry(metricRegistry: MetricRegistry): this;

  /**
   * Removes the given {@link MetricRegistry} if it was previously added.
   *
   * @param {MetricRegistry} metricRegistry
   * @returns {this}
   * @memberof IMetricReporter
   */
  removeMetricRegistry(metricRegistry: MetricRegistry): this;

  /**
   * Reports an {@link Event}.
   *
   * Implementations can choose how to process ad-hoc events, wether it's
   * queuing the events to the next call to report or sending events
   * immediately.
   *
   * Also the usual reporting process of calling {@link #beforeReport}, do the reporting
   * and call {@link #afterReport} may not be applied for ad-hoc events.
   *
   * This implementation does nothing and always resolved the specified event.
   *
   * @param {TEvent} event
   * @returns {Promise<TEvent>}
   * @memberof IMetricReporter
   */
  reportEvent<TEventData, TEvent extends Event<TEventData>>(event: TEvent): Promise<TEvent>;

  /**
   * Sends events remaining in the queue (if a queue is used in the implementation).
   *
   * @returns {Promise<void>}
   * @memberof IMetricReporter
   */
  flushEvents(): Promise<void>;
}

/**
 * Pseudo-{@link MetricRegistry} used to provide an interface for registry tags.
 *
 * @class TagsOnlyMetricRegistry
 */
class TagsOnlyMetricRegistry {

  /**
   * private tags map.
   *
   * @private
   * @type {Map<string, string>}
   * @memberof TagsOnlyMetricRegistry
   */
  private tags: Map<string, string>;

  /**
   * Creates an instance of TagsOnlyMetricRegistry.
   *
   * @param {Tags} tags
   * @memberof TagsOnlyMetricRegistry
   */
  public constructor(tags: Tags) {
      this.tags = tagsToMap(tags);
  }

  /**
   * Gets the tags map.
   *
   * @returns {Map<string, string>}
   * @memberof TagsOnlyMetricRegistry
   */
  public getTags(): Map<string, string> {
      return this.tags;
  }

}

/**
 * Base-class for metric-reporter implementations.
 *
 * @export
 * @abstract
 * @class MetricReporter
 */
export abstract class MetricReporter<O extends MetricReporterOptions, T> implements IMetricReporter {

  /**
   * Constant for the "type" variable of process-level message identifying report-messages
   * from reporter of forked processes.
   *
   * @static
   * @memberof MetricReporter
   */
  public static readonly MESSAGE_TYPE = "inspector-metrics:metric-reporter:report";

  /**
   * {@link MetricRegistry} instances.
   *
   * @protected
   * @readonly
   * @type {MetricRegistry[]}
   * @memberof MetricReporter
   */
  protected readonly metricRegistries: MetricRegistry[] = [];
  /**
   * options for this reporter instance.
   *
   * @protected
   * @readonly
   * @type {O}
   * @memberof MetricReporter
   */
  protected readonly options: O;
  /**
   * Keeps track of the reporting states for each metric.
   *
   * @protected
   * @readonly
   * @type {Map<number, MetricEntry>}
   * @memberof MetricReporter
   */
  protected readonly metricStates: Map<number, MetricEntry> = new Map();
  /**
   * The type of the reporter implementation - for internal use.
   *
   * @protected
   * @readonly
   * @type {string}
   * @memberof MetricReporter
   */
  protected readonly reporterType: string;

  /**
   * Creates an instance of MetricReporter.
   *
   * @param {O} options
   * @param {string} [reporterType] the type of the reporter implementation - for internal use
   * @memberof MetricReporter
   */
  public constructor(options: O, reporterType?: string) {
      this.options = options;
      this.reporterType = reporterType || this.constructor.name;
      const clusterOptions = this.options.clusterOptions;
      if (clusterOptions &&
          clusterOptions.enabled &&
          !clusterOptions.sendMetricsToMaster) {
          clusterOptions.eventReceiver.on("message", (worker, message, handle) =>
              this.handleReportMessage(worker, message, handle));
      }
  }

  /**
   * Gets the reporter tags.
   *
   * @returns {Map<string, string>}
   * @memberof MetricReporter
   */
  public getTags(): Map<string, string> {
      return this.options.tags;
  }

  /**
   * Sets the reporter tags.
   *
   * @param {Map<string, string>} tags
   * @returns {this}
   * @memberof MetricReporter
   */
  public setTags(tags: Map<string, string>): this {
      this.options.tags = tags;
      return this;
  }

  /**
   * Implementations start reporting metrics when called.
   *
   * @abstract
   * @returns {Promise<this>}
   * @memberof MetricReporter
   */
  public abstract start(): Promise<this>;

  /**
   * Implementations stop reporting metrics when called.
   *
   * @abstract
   * @returns {Promise<this>}
   * @memberof MetricReporter
   */
  public abstract stop(): Promise<this>;

  /**
   * Adds a new {@link MetricRegistry} to be reported.
   *
   * @param {MetricRegistry} metricRegistry
   * @returns {this}
   * @memberof MetricReporter
   */
  public addMetricRegistry(metricRegistry: MetricRegistry): this {
      this.metricRegistries.push(metricRegistry);
      return this;
  }

  /**
   * Removes the given {@link MetricRegistry} if it was previously added.
   *
   * @param {MetricRegistry} metricRegistry
   * @returns {this}
   * @memberof MetricReporter
   */
  public removeMetricRegistry(metricRegistry: MetricRegistry): this {
      const index: number = this.metricRegistries.indexOf(metricRegistry);
      if (index > -1) {
          this.metricRegistries.splice(index, 1);
      }
      return this;
  }

  /**
   * Reports an {@link Event}.
   *
   * Implementations can choose how to process ad-hoc events, wether it's
   * queuing the events to the next call to report or sending events
   * immediately.
   *
   * Also the usual reporting process of calling {@link #beforeReport}, do the reporting
   * and call {@link #afterReport} may not be applied for ad-hoc events.
   *
   * This implementation does nothing and always resolved the specified event.
   *
   * @param {TEvent} event
   * @returns {Promise<TEvent>}
   * @memberof MetricReporter
   */
  public async reportEvent<TEventData, TEvent extends Event<TEventData>>(event: TEvent): Promise<TEvent> {
      return event;
  }

  /**
   * Sends events remaining in the queue (if a queue is used in the implementation).
   *
   * @returns {Promise<void>}
   * @memberof MetricReporter
   */
  public async flushEvents(): Promise<void> {
  }

  /**
   * Checks if the specified message can be handle by this metric-reporter and is of the desired type.
   *
   * @protected
   * @param {InterprocessMessage} message
   * @param {string} [targetType=MetricReporter.MESSAGE_TYPE]
   * @returns {boolean}
   * @memberof MetricReporter
   */
  protected canHandleMessage(
      message: InterprocessMessage,
      targetType: string = MetricReporter.MESSAGE_TYPE): boolean {
      return message &&
          message.type && message.type === targetType &&
          message.targetReporterType && message.targetReporterType === this.reporterType;
  }

  /**
   * Handles messages from forked processes.
   *
   * @protected
   * @param {cluster.Worker} worker
   * @param {*} message
   * @param {*} handle
   * @memberof MetricReporter
   */
  protected async handleReportMessage(worker: cluster.Worker, message: any, handle: any) {
      if (this.canHandleMessage(message)) {
          const report: InterprocessReportMessage<T> = message;
          const reg: MetricRegistry = (new TagsOnlyMetricRegistry(report.tags) as any) as MetricRegistry;
          await this.handleResults(report.ctx, reg, report.date, "counter", report.metrics.monotoneCounters);
          await this.handleResults(report.ctx, reg, report.date, "counter", report.metrics.counters);
          await this.handleResults(report.ctx, reg, report.date, "gauge", report.metrics.gauges);
          await this.handleResults(report.ctx, reg, report.date, "histogram", report.metrics.histograms);
          await this.handleResults(report.ctx, reg, report.date, "meter", report.metrics.meters);
          await this.handleResults(report.ctx, reg, report.date, "timer", report.metrics.timers);
      }
  }

  /**
   * Called before each reporting run.
   *
   * @protected
   * @memberof MetricReporter
   */
  protected async beforeReport(ctx: OverallReportContext) {
  }

  /**
   * Called after each reporting run.
   *
   * @protected
   * @memberof MetricReporter
   */
  protected async afterReport(ctx: OverallReportContext) {
  }

  /**
   * Run the reporting procedures. Calls {@link #beforeReport} before each
   * {@link MetricRegistry}'s metrics are reported and {@link #afterReport}
   * afterwards.
   *
   * @protected
   * @memberof MetricReporter
   */
  protected async report(): Promise<OverallReportContext> {
      if (this.metricRegistries && this.metricRegistries.length > 0) {
          const ctx = this.createOverallReportContext();
          await this.beforeReport(ctx);
          for (const registry of this.metricRegistries) {
              await this.reportMetricRegistry(ctx, registry);
          }
          await this.afterReport(ctx);
          return ctx;
      }
      return {};
  }

  /**
   * Reporting function for a single {@link MetricRegistry}.
   * Calls {@link #createReportingContext} for each metric type.
   * Afterwards calls {@link #reportMetrics} for each of the
   * registry's metrics - grouped by type.
   * And finally calls {@link #handleResults} for each of the results.
   *
   * @protected
   * @param {OverallReportContext} ctx
   * @param {MetricRegistry | null} registry
   * @memberof MetricReporter
   */
  protected async reportMetricRegistry(
      ctx: OverallReportContext,
      registry: MetricRegistry | null) {

      const date: Date = new Date(this.options.clock.time().milliseconds);
      const counterCtx: MetricSetReportContext<MonotoneCounter | Counter> = this
          .createMetricSetReportContext(ctx, registry, date, "counter");
      const gaugeCtx: MetricSetReportContext<Gauge<any>> = this
          .createMetricSetReportContext(ctx, registry, date, "gauge");
      const histogramCtx: MetricSetReportContext<Histogram> = this
          .createMetricSetReportContext(ctx, registry, date, "histogram");
      const meterCtx: MetricSetReportContext<Meter> = this
          .createMetricSetReportContext(ctx, registry, date, "meter");
      const timerCtx: MetricSetReportContext<Timer> = this
          .createMetricSetReportContext(ctx, registry, date, "timer");

      counterCtx.metrics = registry.getMonotoneCounterList();
      const monotoneCounterResults = this.reportMetrics(ctx, counterCtx,
          (counter: MonotoneCounter) => this.reportCounter(counter, counterCtx),
          (counter: MonotoneCounter) => counter.getCount());

      counterCtx.metrics = registry.getCounterList();
      const counterResults = this.reportMetrics(ctx, counterCtx as MetricSetReportContext<Counter>,
          (counter: Counter) => this.reportCounter(counter, counterCtx),
          (counter: Counter) => counter.getCount());

      gaugeCtx.metrics = registry.getGaugeList();
      const gaugeResults = this.reportMetrics(ctx, gaugeCtx,
          (gauge: Gauge<any>) => this.reportGauge(gauge, gaugeCtx),
          (gauge: Gauge<any>) => gauge.getValue());

      histogramCtx.metrics = registry.getHistogramList();
      const histogramResults = this.reportMetrics(ctx, histogramCtx,
          (histogram: Histogram) => this.reportHistogram(histogram, histogramCtx),
          (histogram: Histogram) => histogram.getCount());

      meterCtx.metrics = registry.getMeterList();
      const meterResults = this.reportMetrics(ctx, meterCtx,
          (meter: Meter) => this.reportMeter(meter, meterCtx),
          (meter: Meter) => meter.getCount());

      timerCtx.metrics = registry.getTimerList();
      const timerResults = this.reportMetrics(ctx, timerCtx,
          (timer: Timer) => this.reportTimer(timer, timerCtx),
          (timer: Timer) => timer.getCount());

      if (this.sendMetricsToMaster()) {
          const message: InterprocessReportMessage<T> = {
              ctx,
              date,
              metrics: {
                  counters: counterResults,
                  gauges: gaugeResults,
                  histograms: histogramResults,
                  meters: meterResults,
                  monotoneCounters: monotoneCounterResults,
                  timers: timerResults,
              },
              tags: this.buildTags(registry, null),
              targetReporterType: this.reporterType,
              type: MetricReporter.MESSAGE_TYPE,
          };
          this.options.clusterOptions.sendToMaster(message);
      } else {
          await this.handleResults(ctx, registry, date, "counter", monotoneCounterResults);
          await this.handleResults(ctx, registry, date, "counter", counterResults);
          await this.handleResults(ctx, registry, date, "gauge", gaugeResults);
          await this.handleResults(ctx, registry, date, "histogram", histogramResults);
          await this.handleResults(ctx, registry, date, "meter", meterResults);
          await this.handleResults(ctx, registry, date, "timer", timerResults);
      }
  }

  /**
   * Called in {@link #reportMetricRegistry} to determine to send a reporting-message to the master process.
   *
   * @protected
   * @returns {boolean}
   * @memberof MetricReporter
   */
  protected sendMetricsToMaster(): boolean {
      return  this.options.clusterOptions &&
              this.options.clusterOptions.enabled &&
              this.options.clusterOptions.sendMetricsToMaster;
  }

  /**
   * Creates an OverallReportContext.
   *
   * @protected
   * @returns {OverallReportContext}
   * @memberof MetricReporter
   */
  protected createOverallReportContext(): OverallReportContext {
      return {
      };
  }

  /**
   * Creates a MetricSetReportContext with the specified arguments.
   *
   * @protected
   * @param {OverallReportContext} overallCtx
   * @param {MetricRegistry | null} registry
   * @param {Date} date
   * @param {MetricType} type
   * @returns {MetricSetReportContext<any>}
   * @memberof MetricReporter
   */
  protected createMetricSetReportContext(
      overallCtx: OverallReportContext,
      registry: MetricRegistry | null,
      date: Date,
      type: MetricType): MetricSetReportContext<any> {
      return {
          date,
          metrics: [],
          overallCtx,
          registry,
          type,
      };
  }

  /**
   * Filters out each metric that does not necessarily need to be reported
   * and calls the specified reporting function for the remaining.
   *
   * @protected
   * @template M type of the metric
   * @template C typed ReportingContext
   * @param {C} ctx
   * @param {(metric: M, ctx: C) => T} reportFunction
   * @param {(metric: M, ctx: C) => number} lastModifiedFunction
   * @returns {Array<ReportingResult<M, T>>}
   * @memberof MetricReporter
   */
  protected reportMetrics<M extends Metric, C extends MetricSetReportContext<M>>(
      overallCtx: OverallReportContext,
      ctx: C,
      reportFunction: (metric: M, ctx: C) => T,
      lastModifiedFunction: (metric: M, ctx: C) => number): Array<ReportingResult<M, T>> {

      return ctx.metrics
          .filter((metric) => {
              const metricId = (metric as any).id;
              return !metricId || this.hasChanged(metricId, lastModifiedFunction(metric, ctx), ctx.date.getTime());
          })
          .map((metric) => ({
              metric,
              result: reportFunction(metric, ctx),
          }))
          .filter((result) => !!result.result);
  }

  /**
   * Handles the reporting result for a group of metric instances.
   *
   * @protected
   * @abstract
   * @param {OverallReportContext} ctx
   * @param {MetricRegistry | null} registry
   * @param {Date} date
   * @param {MetricType} type
   * @param {Array<ReportingResult<any, T>>} results
   * @returns {Promise<void>}
   * @memberof MetricReporter
   */
  protected abstract handleResults(
      ctx: OverallReportContext,
      registry: MetricRegistry | null,
      date: Date,
      type: MetricType,
      results: Array<ReportingResult<any, T>>): Promise<void>;

  /**
   * Does the reporting for a counter or monotone counter.
   *
   * @protected
   * @abstract
   * @param {(MonotoneCounter | Counter)} counter
   * @param {(MetricSetReportContext<MonotoneCounter | Counter>)} ctx
   * @returns {T}
   * @memberof MetricReporter
   */
  protected abstract reportCounter(
      counter: MonotoneCounter | Counter, ctx: MetricSetReportContext<MonotoneCounter | Counter>): T;

  /**
   * Does the reporting for a gauge.
   *
   * @protected
   * @abstract
   * @param {Gauge<any>} gauge
   * @param {MetricSetReportContext<Gauge<any>>} ctx
   * @returns {T}
   * @memberof MetricReporter
   */
  protected abstract reportGauge(gauge: Gauge<any>, ctx: MetricSetReportContext<Gauge<any>>): T;

  /**
   * Does the reporting for a histogram.
   *
   * @protected
   * @abstract
   * @param {Histogram} histogram
   * @param {MetricSetReportContext<Histogram>} ctx
   * @returns {T}
   * @memberof MetricReporter
   */
  protected abstract reportHistogram(histogram: Histogram, ctx: MetricSetReportContext<Histogram>): T;

  /**
   * Does the reporting for a meter.
   *
   * @protected
   * @abstract
   * @param {Meter} meter
   * @param {MetricSetReportContext<Meter>} ctx
   * @returns {T}
   * @memberof MetricReporter
   */
  protected abstract reportMeter(meter: Meter, ctx: MetricSetReportContext<Meter>): T;

  /**
   * Does the reporting for a timer.
   *
   * @protected
   * @abstract
   * @param {Timer} timer
   * @param {MetricSetReportContext<Timer>} ctx
   * @returns {T}
   * @memberof MetricReporter
   */
  protected abstract reportTimer(timer: Timer, ctx: MetricSetReportContext<Timer>): T;

  /**
   * Determines if a metric instance has changed it's value since the last check.
   * This is always true if the minimal-reporting timeout was reached.
   *
   * @private
   * @param {number} metricId
   * @param {number} lastValue
   * @param {number} date
   * @returns {boolean}
   * @memberof MetricReporter
   */
  protected hasChanged(metricId: number, lastValue: number, date: number): boolean {
      let changed = true;
      let metricEntry = {
          lastReport: 0,
          lastValue,
      };
      if (this.metricStates.has(metricId)) {
          metricEntry = this.metricStates.get(metricId);
          changed = metricEntry.lastValue !== lastValue;
          if (!changed) {
              const minReportingTimeout = MINUTE.convertTo(this.options.minReportingTimeout, MILLISECOND);
              changed = metricEntry.lastReport + minReportingTimeout < date;
          }
      }
      if (changed) {
          metricEntry.lastReport = date;
          metricEntry.lastValue = lastValue;
      }
      this.metricStates.set(metricId, metricEntry);
      return changed;
  }

  /**
   * Combines the tags of this reporter instance, the specified {@link MetricRegistry}
   * and the specified taggable metric (in this order).
   *
   * @protected
   * @param {MetricRegistry | null} registry
   * @param {Taggable} taggable
   * @returns {Tags}
   * @memberof MetricReporter
   */
  protected buildTags(registry: MetricRegistry | null, taggable: Taggable): Tags {
      const tags: Tags = {};
      if (this.options.tags) {
          this.options.tags.forEach((tag, key) => tags[key] = tag);
      }
      if (registry && registry.getTags()) {
          registry.getTags().forEach((tag, key) => tags[key] = tag);
      }
      if (taggable) {
          const customTags = getMetricTags(taggable);
          Object.keys(customTags).forEach((key) => tags[key] = customTags[key]);
      }
      return tags;
  }

  /**
   * Checks the number and gives it back or zero (0) if it's not a number.
   *
   * @protected
   * @param {number} value
   * @returns {number}
   * @memberof MetricReporter
   */
  protected getNumber(value: number): number {
      if (isNaN(value)) {
          return 0;
      }
      return value;
  }

}
