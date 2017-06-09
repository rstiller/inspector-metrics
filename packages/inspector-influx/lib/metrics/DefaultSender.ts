import { IClusterConfig, InfluxDB, IPoint } from "influx";
import { Sender } from "./InfluxMetricReporter";

export class DefaultSender implements Sender {

    private db: InfluxDB;
    private config: IClusterConfig;
    private ready: boolean = false;

    public constructor(config: IClusterConfig) {
        this.config = config;
        this.db = new InfluxDB(config);
    }

    public async init() {
        const database = this.config.database;
        const names = await this.db.getDatabaseNames();
        if (!names.find((value: string, index: number, arr: string[]) => value.localeCompare(database) === 0)) {
            await this.db.createDatabase(database);
        }
        this.ready = true;
    }

    public async isReady(): Promise<boolean> {
        return this.ready;
    }

    public async send(points: IPoint[]) {
        await this.db.writePoints(points);
    }

}
