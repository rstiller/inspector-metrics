import 'source-map-support/register'

import {
  BaseMetric,
  Metric,
  MetricSet,
  Scheduler,
  SimpleGauge
} from 'inspector-metrics'

/**
 * Metric set with values related to the nodejs event loop.
 *
 * @export
 * @class V8EventLoop
 * @extends {BaseMetric}
 * @implements {MetricSet}
 */
export class V8EventLoop extends BaseMetric implements MetricSet {
  /**
   * Contains all the metrics in this metric-set.
   *
   * @private
   * @type {Metric[]}
   * @memberof V8EventLoop
   */
  private readonly metrics: Metric[] = [];
  /**
   * Holds the event-loop lag in microseconds.
   *
   * @private
   * @type {SimpleGauge}
   * @memberof V8EventLoop
   */
  private readonly eventLoopLag: SimpleGauge;
  /**
   * The timer reference from the scheduler.
   *
   * @private
   * @type {NodeJS.Timer}
   * @memberof V8EventLoop
   */
  private readonly timer: NodeJS.Timer;

  /**
   * Creates an instance of V8EventLoop.
   *
   * @param {string} name
   * @param {Scheduler} [scheduler=setInterval]
   * @memberof V8EventLoop
   */
  public constructor (name: string, scheduler: Scheduler = setInterval) {
    super()
    this.name = name

    this.eventLoopLag = new SimpleGauge(
      'lag',
      'measures the duration between committing a function to the event loop and the function being executed'
    )

    this.metrics.push(this.eventLoopLag)
    this.timer = scheduler(async () => {
      setImmediate((start) => this.reportEventloopLag(start), process.hrtime())
    }, 500)
  }

  /**
   * Stops the recording of event-loop metrics.
   *
   * @memberof V8EventLoop
   */
  public stop (): void {
    if (this.timer) {
      this.timer.unref()
    }
  }

  /**
   * Gets all metrics.
   *
   * @returns {Map<string, Metric>}
   * @memberof V8EventLoop
   */
  public getMetrics (): Map<string, Metric> {
    const map: Map<string, Metric> = new Map()
    this.metrics.forEach((metric) => map.set(metric.getName(), metric))
    return map
  }

  /**
   * Gets all metrics.
   *
   * @returns {Metric[]}
   * @memberof V8EventLoop
   */
  public getMetricList (): Metric[] {
    return this.metrics
  }

  /**
   * Sets the group of this metric-set as well as all contained metrics.
   *
   * @param {string} group
   * @returns {this}
   * @memberof V8EventLoop
   */
  public setGroup (group: string): this {
    this.group = group
    this.eventLoopLag.setGroup(group)
    return this
  }

  /**
   * Sets the tags of this metric-set all contained metrics accordingly.
   *
   * @param {string} name
   * @param {string} value
   * @returns {this}
   * @memberof V8EventLoop
   */
  public setTag (name: string, value: string): this {
    this.tagMap.set(name, value)
    this.eventLoopLag.setTag(name, value)
    return this
  }

  /**
   * Removes the specified tag from this metric-set and all contained metrics accordingly.
   *
   * @param {string} name
   * @returns {this}
   * @memberof V8EventLoop
   */
  public removeTag (name: string): this {
    this.tagMap.delete(name)
    this.eventLoopLag.removeTag(name)
    return this
  }

  /**
   * Reports the event-loop lag.
   *
   * @private
   * @param {[number, number]} start
   * @memberof V8EventLoop
   */
  private reportEventloopLag (start: [number, number]): void {
    const delta = process.hrtime(start)
    const nanosec = delta[0] * 1e9 + delta[1]
    this.eventLoopLag.setValue(nanosec)
  }
}
