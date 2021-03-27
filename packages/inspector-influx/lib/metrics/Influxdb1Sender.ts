import 'source-map-support/register'

import { IClusterConfig, InfluxDB, IPoint, TimePrecision } from 'influx'
import { Sender } from './InfluxMetricReporter'

/**
 * Default implementation for an influxdb sender.
 *
 * @export
 * @class Influxdb1Sender
 * @implements {Sender}
 */
export class Influxdb1Sender implements Sender {
  /**
   * The influxdb client instance.
   *
   * @private
   * @type {InfluxDB}
   * @memberof Influxdb1Sender
   */
  private readonly db: InfluxDB;
  /**
   * Influx client configuration object.
   *
   * @private
   * @type {IClusterConfig}
   * @memberof Influxdb1Sender
   */
  private readonly config: IClusterConfig;
  /**
   * Indicates if he sender is ready to report metrics.
   *
   * @private
   * @type {boolean}
   * @memberof Influxdb1Sender
   */
  private ready: boolean = false;
  /**
   * Defines the precision for the write operations.
   *
   * @private
   * @type {TimePrecision}
   * @memberof Influxdb1Sender
   */
  private readonly precision: TimePrecision;

  /**
   * Creates an instance of Influxdb1Sender.
   *
   * @param {IClusterConfig} config
   * @param {TimePrecision} [precision="s"] will be passed to write-options
   * @memberof Influxdb1Sender
   */
  public constructor (config: IClusterConfig, precision: TimePrecision = 's') {
    this.config = config
    this.precision = precision
    this.db = new InfluxDB(config)
  }

  /**
   * Ensures that a database is existing before sending data.
   *
   * @memberof Influxdb1Sender
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
   * @memberof Influxdb1Sender
   */
  public async isReady (): Promise<boolean> {
    return this.ready
  }

  /**
   * Sends the specified data points to the DB.
   *
   * @param {IPoint[]} points
   * @memberof Influxdb1Sender
   */
  public async send (points: IPoint[]): Promise<void> {
    await this.db.writePoints(points, { precision: this.precision })
  }
}
