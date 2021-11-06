import { Client, Message } from 'discord.js';
import _ from 'lodash';
import { DatabaseAdapter } from '../abstract-database-adapter';
import { DatabaseKeys } from '../database.keys';
import { AbstractModule } from './module.base';

export type Newable<T extends AbstractModule> = { new(...args: any[]): T; };

export class ModuleHub {

    private modules: Array<AbstractModule> = [];
    private disabledModules: Map<string, Array<string>> = new Map();

    constructor(private client: Client, private db: DatabaseAdapter) { }

    addModules<T extends AbstractModule>(...modules: Array<Newable<T>>): this {
        modules.forEach((h: Newable<T>) => {
            this.addModule(h);
        });

        return this;
    }

    ready(): void {
        this.modules.forEach((mod: AbstractModule) => {
            mod._init();
        });
    }

    getModules(): Array<AbstractModule> {
        return this.modules;
    }

    async disableModule(guildID: string, moduleName: string): Promise<void> {

        const disabledModules: Array<string> = await this.getDisabledModules(guildID, true);
        disabledModules.push(moduleName);

        this.disabledModules.set(guildID, disabledModules);

        this.db.update(guildID, DatabaseKeys.DisabledModule, disabledModules.join(','));
    }

    async enableModule(guildID: string, moduleName: string): Promise<void> {
        const disabled: Array<string> = await this.getDisabledModules(guildID, true);

        if (_.includes(disabled, moduleName)) {
            const newDisabled: Array<string> = _.remove(disabled, moduleName);
            this.db.update(guildID, DatabaseKeys.DisabledModule, newDisabled.join(','));
            this.disabledModules.set(guildID, newDisabled);
        }
    }

    async getDisabledModules(guildID: string, force?: boolean): Promise<Array<string>> {

        const cached: Array<string> | undefined = this.disabledModules.get(guildID);

        if (cached && !force) {
            return cached;
        }

        const disabled: string = (await this.db.read<string>(guildID, DatabaseKeys.DisabledModule)) ?? '';

        const disabledArr: Array<string> = (disabled === '') ? [] : disabled.split(',');

        this.disabledModules.set(guildID, disabledArr);
        return disabledArr;
    }

    private addModule<T extends AbstractModule>(ctor: Newable<T>): void {
        this.modules.push(new ctor(this.client, this.db, this));
    }

    handle(msg: Message, index: number = 0): void {
        if (this.modules[index]) {
            this.modules[index]._handle(
                msg,
                () => this.handle(msg, ++index)
            );
        }
    }
}