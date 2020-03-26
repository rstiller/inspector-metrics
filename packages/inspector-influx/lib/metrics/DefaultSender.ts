import 'source-map-support/register'

import { IClusterConfig, InfluxDB, IPoint, TimePrecision } from 'influx'
import { Sender } from './InfluxMetricReporter'

/**
 * Default implementation for an influxdb sender.
 *
 * @export
 * @class DefaultSender
 * @implements {Sender}
 */
export class DefaultSender implements Sender {
  /**
   * The influxdb client instance.
   *
   * @private
   * @type {InfluxDB}
   * @memberof DefaultSender
   */
  private readonly db: InfluxDB;
  /**
   * Influx client configuration object.
   *
   * @private
   * @type {IClusterConfig}
   * @memberof DefaultSender
   */
  private readonly config: IClusterConfig;
  /**
   * Indicates if he sender is ready to report metrics.
   *
   * @private
   * @type {boolean}
   * @memberof DefaultSender
   */
  private ready: boolean = false;
  /**
   * Defines the precision for the write operations.
   *
   * @private
   * @type {TimePrecision}
   * @memberof DefaultSender
   */
  private readonly precision: TimePrecision;

  /**
   * Creates an instance of DefaultSender.
   *
   * @param {IClusterConfig} config
   * @param {TimePrecision} [precision="s"] will be passed to write-options
   * @memberof DefaultSender
   */
  public constructor (config: IClusterConfig, precision: TimePrecision = 's') {
    this.config = config
    this.precision = precision
    this.db = new InfluxDB(config)
  }

  /**
   * Ensures that a database is existing before sending data.
   *
   * @memberof DefaultSender
   */
  public async init (): Promise<any> {
    const database = this.config.database
    const databases = await this.db.getDatabaseNames()
    if ((databases instanceof String && databases.localeCompare(database) !== 0) ||
      (databases instanceof Array &&
        !databases.find((value: string, index: number, arr: string[]) =>
          value.localeCompare(database) === 0))) {
      await this.db.createDatabase(database)
    }
    this.ready = true
  }

  /**
   * Gets the ready state.
   *
   * @returns {Promise<boolean>}
   * @memberof DefaultSender
   */
  public async isReady (): Promise<boolean> {
    return this.ready
  }

  /**
   * Sends the specified data points to the DB.
   *
   * @param {IPoint[]} points
   * @memberof DefaultSender
   */
  public async send (points: IPoint[]): Promise<void> {
    await this.db.writePoints(points, { precision: this.precision })
  }
}
