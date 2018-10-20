import "source-map-support";

import * as async from "async";
import { appendFile, mkdir, stat, Stats } from "fs";
import { join } from "path";

import { Metric } from "inspector-metrics";
import moment = require("moment");
import { CsvFileWriter } from "./CsvMetricReporter";

/**
 * Options for standard implementation for a csv file writer.
 *
 * @export
 * @class DefaultCsvFileWriterOptions
 */
export class DefaultCsvFileWriterOptions {

    /**
     * Determines if the column headers should be written at the top of each file.
     *
     * @type {boolean}
     * @memberof DefaultCsvFileWriterOptions
     */
    public readonly writeHeaders: boolean;
    /**
     * Determines if the dir for the metrics reportig should be created if it doesn't exist.
     *
     * @type {boolean}
     * @memberof DefaultCsvFileWriterOptions
     */
    public readonly createDir: boolean;
    /**
     * The delimiter between the fields.
     *
     * @type {string}
     * @memberof DefaultCsvFileWriterOptions
     */
    public readonly delimiter: string;
    /**
     * The encoding of the file.
     *
     * @type {string}
     * @memberof DefaultCsvFileWriterOptions
     */
    public readonly encoding: string;
    /**
     * The line endings in the file.
     *
     * @type {string}
     * @memberof DefaultCsvFileWriterOptions
     */
    public readonly lineEnding: string;
    /**
     * An async function determining the filename of the metrics.
     *
     * @memberof DefaultCsvFileWriterOptions
     */
    public readonly filename: () => Promise<string>;
    /**
     * An async function determining the directory of the metricsfile.
     *
     * @memberof DefaultCsvFileWriterOptions
     */
    public readonly dir: () => Promise<string>;

    /**
     * Creates an instance of DefaultCsvFileWriterOptions.
     *
     * @param {{
     *         writeHeaders?: boolean,
     *         createDir?: boolean,
     *         delimiter?: string,
     *         encoding?: string,
     *         lineEnding?: string,
     *         filename?: () => Promise<string>,
     *         dir?: () => Promise<string>,
     *     }} {
     *         filename = async () => `${moment().format("YYYYMMDDHH00")}_metrics.csv`,
     *         dir = async () => "./metrics",
     *         writeHeaders = true,
     *         createDir = true,
     *         delimiter =  ",",
     *         encoding =  "utf8",
     *         lineEnding =  "\n",
     *     }
     * @memberof DefaultCsvFileWriterOptions
     */
    public constructor({
        filename = async () => `${moment().format("YYYYMMDDHH00")}_metrics.csv`,
        dir = async () => "./metrics",
        writeHeaders = true,
        createDir = true,
        delimiter =  ",",
        encoding =  "utf8",
        lineEnding =  "\n",
    }: {
        /**
         * Determines if the column headers should be written at the top of each file.
         *
         * @type {boolean}
         */
        writeHeaders?: boolean,
        /**
         * Determines if the dir for the metrics reportig should be created if it doesn't exist.
         *
         * @type {boolean}
         */
        createDir?: boolean,
        /**
         * The delimiter between the fields.
         *
         * @type {string}
         */
        delimiter?: string,
        /**
         * The encoding of the file.
         *
         * @type {string}
         */
        encoding?: string,
        /**
         * The line endings in the file.
         *
         * @type {string}
         */
        lineEnding?: string,
        /**
         * An async function determining the filename of the metrics.
         */
        filename?: () => Promise<string>,
        /**
         * An async function determining the directory of the metricsfile.
         */
        dir?: () => Promise<string>,
    }) {
        this.createDir = createDir;
        this.writeHeaders = writeHeaders;
        this.delimiter = delimiter;
        this.encoding = encoding;
        this.lineEnding = lineEnding;
        this.filename = filename;
        this.dir = dir;
    }
}

/**
 * Standard implementation for a csv file writer.
 *
 * @export
 * @class DefaultCsvFileWriter
 * @implements {CsvFileWriter}
 */
export class DefaultCsvFileWriter implements CsvFileWriter {

    /**
     * The options for the file writer.
     *
     * @private
     * @type {DefaultCsvFileWriterOptions}
     * @memberof DefaultCsvFileWriter
     */
    private readonly options: DefaultCsvFileWriterOptions;
    /**
     * Holds the current file name to check if the filename has changed
     * and the headers needs to be written.
     *
     * @private
     * @type {string}
     * @memberof DefaultCsvFileWriter
     */
    private currentFilename: string;
    /**
     * Holds the current dir to check if dir has changed
     * and a new one needs to be created as well as the file in it.
     *
     * @private
     * @type {string}
     * @memberof DefaultCsvFileWriter
     */
    private currentDir: string;
    /**
     * Write queue to sync on file writes.
     *
     * @private
     * @type {async.AsyncQueue<any>}
     * @memberof DefaultCsvFileWriter
     */
    private queue: async.AsyncQueue<any>;

    /**
     * Creates an instance of DefaultCsvFileWriter.
     *
     * @param {DefaultCsvFileWriterOptions} options
     * @memberof DefaultCsvFileWriter
     */
    public constructor(options: DefaultCsvFileWriterOptions) {
        this.options = options;
        this.queue = async.queue((task: (clb: () => void) => void, callback: () => void) => {
            task(callback);
        }, 1);
    }

    /**
     * Called on each metrics-report run to ensure the dir & file exist
     * and the headers are written accordingly at the top of the file
     * with respect to the given options.
     *
     * @param {string[]} header
     * @memberof DefaultCsvFileWriter
     */
    public async init(header: string[]) {
        const dir = await this.options.dir();
        const filename = await this.options.filename();

        if (filename !== this.currentFilename || dir !== this.currentDir) {
            let createDir = false;
            if (this.options.createDir === true) {
                try {
                    const stats = await this.stat(dir);
                    createDir = !stats.isDirectory();
                } catch (err) {
                    createDir = true;
                }
            }
            if (createDir) {
                await this.mkdir(dir);
            }

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

    /**
     * Schedules a new write command for the given row fields.
     *
     * @param {Metric} metric
     * @param {string[]} values
     * @memberof DefaultCsvFileWriter
     */
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

    /**
     * Wraps a write command with old-fashion promise to keep compatibility to node js 6.
     *
     * @private
     * @param {string} filename
     * @param {string} data
     * @returns {Promise<void>}
     * @memberof DefaultCsvFileWriter
     */
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

    /**
     * Wraps a mkdir command with old-fashion promise to keep compatibility to node js 6.
     *
     * @private
     * @param {string} dir
     * @returns {Promise<Stats>}
     * @memberof DefaultCsvFileWriter
     */
    private mkdir(dir: string): Promise<Stats> {
        return new Promise<Stats>((resolve, reject) => {
            mkdir(dir, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }

    /**
     * Wraps a stat command with old-fashion promise to keep compatibility to node js 6.
     *
     * @private
     * @param {string} filename
     * @returns {Promise<Stats>}
     * @memberof DefaultCsvFileWriter
     */
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
