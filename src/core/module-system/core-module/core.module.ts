import { Collection, Message, OAuth2Guild } from 'discord.js';
import { DatabaseKeys } from '../../database.keys';
import { AbstractModule, Commands, Module } from '..';
import _ from 'lodash';
import { GuildID, Util } from '../..';

require('dotenv').config();
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
                handler: (msg: Message) => this._enableModule(msg)
            },
            'disable-module': {
                onlyMods: true,
                handler: (msg: Message) => this._disableModule(msg)
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
            },
            'version': {
                onlyMods: true,
                handler: (msg: Message) => this.printVersion(msg)
            }
        };
    }

    public async enableModule(moduleName: string, guildID: GuildID): Promise<string | undefined> {
        const module: AbstractModule | undefined = this.moduleHub.getModules()
            .find((module: AbstractModule) => module.metaData.name == moduleName);

        if (!module) {
            return 'Modul nicht gefunden.';
        }

        const disabledModules: Array<string> = await this.moduleHub.getDisabledModules(guildID, true);

        if (!_.includes(disabledModules, moduleName)) {
            return `${moduleName} ist bereits aktiviert.`;
        }

        this.moduleHub.enableModule(guildID, moduleName);
    }


    private async _enableModule(msg: Message): Promise<void> {
        if (!msg.guildId) return;

        const moduleName: string = msg.content.split(" ")[1];

        const result: string | undefined = await this.enableModule(moduleName, msg.guildId);

        if (result) {
            msg.reply(result);

            return;
        }

        msg.reply(`${moduleName} wurde aktiviert.`);
    }

    public async disableModule(moduleName: string, guildID: GuildID): Promise<string | undefined> {
        const module: AbstractModule | undefined = this.moduleHub.getModules()
            .find((module: AbstractModule) => module.metaData.name == moduleName);

        if (!module) {
            return 'Modul nicht gefunden.';
        }

        if (module.metaData.alwaysActivated) {
            return `${Util.wrapInBackTicks(moduleName)} kann nicht deaktiviert werden.`;
        }

        const disabledModules: Array<string> = await this._getDisabledModules(guildID);

        if (_.includes(disabledModules, moduleName)) {
            return `${Util.wrapInBackTicks(moduleName)} ist bereits deaktiviert.`;
        }
        this.moduleHub.disableModule(guildID, moduleName);
    }

    private async _disableModule(msg: Message): Promise<void> {
        if (!msg.guildId) return;

        const moduleName: string = msg.content.split(" ")[1];

        const result: string | undefined = await this.disableModule(moduleName, msg.guildId);

        if (result) {
            msg.reply(result);

            return;
        }

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

        if (enabledModules.length) {
            msg.reply('Zurzeit sind keine Module aktiviert');
            return;
        }

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
            .map((module: AbstractModule) =>
                module.metaData.commandPrefix
                    ? `${module.metaData.name} (${module.metaData.commandPrefix})`
                    : module.metaData.name
            );

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

    private printVersion(msg: Message): void {
        const currentVersion: string = process.env.npm_package_version ?? '';
        const packageName: string = process.env.npm_package_name ?? '';

        msg.reply(Util.wrapInBackTicks(`${packageName}@${currentVersion}`));
    }
}
