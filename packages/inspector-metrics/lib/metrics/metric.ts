
import "source-map-support/register";

import { IGroupable } from "./groupable";
import { ITaggable } from "./taggable";

export interface Metric extends IGroupable, ITaggable {
}

export abstract class BaseMetric implements Metric {

    protected tags: Map<string, string> = new Map();
    protected group: string;

    public getGroup(): string {
        return this.group;
    }

    public setGroup(group: string): void {
        this.group = group;
    }

    public getTags(): Map<string, string> {
        return this.tags;
    }

    public getTag(name: string): string {
        return this.tags.get(name);
    }

    public setTag(name: string, value: string): void {
        this.tags.set(name, value);
    }

    public removeTag(name: string): void {
        this.tags.delete(name);
    }

}
