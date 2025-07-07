const express = require('express');
const { createWelcomeCard } = require('./packages/bot/src/utils/welcomeCard');
const { createShowcaseCard } = require('./packages/bot/src/utils/showcaseCard');
const CanvasUtils = require('./packages/bot/src/utils/canvasUtils');
const app = express();
const port = 3009;

// Example user data
const exampleUser = {
    username: 'LorantOne',
    inviter: 'JohnDoe',
    memberCount: 100,
    avatarURL: 'https://once-ui.com/_next/image?url=https%3A%2F%2Fjglyhjpuipupcestlapv.supabase.co%2Fstorage%2Fv1%2Fobject%2Fpublic%2Fusers%2F7f8df89b-3a6d-4d74-9402-f4cad86cb45f%2Favatar%2Favatar-1733056648726.jpg&w=64&q=75',
    displayAvatarURL: () => exampleUser.avatarURL
};

// Example project data
const exampleProject = {
    title: 'Design Engineers Club',
    description: 'A community for designers who code and developers who design',
    technologies: ['React', 'Node.js', 'Canvas'],
    author: 'LorantOne',
    thumbnailUrl: exampleUser.avatarURL,
    likes_count: 42
};

// Example leaderboard data
const exampleLeaderboard = [
    { 
        username: 'Lorant',
        level: 34,
        xp: 3400,
        nextLevelXP: 4000,
        displayAvatarURL: () => exampleUser.avatarURL
    },
    { 
        username: 'suhaib',
        level: 31,
        xp: 500,
        nextLevelXP: 3500,
        displayAvatarURL: () => exampleUser.avatarURL
    },
    { 
        username: 'Ernesto',
        level: 28,
        xp: 2800,
        nextLevelXP: 3000,
        displayAvatarURL: () => exampleUser.avatarURL
    },
    { 
        username: 'Zsofia',
        level: 23,
        xp: 1200,
        nextLevelXP: 2500,
        displayAvatarURL: () => exampleUser.avatarURL
    },
    { 
        username: 'Texz',
        level: 20,
        xp: 1900,
        nextLevelXP: 2000,
        displayAvatarURL: () => exampleUser.avatarURL
    },
    { 
        username: 'random',
        level: 14,
        xp: 1000,
        nextLevelXP: 1500,
        displayAvatarURL: () => exampleUser.avatarURL
    },
    { 
        username: 'Member65',
        level: 7,
        xp: 500,
        nextLevelXP: 800,
        displayAvatarURL: () => exampleUser.avatarURL
    },
    { 
        username: 'NewUser',
        level: 5,
        xp: 300,
        nextLevelXP: 600,
        displayAvatarURL: () => exampleUser.avatarURL
    }
];

// Serve static HTML with links to all cards
app.get('/', (req, res) => {
    res.send(`
        <h1>Card Previews</h1>
        <div style="display: flex; flex-direction: column; gap: 20px;">
            <div>
                <h2>Welcome Card</h2>
                <img src="/welcome-card" style="max-width: 100%; height: auto;" />
            </div>
            <div>
                <h2>Showcase Card</h2>
                <img src="/showcase-card" style="max-width: 100%; height: auto;" />
            </div>
            <div>
                <h2>Project Card</h2>
                <img src="/project-card" style="max-width: 100%; height: auto;" />
            </div>
            <div>
                <h2>Level Up Card</h2>
                <img src="/level-up-card" style="max-width: 100%; height: auto;" />
            </div>
            <div>
                <h2>Leaderboard Card</h2>
                <img src="/leaderboard-card" style="max-width: 100%; height: auto;" />
            </div>
        </div>
    `);
});

// Welcome card endpoint
app.get('/welcome-card', async (req, res) => {
    try {
        const buffer = await createWelcomeCard(
            exampleUser.username,
            exampleUser.inviter,
            exampleUser.memberCount,
            exampleUser.avatarURL
        );

        res.setHeader('Content-Type', 'image/png');
        res.send(buffer);
    } catch (error) {
        console.error('Error generating welcome card:', error);
        res.status(500).send('Error generating image');
    }
});

// Showcase card endpoint
app.get('/showcase-card', async (req, res) => {
    try {
        const buffer = await createShowcaseCard({
            title: exampleProject.title,
            description: exampleProject.description,
            technologies: exampleProject.technologies,
            author: exampleProject.author,
            thumbnailUrl: exampleProject.thumbnailUrl
        });

        res.setHeader('Content-Type', 'image/png');
        res.send(buffer);
    } catch (error) {
        console.error('Error generating showcase card:', error);
        res.status(500).send('Error generating image');
    }
});

// Project card endpoint using CanvasUtils
app.get('/project-card', async (req, res) => {
    try {
        const buffer = await CanvasUtils.createProjectShowcaseImage(
            {
                title: exampleProject.title,
                description: exampleProject.description,
                technologies: exampleProject.technologies,
                likes_count: exampleProject.likes_count
            },
            {
                username: exampleUser.username,
                displayAvatarURL: () => exampleUser.avatarURL
            }
        );

        res.setHeader('Content-Type', 'image/png');
        res.send(buffer);
    } catch (error) {
        console.error('Error generating project card:', error);
        res.status(500).send('Error generating image');
    }
});

// Level up card endpoint
app.get('/level-up-card', async (req, res) => {
    try {
        const buffer = await CanvasUtils.createLevelUpImage(
            {
                username: exampleUser.username,
                displayAvatarURL: () => exampleUser.avatarURL
            },
            5 // Current level
        );

        res.setHeader('Content-Type', 'image/png');
        res.send(buffer);
    } catch (error) {
        console.error('Error generating level up card:', error);
        res.status(500).send('Error generating image');
    }
});

// Leaderboard card endpoint
app.get('/leaderboard-card', async (req, res) => {
    try {
        const buffer = await CanvasUtils.createLeaderboardImage(exampleLeaderboard);

        res.setHeader('Content-Type', 'image/png');
        res.send(buffer);
    } catch (error) {
        console.error('Error generating leaderboard card:', error);
        res.status(500).send('Error generating image');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});