export abstract class DatabaseAdapter {
    constructor() { this.init(); }
    abstract init(): Promise<void>;
    abstract read<T>(guildID: string, key: string): Promise<T | undefined>;
    abstract delete(guildID: string, key: string): Promise<void>;
    abstract create<T>(guildID: string, key: string, value: T): Promise<void>;
    abstract update<T>(guildID: string, key: string, value: T): Promise<void>;
}
