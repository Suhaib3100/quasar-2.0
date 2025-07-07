const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

// Register the custom font
registerFont(path.join(__dirname, '../assets/GeistMono-Regular.ttf'), { family: 'GeistMono' });

async function createShowcaseCard({
    title,
    description,
    technologies,
    author,
    thumbnailUrl
}) {
    // Create canvas with 16:9 aspect ratio
    const width = 1200;
    const height = 675;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Create gradient background with improved colors
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(0.5, '#1e293b');
    gradient.addColorStop(1, '#334155');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add decorative pattern
    ctx.strokeStyle = '#ffffff0f';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 30) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 100, height);
        ctx.stroke();
    }

    // Add accent line with glow
    const accentGradient = ctx.createLinearGradient(40, 0, width - 40, 0);
    accentGradient.addColorStop(0, '#3b82f6');
    accentGradient.addColorStop(0.5, '#6366f1');
    accentGradient.addColorStop(1, '#8b5cf6');
    ctx.strokeStyle = accentGradient;
    ctx.lineWidth = 4;
    ctx.shadowColor = '#6366f180';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.moveTo(40, 110);
    ctx.lineTo(width - 40, 110);
    ctx.stroke();

    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw title with enhanced gradient
    const titleGradient = ctx.createLinearGradient(40, 0, width - 40, 0);
    titleGradient.addColorStop(0, '#ffffff');
    titleGradient.addColorStop(1, '#e2e2e2');
    ctx.fillStyle = titleGradient;
    ctx.font = 'bold 52px GeistMono';
    const titleY = 40;
    ctx.fillText(title.length > 40 ? title.substring(0, 37) + '...' : title, 40, titleY);

    // Draw description with improved styling
    ctx.fillStyle = '#e2e2e2ee';
    ctx.font = '26px GeistMono';
    const descriptionY = 150;
    const words = description.split(' ');
    let line = '';
    let y = descriptionY;
    for (const word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > width - 80 && line !== '') {
            ctx.fillText(line, 40, y);
            line = word + ' ';
            y += 40;
            if (y > descriptionY + 160) break;
        } else {
            line = testLine;
        }
    }
    if (line !== '' && y <= descriptionY + 160) {
        ctx.fillText(line, 40, y);
    }

    // Draw technologies with modern badge style
    if (technologies && technologies.length > 0) {
        ctx.font = 'bold 22px GeistMono';
        const techY = height - 120;
        const techArray = Array.isArray(technologies) ? technologies : technologies.split(',').map(tech => tech.trim());
        let techX = 40;
        
        for (const tech of techArray) {
            if (techX > width - 200) break;
            
            const metrics = ctx.measureText(tech);
            const padding = 15;
            const badgeWidth = metrics.width + padding * 2;
            const badgeHeight = 36;
            
            // Draw badge background
            const badgeGradient = ctx.createLinearGradient(techX, techY, techX + badgeWidth, techY);
            badgeGradient.addColorStop(0, '#3b82f620');
            badgeGradient.addColorStop(1, '#8b5cf620');
            ctx.fillStyle = badgeGradient;
            ctx.beginPath();
            ctx.roundRect(techX, techY - badgeHeight/2, badgeWidth, badgeHeight, 8);
            ctx.fill();
            
            // Draw badge text
            ctx.fillStyle = '#8b5cf6';
            ctx.fillText(tech, techX + padding, techY - 8);
            
            techX += badgeWidth + 10;
        }
    }

    // Draw author info with subtle styling
    ctx.font = '20px GeistMono';
    ctx.fillStyle = '#a0a0a0';
    ctx.fillText(`Created by ${author.username}`, 40, height - 40);

    // Draw thumbnail with improved styling
    if (thumbnailUrl) {
        try {
            const thumbnail = await loadImage(thumbnailUrl);
            const thumbSize = 200;
            const thumbX = width - thumbSize - 40;
            const thumbY = height - thumbSize - 40;
            
            // Draw thumbnail background with gradient
            const thumbGradient = ctx.createLinearGradient(thumbX - 10, thumbY - 10, thumbX + thumbSize + 10, thumbY + thumbSize + 10);
            thumbGradient.addColorStop(0, '#ffffff1a');
            thumbGradient.addColorStop(1, '#ffffff0f');
            ctx.fillStyle = thumbGradient;
            ctx.fillRect(thumbX - 10, thumbY - 10, thumbSize + 20, thumbSize + 20);
            
            // Add thumbnail border
            ctx.strokeStyle = '#ffffff1a';
            ctx.lineWidth = 2;
            ctx.strokeRect(thumbX - 10, thumbY - 10, thumbSize + 20, thumbSize + 20);
            
            // Draw thumbnail
            ctx.drawImage(thumbnail, thumbX, thumbY, thumbSize, thumbSize);
        } catch (error) {
            console.error('Error loading thumbnail:', error);
        }
    }

    return canvas.toBuffer();
}

module.exports = { createShowcaseCard };