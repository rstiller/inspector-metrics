
import "source-map-support/register";

export interface Groupable {
    getGroup(): string;
    setGroup(group: string): void;
}
