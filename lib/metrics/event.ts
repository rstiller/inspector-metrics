import "source-map-support/register";

import { Groupable } from "./groupable";
import { MetadataContainer } from "./metadata-container";
import { MetadataManager } from "./metadata-manager";
import { TagManager } from "./tag-manager";
import { Taggable } from "./taggable";

export class Event<TValue> implements Groupable, MetadataContainer, Taggable {
  private group: string;
  private metadataManager = new MetadataManager();
  private tagManager = new TagManager();
  private name: string;
  private description: string;
  private value: TValue;

  public constructor(name: string, description?: string) {
    this.name = name;
    this.description = description;
  }

  public getGroup(): string {
    return this.group;
  }

  public setGroup(group: string): this {
    this.group = group;
    return this;
  }

  public getMetadataMap(): Map<string, any> {
    return this.metadataManager.getMetadataMap();
  }

  public getMetadata<T>(name: string): T {
    return this.metadataManager.getMetadata<T>(name);
  }

  public removeMetadata<T>(name: string): T {
    return this.metadataManager.removeMetadata<T>(name);
  }

  public setMetadata<T>(name: string, value: T): this {
    this.metadataManager.setMetadata(name, value);
    return this;
  }

  public getTags(): Map<string, string> {
    return this.tagManager.getTags();
  }

  public getTag(name: string): string {
    return this.tagManager.getTag(name);
  }

  public setTag(name: string, value: string): this {
    this.tagManager.setTag(name, value);
    return this;
  }

  public removeTag(name: string): this {
    this.tagManager.removeTag(name);
    return this;
  }

  public getName(): string {
    return this.name;
  }

  public setName(name: string): this {
    this.name = name;
    return this;
  }

  public getDescription(): string {
    return this.description;
  }

  public setDescription(description: string): this {
    this.description = description;
    return this;
  }

  public getValue(): TValue {
    return this.value;
  }

  public setValue(value: TValue): this {
    this.value = value;
    return this;
  }

  public toString(): string {
    if (this.group) {
      return `${this.group}.${this.name}`;
    }
    return this.name;
  }
}
