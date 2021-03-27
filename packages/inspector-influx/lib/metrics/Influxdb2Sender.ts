import 'source-map-support/register'

import { ClientOptions, InfluxDB, Point, WriteApi, WriteOptions, WritePrecisionType } from '@influxdata/influxdb-client'
import { BucketsAPI, OrgsAPI, RetentionRules } from '@influxdata/influxdb-client-apis'
import { MeasurementPoint, Sender } from './InfluxMetricReporter'

/**
 * Implementation for influxdb2.
 *
 * @export
 * @class Influxdb2Sender
 * @implements {Sender}
 */
export class Influxdb2Sender implements Sender {
  /**
   * The influxdb client instance.
   *
   * @private
   * @type {InfluxDB}
   * @memberof Influxdb2Sender
   */
  private readonly db: InfluxDB;
  /**
   * Write Api instance.
   *
   * @private
   * @type {WriteApi}
   * @memberof Influxdb2Sender
   */
  private readonly writeApi: WriteApi;
  /**
   * Default setting for data retention.
   *
   * @private
   * @type {RetentionRules}
   * @memberof Influxdb2Sender
   */
  private readonly retentionRules: RetentionRules;
  /**
   * Name of the bucket.
   *
   * @private
   * @type {string}
   * @memberof Influxdb2Sender
   */
  private readonly bucket: string;
  /**
   * Name of the organization.
   *
   * @private
   * @type {string}
   * @memberof Influxdb2Sender
   */
   private readonly org: string;
  /**
   * Indicates if he sender is ready to report metrics.
   *
   * @private
   * @type {boolean}
   * @memberof Influxdb2Sender
   */
  private ready: boolean = false;

  /**
   * Creates an instance of Influxdb2Sender.
   *
   * @param {(ClientOptions | string)} config
   * @param {string} org
   * @param {string} bucket
   * @param {RetentionRules} [retentionRules=[]]
   * @param {WritePrecisionType} [precision='s']
   * @param {Partial<WriteOptions>} [writeOptions]
   * @memberof Influxdb2Sender
   */
  public constructor (
    config: ClientOptions | string,
    org: string,
    bucket: string,
    retentionRules: RetentionRules = [],
    precision: WritePrecisionType = 's',
    writeOptions?: Partial<WriteOptions>) {
    this.org = org
    this.bucket = bucket
    this.retentionRules = retentionRules
    this.db = new InfluxDB(config)
    this.writeApi = this.db.getWriteApi(this.org, this.bucket, precision, writeOptions)
  }

  /**
   * Ensures that the organization and bucket exists before sending data.
   *
   * @memberof Influxdb2Sender
   */
  public async init (): Promise<any> {
    const orgsAPI = new OrgsAPI(this.db)
    const {
      orgs: [org],
    } = await orgsAPI.getOrgs({
      org: this.org,
    })

    const bucketsAPI = new BucketsAPI(this.db)
    const {
      buckets: [bucket],
    } = await bucketsAPI.getBuckets({
      orgID: org.id,
      name: this.bucket,
    })

    if (!bucket) {
      await bucketsAPI.postBuckets({
        body: {
          retentionRules: this.retentionRules,
          orgID: org.id,
          name: this.bucket,
        },
      })
    }
    this.ready = true
  }

  /**
   * Gets the ready state.
   *
   * @returns {Promise<boolean>}
   * @memberof Influxdb2Sender
   */
  public async isReady (): Promise<boolean> {
    return this.ready
  }

  /**
   * Sends the specified data points to the DB and flushes the write-api instance.
   *
   * @param {MeasurementPoint[]} points
   * @memberof Influxdb2Sender
   */
  public async send (points: MeasurementPoint[]): Promise<void> {
    await this.writeApi.writePoints(points.map(point => {
        const newPoint = new Point(point.measurement)
          .timestamp(point.timestamp)

        for (const fieldName in point.fields) {
          newPoint.fields[fieldName] = `${point.fields[fieldName]}`
        }

        for (const tag in point.tags) {
          newPoint.tag(tag, point.tags[tag])
        }

        return newPoint
      }))
    await this.writeApi.flush()
  }
}
