import 'source-map-support/register'

import { Clock, diff, Time } from './clock'
import { Metered, MeteredRates, SerializableMetered } from './model/metered'
import { BaseMetric } from './model/metric'
import { ExponentiallyWeightedMovingAverage, MovingAverage } from './model/moving-average'
import { NANOSECOND, SECOND } from './model/time-unit'

/**
 * Standard implementation of a rate-measuring metrics.
 *
 * @export
 * @class Meter
 * @extends {BaseMetric}
 * @implements {Metered}
 */
export class Meter extends BaseMetric implements Metered, SerializableMetered {
  /**
   * Alpha value for 1 min within a {@link ExponentiallyWeightedMovingAverage}.
   *
   * @private
   * @static
   * @memberof Meter
   */
  private static readonly AVG_1_MINUTE = ExponentiallyWeightedMovingAverage.ALPHA_1_MINUTE_1_SECOND_SAMPLERATE;
  /**
   * Alpha value for 5 mins within a {@link ExponentiallyWeightedMovingAverage}.
   *
   * @private
   * @static
   * @memberof Meter
   */
  private static readonly AVG_5_MINUTE = ExponentiallyWeightedMovingAverage.ALPHA_5_MINUTE_1_SECOND_SAMPLERATE;
  /**
   * Alpha value for 15 mins within a {@link ExponentiallyWeightedMovingAverage}.
   *
   * @private
   * @static
   * @memberof Meter
   */
  private static readonly AVG_15_MINUTE = ExponentiallyWeightedMovingAverage.ALPHA_15_MINUTE_1_SECOND_SAMPLERATE;
  /**
   * 1 second in nanoseconds.
   *
   * @private
   * @static
   * @memberof Meter
   */
  private static readonly SECOND_1_NANOS = SECOND.convertTo(1, NANOSECOND);

  /**
   * Clock used to determine if a new update of the averages is needed.
   *
   * @private
   * @type {Clock}
   * @memberof Meter
   */
  private readonly clock: Clock;
  /**
   * Starttime as a reference for calculating the mean-rate.
   *
   * @private
   * @type {Time}
   * @memberof Meter
   */
  private readonly startTime: Time;
  /**
   * Timestamp used to determine when a new update of the 1, 5 and 15 mins averages is needed.
   *
   * @private
   * @type {Time}
   * @memberof Meter
   */
  private lastTime: Time;
  /**
   * Continuous counter incremented in the {@link Meter#mark} method.
   *
   * @private
   * @type {number}
   * @memberof Meter
   */
  private countInternal: number = 0;
  /**
   * Number of samples per second.
   *
   * @private
   * @type {number}
   * @memberof Meter
   */
  private readonly sampleRate: number;
  /**
   * Max age of the last update in nanoseconds.
   *
   * @private
   * @type {number}
   * @memberof Meter
   */
  private readonly interval: number;
  /**
   * Moving average for 1 minute.
   *
   * @private
   * @type {MovingAverage}
   * @memberof Meter
   */
  private readonly avg1Minute: MovingAverage = new ExponentiallyWeightedMovingAverage(Meter.AVG_1_MINUTE, 1, SECOND);
  /**
   * Moving average for 5 minutes.
   *
   * @private
   * @type {MovingAverage}
   * @memberof Meter
   */
  private readonly avg5Minute: MovingAverage = new ExponentiallyWeightedMovingAverage(Meter.AVG_5_MINUTE, 1, SECOND);
  /**
   * Moving average for 15 minutes.
   *
   * @private
   * @type {MovingAverage}
   * @memberof Meter
   */
  private readonly avg15Minute: MovingAverage = new ExponentiallyWeightedMovingAverage(Meter.AVG_15_MINUTE, 1, SECOND);

  /**
   * Creates an instance of Meter.
   *
   * @param {Clock} clock Clock to determine update events.
   * @param {number} sampleRate number of samples per seconds.
   * @param {string} [name] optional metric name.
   * @param {string} [description] optional metric description.
   * @memberof Meter
   */
  public constructor (clock: Clock, sampleRate: number, name?: string, description?: string) {
    super()
    this.name = name
    this.description = description
    this.clock = clock
    this.startTime = clock.time()
    this.lastTime = this.startTime
    this.sampleRate = sampleRate
    this.interval = Meter.SECOND_1_NANOS / this.sampleRate
  }

  /**
   * Gets the count of event reported.
   *
   * @readonly
   * @type {number}
   * @memberof Meter
   */
  public get count (): number {
    return this.getCount()
  }

  /**
   * Getter method for mean-rate
   *
   * @readonly
   * @type {number}
   * @memberof Meter
   */
  public get meanRate (): number {
    return this.getMeanRate()
  }

  /**
   * Getter method for rates 'snapshot'
   *
   * @readonly
   * @type {MeteredRates}
   * @memberof Meter
   */
  public get rates (): MeteredRates {
    return {
      15: this.get15MinuteRate(),
      5: this.get5MinuteRate(),
      1: this.get1MinuteRate()
    }
  }

  /**
   * Increases the counter and updates the averages.
   *
   * @param {number} value
   * @returns {this}
   * @memberof Meter
   */
  public mark (value: number): this {
    this.tickIfNeeded()
    this.countInternal += value
    this.avg15Minute.update(value)
    this.avg5Minute.update(value)
    this.avg1Minute.update(value)
    return this
  }

  /**
   * Gets the number of events.
   *
   * @returns {number}
   * @memberof Meter
   */
  public getCount (): number {
    return this.countInternal
  }

  /**
   * Updates the 15 minutes average if needed and returns the rate per second.
   *
   * @returns {number}
   * @memberof Meter
   */
  public get15MinuteRate (): number {
    this.tickIfNeeded()
    return this.avg15Minute.getAverage(SECOND)
  }

  /**
   * Updates the 5 minutes average if needed and returns the rate per second.
   *
   * @returns {number}
   * @memberof Meter
   */
  public get5MinuteRate (): number {
    this.tickIfNeeded()
    return this.avg5Minute.getAverage(SECOND)
  }

  /**
   * Updates the 1 minute average if needed and returns the rate per second.
   *
   * @returns {number}
   * @memberof Meter
   */
  public get1MinuteRate (): number {
    this.tickIfNeeded()
    return this.avg1Minute.getAverage(SECOND)
  }

  /**
   * Gets the mean rate : {@link Meter#count} divided through seconds passed since {@link Meter#startTime}).
   *
   * @returns {number} either 0 or the mean rate.
   * @memberof Meter
   */
  public getMeanRate (): number {
    if (this.countInternal === 0) {
      return 0.0
    } else {
      const elapsed: number = diff(this.startTime, this.clock.time())
      return this.countInternal / elapsed * Meter.SECOND_1_NANOS
    }
  }

  /**
   * Same as {@link BaseMetric#toJSON()}, also adding count property.
   *
   * @returns {*}
   * @memberof Meter
   */
  public toJSON (): any {
    const json = super.toJSON()
    json.count = this.countInternal
    json.meanRate = this.meanRate
    json.rates = this.rates
    return json
  }

  /**
   * Calls the {@link MovingAverage#tick} for each tick.
   *
   * @private
   * @param {number} ticks number of updates.
   * @memberof Meter
   */
  private tick (ticks: number): void {
    while (ticks-- > 0) {
      this.avg15Minute.tick()
      this.avg5Minute.tick()
      this.avg1Minute.tick()
    }
  }

  /**
   * Checks for if an update of the averages is needed and if so updates the {@link Meter#lastTime}.
   *
   * @private
   * @memberof Meter
   */
  private tickIfNeeded (): void {
    const currentTime: Time = this.clock.time()
    const age: number = diff(this.lastTime, currentTime)
    if (age > this.interval) {
      this.lastTime = currentTime
      this.tick(Math.floor(age / this.interval))
    }
  }
}
