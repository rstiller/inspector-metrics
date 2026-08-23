import 'source-map-support/register'

import { BaseMetric, Clock, DefaultReservoir, Metric, MetricSet, NANOSECOND, Timer } from 'inspector-metrics'

import { constants, NodeGCPerformanceDetail, PerformanceEntry, PerformanceObserver } from 'node:perf_hooks'

/**
 * Metric set with values related to nodejs GC.
 *
 * @export
 * @class V8GCMetrics
 * @extends {BaseMetric}
 * @implements {MetricSet}
 */
export class V8GCMetrics extends BaseMetric implements MetricSet {
  /**
   * Contains all the metrics in this metric-set.
   *
   * @private
   * @type {Metric[]}
   * @memberof V8GCMetrics
   */
  private readonly metrics: Metric[] = []
  /**
   * Timer for the gc minor runs.
   *
   * @private
   * @type {Timer}
   * @memberof V8GCMetrics
   */
  private readonly minorRuns: Timer
  /**
   * Timer for the gc major runs.
   *
   * @private
   * @type {Timer}
   * @memberof V8GCMetrics
   */
  private readonly majorRuns: Timer
  /**
   * Timer for the gc incremental marking runs.
   *
   * @private
   * @type {Timer}
   * @memberof V8GCMetrics
   */
  private readonly incrementalMarkingRuns: Timer
  /**
   * Timer for the gc callback processing runs.
   *
   * @private
   * @type {Timer}
   * @memberof V8GCMetrics
   */
  private readonly phantomCallbackProcessingRuns: Timer
  /**
   * Timer for all gc runs.
   *
   * @private
   * @type {Timer}
   * @memberof V8GCMetrics
   */
  private readonly allRuns: Timer
  /**
   * Garbage collection data observer.
   *
   * @private
   * @type {PerformanceObserver}
   * @memberof V8GCMetrics
   */
  private readonly gc: PerformanceObserver

  /**
   * Creates an instance of V8GCMetrics.
   *
   * @param {string} name
   * @param {Clock} clock
   * @memberof V8GCMetrics
   */
  public constructor(name: string, clock: Clock) {
    super()
    this.name = name

    this.minorRuns = new Timer(clock, new DefaultReservoir(1024), 'runs')
    this.minorRuns.setTag('type', 'minor')

    this.majorRuns = new Timer(clock, new DefaultReservoir(1024), 'runs')
    this.majorRuns.setTag('type', 'major')

    this.incrementalMarkingRuns = new Timer(clock, new DefaultReservoir(1024), 'runs')
    this.incrementalMarkingRuns.setTag('type', 'IncrementalMarking')

    this.phantomCallbackProcessingRuns = new Timer(clock, new DefaultReservoir(1024), 'runs')
    this.phantomCallbackProcessingRuns.setTag('type', 'PhantomCallbackProcessing')

    this.allRuns = new Timer(clock, new DefaultReservoir(1024), 'runs')
    this.allRuns.setTag('type', 'all')

    this.metrics.push(this.allRuns)
    this.metrics.push(this.incrementalMarkingRuns)
    this.metrics.push(this.majorRuns)
    this.metrics.push(this.minorRuns)
    this.metrics.push(this.phantomCallbackProcessingRuns)

    const slf = this
    this.gc = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        slf.handleGCEntry(entry)
      }
    })
    this.gc.observe({ entryTypes: ['gc'] })
  }

  /**
   * Processes a single GC performance entry.
   *
   * @param {PerformanceEntry} entry
   * @memberof V8GCMetrics
   */
  private handleGCEntry(entry: PerformanceEntry): void {
    const duration = Math.round(entry.duration * 1e6)
    const gcEntry = entry as PerformanceEntry & {
      detail?: NodeGCPerformanceDetail
      kind?: number
    }
    const gcType = gcEntry.detail?.kind ?? gcEntry.kind

    switch (gcType) {
      case constants.NODE_PERFORMANCE_GC_MINOR:
        this.minorRuns.addDuration(duration, NANOSECOND)
        break
      case constants.NODE_PERFORMANCE_GC_MAJOR:
        this.majorRuns.addDuration(duration, NANOSECOND)
        break
      case constants.NODE_PERFORMANCE_GC_INCREMENTAL:
        this.incrementalMarkingRuns.addDuration(duration, NANOSECOND)
        break
      case constants.NODE_PERFORMANCE_GC_WEAKCB:
        this.phantomCallbackProcessingRuns.addDuration(duration, NANOSECOND)
        break
      case 15:
        this.allRuns.addDuration(duration, NANOSECOND)
        break
    }
  }

  /**
   * Stops the recording of gc metrics.
   *
   * @memberof V8GCMetrics
   */
  public stop(): void {
    this.gc.disconnect()
  }

  /**
   * Gets all metrics.
   *
   * @returns {Map<string, Metric>}
   * @memberof V8GCMetrics
   */
  public getMetrics(): Map<string, Metric> {
    const map: Map<string, Metric> = new Map()
    this.metrics.forEach((metric) => map.set(metric.getName(), metric))
    return map
  }

  /**
   * Gets all metrics.
   *
   * @returns {Metric[]}
   * @memberof V8GCMetrics
   */
  public getMetricList(): Metric[] {
    return this.metrics
  }

  /**
   * Sets the group of this metric-set as well as all contained metrics.
   *
   * @param {string} group
   * @returns {this}
   * @memberof V8GCMetrics
   */
  public setGroup(group: string): this {
    this.group = group
    this.allRuns.setGroup(group)
    this.incrementalMarkingRuns.setGroup(group)
    this.majorRuns.setGroup(group)
    this.minorRuns.setGroup(group)
    this.phantomCallbackProcessingRuns.setGroup(group)
    return this
  }

  /**
   * Sets the tags of this metric-set all contained metrics accordingly.
   *
   * @param {string} name
   * @param {string} value
   * @returns {this}
   * @memberof V8GCMetrics
   */
  public setTag(name: string, value: string): this {
    this.tagMap.set(name, value)
    this.allRuns.setTag(name, value)
    this.incrementalMarkingRuns.setTag(name, value)
    this.majorRuns.setTag(name, value)
    this.minorRuns.setTag(name, value)
    this.phantomCallbackProcessingRuns.setTag(name, value)
    return this
  }

  /**
   * Removes the specified tag from this metric-set and all contained metrics accordingly.
   *
   * @param {string} name
   * @returns {this}
   * @memberof V8GCMetrics
   */
  public removeTag(name: string): this {
    this.tagMap.delete(name)
    this.allRuns.removeTag(name)
    this.incrementalMarkingRuns.removeTag(name)
    this.majorRuns.removeTag(name)
    this.minorRuns.removeTag(name)
    this.phantomCallbackProcessingRuns.removeTag(name)
    return this
  }
}
