# modular-discord-bot

![version on npm](https://img.shields.io/npm/v/modular-discord-bot?style=flat-square) ![npm total downloads](https://img.shields.io/npm/dt/modular-discord-bot?style=flat-square)
![GitHub contributors](https://img.shields.io/github/contributors/BenjaminKauer/modular-discord-bot?style=flat-square) ![GitHub last commit](https://img.shields.io/github/last-commit/BenjaminKauer/modular-discord-bot?style=flat-square)

This project is meant to deliver some basic, extensible discord bot (as the name may have suggested).

# Getting started / Prerequisites

First of all, you need to register your bot (application) on Discord. You can do that on the [Discord Developer Portal](https://discord.com/developers/applications). I won't provide a tutorial for that process at this point.

I'm developing `modular-discord-bot` using node version `16.13.0` and TypeScript version `4.4.4`.
This project uses [discord.js](https://discord.js.org/#/) in version `^13.2.0`.

# Install and run

In order to create a new, custom bot you can follow these steps:

  1. In the desired directory, run `npm init` to create a new npm module
  2. Run `npm i modular-discord-bot --save` to install all the dependencies
  3. In your main `.ts`-file, paste the following:

```typescript
import { ModularDiscordBot } from 'modular-discord-bot';

const bot: ModularDiscordBot = new ModularDiscordBot();
```
  4. Set up your environment (see [Environment Config](#environment-config))
  5. Create a `tsconfig.json` in order to configure the TypeScript compiler, paste the following (example):
  ```json
    {
        "compilerOptions": {
            "target": "es5",
            "module": "CommonJS",
            "declaration": true,
            "outDir": "./dist",
            "strict": true,
            "lib": [
                "dom",
                "es2015"
            ],
            "moduleResolution": "node",
            "sourceMap": true,
            "strictNullChecks": true,
            "suppressImplicitAnyIndexErrors": true,
            "experimentalDecorators": true,
            "emitDecoratorMetadata": true,
            "noImplicitAny": false,
            "noUnusedLocals": true,
            "rootDir": "./src",
            "noUnusedParameters": true,
            "esModuleInterop": true,
            "allowSyntheticDefaultImports": true,
            "resolveJsonModule": true
        },
        "include": [
            "src/**/*.ts"
        ],
        "exclude": [
            "node_modules"
        ]
    }
  ```
  6. Run `tsc` to build your bot.
  7. Run `node dist/<your-main-file>.ts`
  8. Your custom bot should be up and running


# Environment config

The bot reads certain environment variables, for example the Discord OAuth token required to connect to the Discord API. You can either set those variables in your system, or just place a file named `.env` in the root directory of this project.

Example `.env`:

```ini
# The oauth token for your bot, provided by Discord
TOKEN=ABCDEFGHIJKLMNOPQRSTUVWXYZ1234

# development | production
ENVIRONMENT=development

# The command prefix
PREFIX=_

# name for the sqlite3 db file
# Only required if using the SQLite-Adapter
SQLITE_FILENAME=my-modular-discord-bot.sqlite3

# url that will be shown in the bot's status (STREAMING <URL>)
URL=https://example.com

# id of the bot owner's discord user
BOT_OWNER_ID=1234567890123456789

# id of the debug channel. the bot needs to be able to post messages into that channel
# (if a debug channel has been set)
DEBUG_CHANNEL_ID=123456789012345678
```

---

# Extending the bot

This bot is meant to be extended by implementing modules.

### Extend AbstractModule and decorate with @Module()

Your module will have to extend `AbstractModule`. Furthermore, you need to pass some information to the `ModuleHub`, using the `@Module()` decorator.

##### Example:

```typescript
@Module({
    name: 'exampleModule',  // the module's name
    alwaysActivated: true   // whether it's always enabled or can be disabled
})
export class MyNewModule extends AbstractModule {
    ...
}
```

### Use the built-in sqlite3-adapter

I've built a _very_ basic sqlite3-adapter. You can use it (or write your own database-adapter, and use that one) by calling `this.database.create()`, `this.database.read()`, `this.database.update()` or `this.database.delete()`.

##### Example:
```typescript
this.database.read<string>(guildID, 'news-channel')
    .then((channelID: string | undefined) => {
        if (channelID) {
            this.newsChannelID.set(guildID, channelID);
        }
    });

```

### Initialization

Once the discord client is `ready`, the `ModuleHub` will call each module's `init()`. So that's the right place to do some initialization, for example loading data from the database.



### Registering commands

In your module, implement the method `registerCommands(): Commands`. This method will automatically be called by the `ModuleHub`. I'm planning to create slash commands out of the registered commands in the future.

##### Example:
```typescript
protected registerCommands(): Commands {
    return {
        'time': {
            onlyMods: true,
            handler: (msg: Message) => this.postTime(msg)
        }
    };
}

private postTime(msg: Message): void {
    msg.reply({ content: `It's <t:${Math.floor(Date.now() / 1000)}:T> o'clock.` });
}

```

Results in:

![Screenshot](https://user-images.githubusercontent.com/5950968/140623471-1d6ee341-cc86-4889-b5ab-c016043097c7.png)


### Registering your new module to the ModuleHub

Registering your module to the `ModuleHub` is as easy as adding it to the array which `src/modules.ts` exports:

```typescript
export const MODULES: Array<Newable<AbstractModule>> = [
    MyOwnModule
];
```

### Example module

In `src/modules/example` you will find an example module.