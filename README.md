# Discord Moderation Bot

A professional Discord bot with advanced leveling system and moderation features. This project uses a monorepo structure with separate packages for the bot and dashboard.

## Project Structure

```
├── packages/
│   ├── bot/         # Discord bot implementation
│   └── dashboard/   # Web dashboard (Next.js)
├── shared/
│   └── config/      # Shared configuration files
└── README.md
```

## Prerequisites

- Node.js 16.x or higher
- PostgreSQL database
- Discord Bot Token

## Setup Instructions

1. Clone the repository

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory with:
   ```
   DISCORD_TOKEN=your_bot_token
   CLIENT_ID=your_client_id
   GUILD_ID=your_guild_id
   DATABASE_URL=postgresql://user:password@localhost:5432/dbname
   ```

4. Initialize the database:
   ```bash
   node shared/config/init-db.js
   ```

5. Deploy bot commands:
   ```bash
   cd packages/bot
   npm run deploy
   ```

6. Start the services:

   For development:
   ```bash
   # Start the bot
   cd packages/bot
   npm run dev

   # Start the dashboard
   cd packages/dashboard
   npm run dev
   ```

   For production:
   ```bash
   # Start the bot
   cd packages/bot
   npm start

   # Start the dashboard
   cd packages/dashboard
   npm start
   ```

## Features

- XP and leveling system
- Role management
- Welcome messages with custom cards
- Web dashboard for configuration
- Moderation commands

## License

MIT