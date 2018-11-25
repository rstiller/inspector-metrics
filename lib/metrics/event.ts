import "source-map-support/register";

import { Taggable } from "./taggable";

export class Event<TEventData> implements Taggable {
  private tags: Map<string, string> = new Map();
  private name: string;
  private description?: string;
  private value: TEventData;
  private time: number;

  public constructor(name: string, description?: string) {
    this.time = Date.now();
    this.name = name;
    this.description = description;
  }

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

  public getName(): string {
    return this.name;
  }

  public setName(name: string): this {
    this.name = name;
    return this;
  }

  public getDescription(): string | undefined {
    return this.description;
  }

  public setDescription(description: string): this {
    this.description = description;
    return this;
  }

  //  TODO use clock instead ?
  public getTime(): number {
    return this.time;
  }

  public setTime(time: number): this {
    this.time = time;
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
