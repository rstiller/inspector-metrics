
import "source-map-support/register";

export interface Snapshot {

    get75thPercentile(): number;
    get95thPercentile(): number;
    get98thPercentile(): number;
    get999thPercentile(): number;
    get99thPercentile(): number;
    getMedian(): number;
    getMax(): number;
    getMin(): number;
    getValues(): number[];
    size(): number;
    getMean(): number;
    getStdDev(): number;
    getValue(quantile: number): number;

}

export class SimpleSnapshot implements Snapshot {

    private values: number[] = [];

    public constructor(values: number[]) {
        this.values = values.slice(0, values.length);
        this.values = this.values.sort();
    }

    public get75thPercentile(): number {
        return this.getValue(0.75);
    }

    public get95thPercentile(): number {
        return this.getValue(0.95);
    }

    public get98thPercentile(): number {
        return this.getValue(0.98);
    }

    public get999thPercentile(): number {
        return this.getValue(0.999);
    }

    public get99thPercentile(): number {
        return this.getValue(0.99);
    }

    public getMedian(): number {
        return this.getValue(0.5);
    }

    public getMax(): number {
        return this.values[this.values.length - 1];
    }

    public getMin(): number {
        return this.values[0];
    }

    public getValues(): number[] {
        return this.values;
    }

    public size(): number {
        return this.values.length;
    }

    public getMean(): number {
        if (this.values.length === 0) {
            return 0;
        }

        let sum = 0;
        this.values.forEach((value) => sum += value);
        return sum / this.values.length;
    }

    public getStdDev(): number {
        if (this.values.length === 0) {
            return 0;
        }

        let mean = this.getMean();
        let sum = 0;
        this.values.forEach((value) => {
            let diff = value - mean;
            sum += diff * diff;
        });

        return Math.sqrt(sum / (this.values.length - 1));
    }

    public getValue(quantile: number): number {
        if (quantile < 0.0 || quantile > 1.0 || isNaN(quantile)) {
            return NaN;
        }

        if (this.values.length === 0) {
            return 0;
        }

        let pos = quantile * (this.values.length + 1);
        let index = Math.round(pos);

        if (index < 1) {
            return this.getMin();
        } else if (index >= this.values.length) {
            return this.getMax();
        }

        let lower = this.values[index - 1];
        let upper = this.values[index];
        return lower + (pos - Math.floor(pos)) * (upper - lower);
    }

}
