const { createWelcomeCard } = require('./welcomeCard');
const fs = require('fs');
const path = require('path');

const testDir = path.join(__dirname, '../test-output');
if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
}

const testCases = [
    {
        username: 'NewUser123',
        inviter: 'CoolMod',
        memberCount: 42,
        userAvatarURL: 'https://cdn.discordapp.com/avatars/123456789/user-avatar.png?size=512'
    },
    {
        username: 'LongUserNameTest1234567890',
        inviter: 'ModWithLongName1234',
        memberCount: 1000,
        userAvatarURL: null 
    },
    {
        username: '⭐Special_User⭐',
        inviter: '🎮GameMaster🎮',
        memberCount: 1,
        userAvatarURL: 'https://cdn.discordapp.com/avatars/987654321/special-avatar.png?size=512'
    }
];

// Generate test cards
async function generateTestCards() {
    console.log('Generating test welcome cards...');
    
    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        try {
            console.log(`Generating card for test case ${i + 1}...`);
            const cardBuffer = await createWelcomeCard(
                testCase.username,
                testCase.inviter,
                testCase.memberCount,
                testCase.userAvatarURL
            );

            // Save the card
            const outputPath = path.join(testDir, `welcome-card-test-${i + 1}.png`);
            fs.writeFileSync(outputPath, cardBuffer);
            console.log(`Card saved to: ${outputPath}`);
        } catch (error) {
            console.error(`Error generating test case ${i + 1}:`, error);
        }
    }
    
    console.log('Test card generation complete!');
}

generateTestCards().catch(console.error);