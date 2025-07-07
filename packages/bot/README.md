# Discord Moderation Bot - Bot Package

This package contains the core Discord bot implementation with moderation and leveling features.

## Features

### Moderation
- User warning system
- Temporary and permanent bans
- Message purging
- Anti-spam protection
- Raid protection
- Auto-moderation filters

### Leveling System
- XP gain from messages and voice activity
- Customizable level-up messages
- Role rewards at specific levels
- Leaderboard command
- XP multipliers for events

### Welcome System
- Customizable welcome messages
- Dynamic welcome cards
- Role assignment on join
- Verification system

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   Create a `.env` file in the bot package directory:
   ```
   DISCORD_TOKEN=your_bot_token
   CLIENT_ID=your_client_id
   GUILD_ID=your_guild_id
   DATABASE_URL=postgresql://user:password@localhost:5432/dbname
   ```

3. Deploy commands:
   ```bash
   npm run deploy
   ```

4. Start the bot:
   Development mode:
   ```bash
   npm run dev
   ```
   
   Production mode:
   ```bash
   npm start
   ```

## Command List

### Moderation Commands
- `/warn <user> [reason]` - Warn a user
- `/kick <user> [reason]` - Kick a user
- `/ban <user> [duration] [reason]` - Ban a user
- `/mute <user> [duration] [reason]` - Mute a user
- `/clear <amount>` - Clear messages

### Leveling Commands
- `/rank [user]` - Check rank
- `/leaderboard` - View server leaderboard
- `/givexp <user> <amount>` - Give XP to user

### Configuration Commands
- `/setup-welcome` - Configure welcome messages
- `/setup-levels` - Configure leveling system
- `/setup-automod` - Configure auto-moderation

## Contributing

Please read the [Contributing Guidelines](../../CONTRIBUTING.md) before submitting any pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.