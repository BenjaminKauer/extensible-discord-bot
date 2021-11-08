import { Collection, Message, OAuth2Guild } from 'discord.js';
import { DatabaseKeys } from '../../database.keys';
import { AbstractModule, Commands, Module } from '..';
import _ from 'lodash';
import { Util } from '../..';

@Module({
    name: 'core',
    alwaysActivated: true
})
export class CoreModule extends AbstractModule {

    init(): void { }

    protected registerCommands(): Commands {
        return {
            'set-mod-role': {
                onlyMods: true,
                handler: (msg: Message) => this.setModRole(msg)
            },
            'get-all-modules': {
                onlyMods: true,
                handler: (msg: Message) => this.getAllModules(msg)
            },
            'get-disabled-modules': {
                onlyMods: true,
                handler: (msg: Message) => this.getDisabledModules(msg)
            },
            'get-enabled-modules': {
                onlyMods: true,
                handler: (msg: Message) => this.getEnabledModules(msg)
            },
            'enable-module': {
                onlyMods: true,
                handler: (msg: Message) => this.enableModule(msg)
            },
            'disable-module': {
                onlyMods: true,
                handler: (msg: Message) => this.disableModule(msg)
            },
            'server-count': {
                onlyMods: true,
                handler: (msg: Message) => this.serverCount(msg)
            },
            'ping': {
                handler: (msg: Message) => this.ping(msg)
            },
            'now': {
                handler: (msg: Message) => this.now(msg)
            }
        };
    }

    private async enableModule(msg: Message): Promise<void> {
        if (!msg.guildId) return;

        const moduleName: string = msg.content.split(" ")[1];

        const module: AbstractModule | undefined = this.moduleHub.getModules()
            .find((module: AbstractModule) => module.metaData.name == moduleName);

        if (!module) {
            msg.reply('Modul nicht gefunden.');
            return;
        }

        const disabledModules: Array<string> = await this.moduleHub.getDisabledModules(msg.guildId, true);

        if (!_.includes(disabledModules, moduleName)) {
            msg.reply(`${moduleName} ist bereits aktiviert.`);
            return;
        }

        this.moduleHub.enableModule(msg.guildId, moduleName);
        msg.reply(`${moduleName} wurde aktiviert.`);
    }

    private async disableModule(msg: Message): Promise<void> {
        if (!msg.guildId) return;

        const moduleName: string = msg.content.split(" ")[1];

        const module: AbstractModule | undefined = this.moduleHub.getModules()
            .find((module: AbstractModule) => module.metaData.name == moduleName);

        if (!module) {
            msg.reply('Modul nicht gefunden.');
            return;
        }

        if (module.metaData.alwaysActivated) {
            msg.reply(`${Util.wrapInBackTicks(moduleName)} kann nicht deaktiviert werden.`);
            return;
        }

        const disabledModules: Array<string> = await this._getDisabledModules(msg.guildId);

        if (_.includes(disabledModules, moduleName)) {
            msg.reply(`${Util.wrapInBackTicks(moduleName)} ist bereits deaktiviert.`);
            return;
        }
        this.moduleHub.disableModule(msg.guildId, moduleName);
        msg.reply(`Okay, ${Util.wrapInBackTicks(moduleName)} ist nun deaktiviert.`);
    }

    private getAllModules(msg: Message): void {
        const allModules: Array<string> = this._getAllModules();

        msg.reply(`Unterstützte Module: ${Util.wrapInBackTicks(allModules.join(', '))}`);
    }

    private async getEnabledModules(msg: Message): Promise<void> {
        if (!msg.guildId) return;

        const disabledModules: Array<string> = await this._getDisabledModules(msg.guildId);
        const allModules: Array<string> = this._getAllModules();

        const enabledModules: Array<string> = _.difference(allModules, disabledModules);

        msg.reply(`Aktivierte Module: ${Util.wrapInBackTicks(enabledModules.join(', '))}`);
    }

    private async getDisabledModules(msg: Message): Promise<void> {
        if (!msg.guildId) return;

        const disabledModules: Array<string> = await this._getDisabledModules(msg.guildId);

        if (disabledModules && disabledModules.length) {
            msg.reply(`Deaktivierte Module: ${Util.wrapInBackTicks(disabledModules.join(', '))}`);
            return;
        }
        msg.reply('Keine Module deaktiviert');
    }

    private async _getDisabledModules(guildID: string): Promise<Array<string>> {
        return this.moduleHub.getDisabledModules(guildID);
    }

    private _getAllModules(): Array<string> {
        const allModules: Array<string> = this.moduleHub.getModules()
            .filter((module: AbstractModule) => module.metaData.name !== this.metaData.name)
            .map((module: AbstractModule) => module.metaData.name);

        return allModules;
    }

    private setModRole(msg: Message): void {
        if (!msg.guildId) return;

        const param: string = msg.content.split(" ")[1];
        const regex: RegExp = new RegExp(/<@&(\d+)>/gm);

        if (!regex.test(param)) {
            msg.reply('Invalider Wert');
            return;
        }

        const parsed: string = param.replace('<', '').replace('>', '').replace('@', '').replace('&', '');

        if (!msg.guild?.roles.cache.has(parsed)) {
            msg.reply('Unbekannte Rolle');
            return;
        }

        msg.reply(`Ok, ich setze ${param} als Moderator-Rolle`);
        this.database.update(msg.guildId, DatabaseKeys.ModRole, parsed);
    }

    private serverCount(msg: Message): void {

        if (msg.author.id !== process.env.BOT_OWNER_ID) return;

        this.client.guilds.fetch()
            .then((v: Collection<string, OAuth2Guild>) => {
                msg.reply(`Aktuell laufe ich auf ${v.size} Discords.`);
            });

    }

    private ping(msg: Message): void {
        (msg as any).reply({ content: `${Date.now() - msg.createdTimestamp}ms`, ephemeral: true });
    }

    private now(msg: Message): void {
        (msg as any).reply({ content: `<t:${Math.floor(Date.now() / 1000)}:T>` });
    }
}
