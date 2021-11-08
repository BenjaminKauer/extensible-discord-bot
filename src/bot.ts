import { Client, Interaction, Message } from 'discord.js';
import { AbstractModule, CoreModule, ModuleHub, Newable } from './core/module-system';
import { Util } from './core';
import { DatabaseAdapter } from './core/abstract-database-adapter';
import { SqlAdapter } from './database-adapters/sqlite.adapter';

require('dotenv').config();

interface ClientOptions {
    token: string;
    url: string;
}

export class ModularDiscordBot {
    private client!: Client;
    private moduleHub!: ModuleHub;
    private options!: ClientOptions;
    private db: DatabaseAdapter;

    constructor() {
        this.init();
        this.db = new SqlAdapter();
    }

    public async registerModules(modules: Array<Newable<AbstractModule>>): Promise<void> {
        this.moduleHub = new ModuleHub(this.client, this.db)
            .addModules<AbstractModule>(CoreModule, ...modules);
    }

    private async init(): Promise<void> {

        this.options = {
            token: process.env.TOKEN ?? '',
            url: process.env.URL ?? ''
        };

        await this.createClient();
        await this.listenOnClientEvents();
    }

    private async createClient(): Promise<void> {
        this.client = new Client({
            intents: [
                'GUILDS',
                'GUILD_MESSAGES',
                'GUILD_MESSAGE_REACTIONS',
                'GUILD_MESSAGE_TYPING'
            ]
        });
    }

    private async listenOnClientEvents(): Promise<void> {
        this.client.on('ready', () => {

            this.moduleHub.ready();
            console.log(`Logged in as ${this.client.user?.tag}!`);
        });

        this.client.on('messageCreate', (msg: Message) => {
            if (msg.author.bot) return;

            this.moduleHub.handle(msg);
        });

        this.client.on('interactionCreate', (interaction: Interaction) => {
            this.moduleHub.handleInteraction(interaction);
        });

        await this.client.login(this.options.token);

        this.client.user?.setActivity(this.options.url, {
            type: "STREAMING",
            url: this.options.url
        });

        if (process.env.ENVIRONMENT && process.env.ENVIRONMENT !== 'development' && process.env.DEBUG_CHANNEL_ID) {

            const currentVersion: string = process.env.npm_package_version ?? '';
            const packageName: string = process.env.npm_package_name ?? '';

            Util.sendMessageToChannel(
                this.client,
                process.env.DEBUG_CHANNEL_ID as string,
                `${packageName}@${currentVersion} online.`
            );
        }
    }
}

export * from './public-api';
