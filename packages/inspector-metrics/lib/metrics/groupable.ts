
import "source-map-support/register";

export interface IGroupable {
    getGroup(): string;
    setGroup(group: string): void;
}
