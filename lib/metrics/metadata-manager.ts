import "source-map-support/register";

export class MetadataManager {
  private metadata: Map<string, any> = new Map();

  public getMetadataMap(): Map<string, any> {
    return this.metadata;
  }

  public getMetadata<T>(name: string): T {
    return this.metadata.get(name) as T;
  }

  public removeMetadata<T>(name: string): T {
    const value = this.metadata.get(name) as T;
    this.metadata.delete(name);
    return value;
  }

  public setMetadata<T>(name: string, value: T): this {
    this.metadata.set(name, value);
    return this;
  }
}
