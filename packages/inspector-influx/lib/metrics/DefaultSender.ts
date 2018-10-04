import { IClusterConfig, InfluxDB, IPoint } from "influx";
import { Sender } from "./InfluxMetricReporter";

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
    private db: InfluxDB;
    /**
     * Influx client configuration object.
     *
     * @private
     * @type {IClusterConfig}
     * @memberof DefaultSender
     */
    private config: IClusterConfig;
    /**
     * Indicates if he sender is ready to report metrics.
     *
     * @private
     * @type {boolean}
     * @memberof DefaultSender
     */
    private ready: boolean = false;

    /**
     * Creates an instance of DefaultSender.
     *
     * @param {IClusterConfig} config
     * @memberof DefaultSender
     */
    public constructor(config: IClusterConfig) {
        this.config = config;
        this.db = new InfluxDB(config);
    }

    /**
     * Ensures that a database is existing before sending data.
     *
     * @memberof DefaultSender
     */
    public async init() {
        const database = this.config.database;
        const names = await this.db.getDatabaseNames();
        if (!names.find((value: string, index: number, arr: string[]) => value.localeCompare(database) === 0)) {
            await this.db.createDatabase(database);
        }
        this.ready = true;
    }

    /**
     * Gets the ready state.
     *
     * @returns {Promise<boolean>}
     * @memberof DefaultSender
     */
    public async isReady(): Promise<boolean> {
        return this.ready;
    }

    /**
     * Sends the specified data points to the DB.
     *
     * @param {IPoint[]} points
     * @memberof DefaultSender
     */
    public async send(points: IPoint[]) {
        await this.db.writePoints(points);
    }

}
