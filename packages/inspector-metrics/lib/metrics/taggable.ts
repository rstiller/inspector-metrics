
import "source-map-support/register";

export class Taggable {

    private tags: Map<string, string> = new Map();

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
