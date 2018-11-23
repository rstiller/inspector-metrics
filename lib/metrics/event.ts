import "source-map-support/register";

import { TagManager } from "./tag-manager";
import { Taggable } from "./taggable";

export class Event<TEventData> implements Taggable {
  private tagManager = new TagManager();
  private name: string;
  private description: string;
  private value: TEventData;

  public constructor(name: string, description?: string) {
    this.name = name;
    this.description = description;
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

  public getValue(): TEventData {
    return this.value;
  }

  public setValue(value: TEventData): this {
    this.value = value;
    return this;
  }

  public toString(): string {
    return this.name;
  }
}
