# Environment config

Place a file named `.env` in the root directory of this project.
The file could look like:

```ini
#The oauth token for your bot, provided by Discord
TOKEN=ABCDEFGHIJKLMNOPQRSTUVWXYZ1234
#development | production
ENVIRONMENT=development
#The command prefix
PREFIX=_
#name for the sqlite3 db file
SQLITE_FILENAME=bock2bot.sqlite3
#url that will be shown in the bot's status
URL=still in development
#id of the bot owner's discord user
BOT_OWNER_ID=196886705918312448
#id of the debug channel. the bot needs to be able to post messages into that channel
DEBUG_CHANNEL_ID=903713977132003348
```