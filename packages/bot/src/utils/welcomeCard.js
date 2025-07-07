const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

// Register the custom font
registerFont(path.join(__dirname, '../assets/GeistMono-Regular.ttf'), { family: 'GeistMono' });

async function createWelcomeCard(username, inviter, memberCount, userAvatarURL) {
    // Create canvas
    const canvas = createCanvas(1280, 720);
    const ctx = canvas.getContext('2d');

    // Generate current date in format like "23 Feb 2025 22:36"
    const currentDate = new Date();
    const date = currentDate.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    // Generate random coordinates
    const lat = (Math.random() * 180 - 90).toFixed(4);
    const long = (Math.random() * 360 - 180).toFixed(4);
    const coordinates = `${lat}°, ${long}°`;

    // Generate random number between 75 and 100
    const randomPercentage = Math.floor(Math.random() * (100 - 75 + 1)) + 75;

    // Generate integrity text based on percentage
    let integrityText;
    let integrityColor;
    if (randomPercentage > 95) {
        integrityText = '"No compromised information"';
        integrityColor = '#71FF7B'; // green
    } else if (randomPercentage > 85) {
        integrityText = '"Minor anomalies detected"';
        integrityColor = '#FFD700'; // yellow
    } else {
        integrityText = '"Potential security risks"';
        integrityColor = '#FFA500'; // orange
    }

    // Load and draw background
    try {
        const bgPath = path.join(__dirname, '../assets/bg.png');
        console.log('Loading background from:', bgPath);
        const background = await loadImage(bgPath);
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    } catch (error) {
        console.error('Error loading background:', error);
        // Fill with dark background as fallback
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Add semi-transparent overlay for better text visibility
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load and draw user avatar in the center circular area
    try {
        if (userAvatarURL) {
            // Clean up the avatar URL to ensure PNG format
            const avatarURL = userAvatarURL
                .split('?')[0]  // Remove any existing query parameters
                .replace(/\.(webp|gif|jpg|jpeg)$/, '.png') // Convert to PNG
                + '?size=512';  // Add size parameter
            
            console.log('Processing avatar URL:', avatarURL);
            
            // Attempt to load the avatar
            let userAvatar;
            try {
                userAvatar = await loadImage(avatarURL);
            } catch (avatarError) {
                console.error('Failed to load avatar with PNG, trying default Discord avatar');
                // If loading fails, use default Discord avatar
                const discriminator = Math.floor(Math.random() * 5); // 0-4 for default avatar
                const defaultAvatarUrl = `https://cdn.discordapp.com/embed/avatars/${discriminator}.png`;
                userAvatar = await loadImage(defaultAvatarUrl);
            }

            const iconSize = 280;
            const iconX = (canvas.width - iconSize) / 2;
            const iconY = (canvas.height - iconSize) / 2;

            // Create circular clip for user avatar
            ctx.save();
            ctx.beginPath();
            ctx.arc(iconX + iconSize/2, iconY + iconSize/2, iconSize/2, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(userAvatar, iconX, iconY, iconSize, iconSize);
            ctx.restore();

            // Draw scanning circle animation effect
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            for (let i = 0; i < 2; i++) {
                ctx.beginPath();
                ctx.arc(iconX + iconSize/2, iconY + iconSize/2, iconSize/2 + 10 + (i * 5), 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    } catch (error) {
        console.error('Error in avatar processing:', error);
        // Draw placeholder circle if avatar fails to load
        const iconSize = 280;
        const iconX = (canvas.width - iconSize) / 2;
        const iconY = (canvas.height - iconSize) / 2;
        
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(iconX + iconSize/2, iconY + iconSize/2, iconSize/2, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Configure text settings
    ctx.textAlign = 'center';
    ctx.font = '48px "Geist Mono", "Arial"';
    ctx.fillStyle = '#FFFFFF';

    // Draw welcome message
    ctx.textBaseline = "top";
    
    // Set color based on percentage range
    if (randomPercentage > 95) {
        ctx.fillStyle = '#71FF7B'; // green
    } else if (randomPercentage > 85) {
        ctx.fillStyle = '#FFD700'; // yellow
    } else {
        ctx.fillStyle = '#FFA500'; // orange
    }
    
    ctx.fillText(randomPercentage + '%', canvas.width / 2, 606);
    
    // Draw left data
    ctx.textAlign = "left";
    ctx.fillStyle = '#8BE2E7';
    ctx.font = '20px "Geist Mono", "Arial"';
    ctx.fillText('"' + username + '"', 44, 240);
    ctx.fillStyle = integrityColor;
    ctx.fillText(integrityText, 44, 400);
    ctx.fillStyle = '#8BE2E7';
    ctx.fillText("true", 44, 478);
    ctx.fillText('"Design Engineer"', 44, 558);

    // Draw left
    ctx.font = '20px "Geist Mono", "Arial"';
    ctx.fillStyle = '#9D9D9D';
    ctx.fillText("logs", 44, 56);
    ctx.fillStyle = '#ffffff';
    ctx.fillText("scanning users...", 44, 135);
    ctx.fillText("user identified:", 44, 214);
    ctx.fillText("running checks...", 44, 293);
    ctx.fillText("checks finished:", 44, 372);
    ctx.fillText("eligibility:", 44, 451);
    ctx.fillText("affiliation:", 44, 530);
    ctx.fillText("hello " + username + ". welcome to\nthe Design Engineers Club.", 44, 609);

    // Draw right
    ctx.fillStyle = '#9D9D9D';
    ctx.textAlign = "right";
    ctx.font = '20px "Geist Mono", "Arial"';
    ctx.fillText("name", 1240, 135);
    ctx.fillText("reference", 1240, 214);
    ctx.fillText("integrity", 1240, 293);
    ctx.fillText("id", 1240, 372);
    ctx.fillText("location", 1240, 451);
    ctx.fillText("rank", 1240, 530);
    ctx.fillText("joined", 1240, 609);

    // Draw right data
    ctx.fillStyle = '#fff';
    ctx.font = '20px "Geist Mono", "Arial"';
    ctx.fillText(username, 1240, 161);
    ctx.fillText(inviter, 1240, 240);
    ctx.fillText("#" + memberCount, 1240, 400);
    ctx.fillText(coordinates, 1240, 478);
    ctx.fillText("explorer", 1240, 558);
    ctx.fillText(date, 1240, 638);

    if (randomPercentage > 95) {
        ctx.fillStyle = '#71FF7B'; // green
    } else if (randomPercentage > 85) {
        ctx.fillStyle = '#FFD700'; // yellow
    } else {
        ctx.fillStyle = '#FFA500'; // orange
    }
    ctx.fillText(randomPercentage + '%', 1240, 320);

    return canvas.toBuffer();
}

module.exports = { createWelcomeCard };