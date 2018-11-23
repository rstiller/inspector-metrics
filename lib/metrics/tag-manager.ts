import "source-map-support/register";

export class TagManager {
  private tags: Map<string, string> = new Map();

  public getTags(): Map<string, string> {
    return this.tags;
  }

  public getTag(name: string): string | undefined {
    return this.tags.get(name);
  }

  public setTag(name: string, value: string): this {
    this.tags.set(name, value);
    return this;
  }

  public removeTag(name: string): this {
    this.tags.delete(name);
    return this;
  }
}
