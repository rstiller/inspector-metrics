import "source-map-support";

import * as async from "async";
import { appendFile, stat, Stats } from "fs";
import { join } from "path";

import { Metric } from "inspector-metrics";
import { CsvFileWriter } from "./CsvMetricReporter";

export class DefaultCsvFileWriterOptions {

    public readonly writeHeaders: boolean;
    public readonly delimiter: string;
    public readonly encoding: string;
    public readonly lineEnding: string;
    public readonly filename: () => Promise<string>;
    public readonly dir: () => Promise<string>;

    public constructor({
        filename = async () => "metrics.csv",
        dir = async () => "/tmp",
        writeHeaders = true,
        delimiter =  ",",
        encoding =  "utf8",
        lineEnding =  "\n",
    }: {
        writeHeaders?: boolean,
        delimiter?: string,
        encoding?: string,
        lineEnding?: string,
        filename?: () => Promise<string>,
        dir?: () => Promise<string>,
    }) {
        this.writeHeaders = writeHeaders;
        this.delimiter = delimiter;
        this.encoding = encoding;
        this.lineEnding = lineEnding;
        this.filename = filename;
        this.dir = dir;
    }
}

export class DefaultCsvFileWriter implements CsvFileWriter {

    private readonly options: DefaultCsvFileWriterOptions;
    private currentFilename: string;
    private currentDir: string;
    private queue: async.AsyncQueue<any>;

    public constructor(options: DefaultCsvFileWriterOptions) {
        this.options = options;
        this.queue = async.queue((task: (clb: () => void) => void, callback: () => void) => {
            task(callback);
        }, 1);
    }

    public async init(header: string[]) {
        const dir = await this.options.dir();
        const filename = await this.options.filename();

        if (filename !== this.currentFilename || dir !== this.currentDir) {
            let writeHeader = false;
            const normalizedFilename = join(dir, filename);
            if (this.options.writeHeaders === true) {
                try {
                    const stats = await this.stat(normalizedFilename);
                    writeHeader = stats.size === 0;
                } catch (err) {
                    writeHeader = true;
                }
            }

            if (writeHeader) {
                await this.write(
                    normalizedFilename,
                    header.join(this.options.delimiter) + this.options.lineEnding,
                );
            }
        }
        this.currentDir = dir;
        this.currentFilename = filename;
    }

    public async writeRow(metric: Metric, values: string[]) {
        const normalizedFilename = join(this.currentDir, this.currentFilename);
        this.queue.push(async (callback: () => void) => {
            await this.write(
                normalizedFilename,
                values.join(this.options.delimiter) + this.options.lineEnding,
            );
            callback();
        });
    }

    private write(filename: string, data: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            appendFile(
                filename,
                data,
                this.options.encoding,
                (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve();
                },
            );
        });
    }

    private stat(filename: string): Promise<Stats> {
        return new Promise<Stats>((resolve, reject) => {
            stat(filename, (err, stats) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(stats);
            });
        });
    }

}
