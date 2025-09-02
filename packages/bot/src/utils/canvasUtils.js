const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

class CanvasUtils {
    static async createProjectShowcaseImage(project, user) {
        const canvas = createCanvas(1280, 720); // Same size as leaderboard
        const ctx = canvas.getContext('2d');

        // Set background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const leftPadding = 80;
        const rightPadding = 80;
        const startY = 110;

        // Draw title
        ctx.font = '42px "GeistMono"';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'left';
        ctx.fillText('Project Showcase', leftPadding, 75);

        // Draw vertical lines
        ctx.strokeStyle = '#ffffff33';
        ctx.beginPath();
        // Left line
        ctx.moveTo(leftPadding, startY);
        ctx.lineTo(leftPadding, canvas.height - 80);
        // Right line
        ctx.moveTo(canvas.width - rightPadding, startY);
        ctx.lineTo(canvas.width - rightPadding, canvas.height - 80);
        // Center divider line
        ctx.moveTo(canvas.width/2 - 30, startY);
        ctx.lineTo(canvas.width/2 - 30, canvas.height - 80);
        ctx.stroke();

        // Draw horizontal lines
        ctx.beginPath();
        ctx.moveTo(leftPadding, startY);
        ctx.lineTo(canvas.width - rightPadding, startY);
        ctx.moveTo(leftPadding, canvas.height - 80);
        ctx.lineTo(canvas.width - rightPadding, canvas.height - 80);
        ctx.stroke();

        // Project title
        ctx.font = '36px "GeistMono"';
        ctx.fillStyle = '#71FF7B'; // Brand green
        ctx.textAlign = 'left';
        ctx.fillText(project.title, leftPadding + 30, startY + 80);

        // Calculate available vertical space
        const availableHeight = canvas.height - startY - 80; // Space between top line and bottom line

        // Project description (with word wrap)
        ctx.font = '28px "GeistMono"'; // Increased from 24px
        ctx.fillStyle = '#FFFFFF';
        const words = project.description.split(' ');
        let line = '';
        let y = startY + 140; // Increased spacing from title
        const maxWidth = (canvas.width/2) - leftPadding - 90;
        const lineHeight = 40; // Increased from 35
        
        for (let word of words) {
            const testLine = line + word + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth) {
                ctx.fillText(line, leftPadding + 30, y);
                line = word + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, leftPadding + 30, y);

        // Right side content
        const rightSide = canvas.width/2 + 30;
        const sectionSpacing = (canvas.height - startY - 80) / 3; // Divide available space into 3 sections
        
        // Creator info
        const creatorY = startY + 60;
        ctx.font = '28px "GeistMono"';
        ctx.fillStyle = '#71FF7B'; // Brand green
        ctx.fillText('Created by', rightSide, creatorY);
        
        ctx.font = '32px "GeistMono"';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(user.username, rightSide, creatorY + 40);

        // Technologies section
        const techY = startY + sectionSpacing + 30;
        ctx.font = '28px "GeistMono"';
        ctx.fillStyle = '#71FF7B'; // Brand green
        ctx.fillText('Technologies', rightSide, techY);

        // Technology tags
        let tagY = techY + 40;
        ctx.font = '24px "GeistMono"';
        ctx.fillStyle = '#FFFFFF';
        const tags = Array.isArray(project.technologies) ? project.technologies : [];
        let tagX = rightSide;
        
        for (let tag of tags) {
            const tagWidth = ctx.measureText(tag).width + 20;
            if (tagX + tagWidth > canvas.width - rightPadding - 30) {
                tagX = rightSide;
                tagY += 40;
            }
            
            // Tag background
            ctx.fillStyle = '#ffffff11';
            ctx.fillRect(tagX, tagY - 25, tagWidth, 30);
            
            // Tag text
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(tag, tagX + 10, tagY);
            tagX += tagWidth + 10;
        }

        // Stats
        const statsY = startY + (sectionSpacing * 2) + 30;
        ctx.font = '28px "GeistMono"';
        ctx.fillStyle = '#71FF7B'; // Brand green
        ctx.fillText('Project Stats', rightSide, statsY);

        // Likes count with progress bar
        ctx.font = '24px "GeistMono"';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('Likes', rightSide, statsY + 50);
        
        const barWidth = 300;
        const barHeight = 6;
        const barX = rightSide;
        const barY = statsY + 70;
        const maxLikes = 100; // Example max
        const progress = (project.likes_count || 0) / maxLikes;

        // Draw background bar
        ctx.fillStyle = '#ffffff33';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Draw progress
        ctx.fillStyle = '#71FF7B';
        ctx.fillRect(barX, barY, barWidth * progress, barHeight);

        // Likes count
        ctx.font = '24px "GeistMono"';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`${project.likes_count || 0}`, barX + barWidth + 20, statsY + 50);

        // Add subtle border glow for premium effect
        ctx.strokeStyle = '#71FF7B22';
        ctx.lineWidth = 3;
        ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
        
        return canvas.toBuffer();
    }

    static async createLevelUpImage(user, level) {
        const canvas = createCanvas(1280, 504);
        const ctx = canvas.getContext('2d');

        // Create dark background with gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#000000');
        gradient.addColorStop(1, '#0a0a0a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add subtle background pattern with animated dots
        ctx.fillStyle = '#ffffff08';
        for (let i = 0; i < canvas.width; i += 40) {
            for (let j = 0; j < canvas.height; j += 40) {
                ctx.beginPath();
                ctx.arc(i, j, 1, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Add floating particles for premium effect
        ctx.fillStyle = '#71FF7B15';
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 3 + 1;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Calculate positions
        const leftSection = {
            x: canvas.width * 0.25,
            y: canvas.height / 2
        };
        const rightSection = {
            x: canvas.width * 0.5,
            y: canvas.height / 2
        };

        // Draw vertical separator line with gradient
        const lineGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        lineGradient.addColorStop(0, '#ffffff00');
        lineGradient.addColorStop(0.5, '#ffffff22');
        lineGradient.addColorStop(1, '#ffffff00');
        ctx.strokeStyle = lineGradient;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(canvas.width * 0.45, 40);
        ctx.lineTo(canvas.width * 0.45, canvas.height - 40);
        ctx.stroke();

        // Draw horizontal lines in right section with fade effect
        const horizontalLines = [
            { y: 120, width: canvas.width * 0.5 },  // Above "Level up!"
            { y: 200, width: canvas.width * 0.5 },  // Below "Level up!"
            { y: canvas.height - 120, width: canvas.width * 0.5 }  // Below level
        ];

        horizontalLines.forEach(line => {
            const fadeGradient = ctx.createLinearGradient(
                canvas.width * 0.45, 0,
                canvas.width * 0.45 + line.width, 0
            );
            fadeGradient.addColorStop(0, '#ffffff22');
            fadeGradient.addColorStop(1, '#ffffff00');
            ctx.strokeStyle = fadeGradient;
            ctx.beginPath();
            ctx.moveTo(canvas.width * 0.45, line.y);
            ctx.lineTo(canvas.width * 0.45 + line.width, line.y);
            ctx.stroke();
        });

        try {
            // Load and draw avatar
            const avatarURL = user.displayAvatarURL({ extension: 'png', size: 512 });
            const avatar = await loadImage(avatarURL);
            
            // Draw outer glow
            const glowSize = 160;
            const glowGradient = ctx.createRadialGradient(
                leftSection.x, leftSection.y, 140,
                leftSection.x, leftSection.y, glowSize
            );
            glowGradient.addColorStop(0, '#71FF7B22');
            glowGradient.addColorStop(1, '#71FF7B00');
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(leftSection.x, leftSection.y, glowSize, 0, Math.PI * 2);
            ctx.fill();

            // Draw animated circle segments with gradient effect
            const circleRadius = 140;
            const segments = 12; // Increased number of segments
            const gapSize = 0.15; // Smaller gaps between segments
            
            const segmentGradient = ctx.createLinearGradient(
                leftSection.x - circleRadius, leftSection.y,
                leftSection.x + circleRadius, leftSection.y
            );
            segmentGradient.addColorStop(0, '#71FF7B');
            segmentGradient.addColorStop(1, '#8BE2E7');
            ctx.strokeStyle = segmentGradient;
            ctx.lineWidth = 4;
            
            for (let i = 0; i < segments; i++) {
                const startAngle = (i * Math.PI * 2 / segments);
                const endAngle = startAngle + (Math.PI * 2 / segments) - gapSize;
                
                ctx.beginPath();
                ctx.arc(leftSection.x, leftSection.y, circleRadius, startAngle, endAngle);
                ctx.stroke();

                // Add small dots at segment ends for detail
                ctx.fillStyle = '#71FF7B';
                ctx.beginPath();
                ctx.arc(
                    leftSection.x + Math.cos(startAngle) * circleRadius,
                    leftSection.y + Math.sin(startAngle) * circleRadius,
                    2, 0, Math.PI * 2
                );
                ctx.fill();
            }

            // Draw avatar with inner shadow
            ctx.save();
            ctx.beginPath();
            ctx.arc(leftSection.x, leftSection.y, circleRadius - 10, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(avatar, 
                leftSection.x - (circleRadius - 10), 
                leftSection.y - (circleRadius - 10), 
                (circleRadius - 10) * 2, 
                (circleRadius - 10) * 2
            );

            // Add subtle inner shadow
            const innerShadow = ctx.createRadialGradient(
                leftSection.x, leftSection.y, circleRadius - 40,
                leftSection.x, leftSection.y, circleRadius - 10
            );
            innerShadow.addColorStop(0, '#00000000');
            innerShadow.addColorStop(1, '#00000044');
            ctx.fillStyle = innerShadow;
            ctx.fill();
            ctx.restore();
        } catch (error) {
            console.error('Error loading avatar:', error);
        }

        // Draw text with enhanced styling
        ctx.textAlign = 'left';
        
        // Draw "Level up!" with enhanced glow effect
        const levelUpX = rightSection.x;
        const levelUpY = 170;
        ctx.font = 'bold 48px "GeistMono"';
        
        // Add multiple text glow layers for premium effect
        ctx.shadowColor = '#71FF7B';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#71FF7B';
        ctx.fillText('Level up!', levelUpX, levelUpY);
        
        ctx.shadowColor = '#8BE2E7';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#8BE2E7';
        ctx.fillText('Level up!', levelUpX, levelUpY);
        
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('Level up!', levelUpX, levelUpY);
        ctx.shadowBlur = 0;

        // Draw username with gradient
        const usernameGradient = ctx.createLinearGradient(
            rightSection.x, rightSection.y - 40,
            rightSection.x + 400, rightSection.y - 40
        );
        usernameGradient.addColorStop(0, '#FFFFFF');
        usernameGradient.addColorStop(1, '#FFFFFFAA');
        
        ctx.font = '84px "GeistMono"';
        ctx.fillStyle = usernameGradient;
        ctx.fillText(user.username, levelUpX, rightSection.y);

        // Draw level with enhanced gradient and glow
        const levelGradient = ctx.createLinearGradient(
            levelUpX, rightSection.y + 60,
            levelUpX + 200, rightSection.y + 60
        );
        levelGradient.addColorStop(0, '#71FF7B');
        levelGradient.addColorStop(0.5, '#8BE2E7');
        levelGradient.addColorStop(1, '#FFD700');
        
        // Add celebration sparkles around the level
        ctx.fillStyle = '#FFD700';
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const sparkleX = levelUpX + 100 + Math.cos(angle) * 80;
            const sparkleY = rightSection.y + 100 + Math.sin(angle) * 80;
            const size = Math.random() * 4 + 2;
            
            ctx.beginPath();
            ctx.moveTo(sparkleX - size, sparkleY);
            ctx.lineTo(sparkleX + size, sparkleY);
            ctx.moveTo(sparkleX, sparkleY - size);
            ctx.lineTo(sparkleX, sparkleY + size);
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        ctx.font = 'bold 84px "GeistMono"';
        ctx.fillStyle = levelGradient;
        ctx.shadowColor = '#71FF7B44';
        ctx.shadowBlur = 20;
        ctx.fillText('lvl ' + level, levelUpX, rightSection.y + 100);
        ctx.shadowBlur = 0;

        return canvas.toBuffer();
    }

    static async createLeaderboardImage(users) {
        const canvas = createCanvas(1280, 720);
        const ctx = canvas.getContext('2d');

        // Create dark background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Constants for table layout
        const TABLE_TOP = 100;
        const TABLE_LEFT = 40;
        const TABLE_RIGHT = canvas.width - 40;
        const TABLE_WIDTH = TABLE_RIGHT - TABLE_LEFT;
        const ROW_HEIGHT = 80;
        const HEADER_HEIGHT = 50;

        // Draw table header background
        ctx.fillStyle = '#ffffff08';
        ctx.fillRect(TABLE_LEFT, TABLE_TOP, TABLE_WIDTH, HEADER_HEIGHT);

        // Draw table header text
        ctx.font = '24px "GeistMono"';
        ctx.fillStyle = '#666666';
        ctx.textAlign = 'left';
        ctx.fillText('USER', TABLE_LEFT + 20, TABLE_TOP + 32);
        ctx.textAlign = 'right';
        ctx.fillText('PROGRESS', TABLE_RIGHT - 320, TABLE_TOP + 32);
        ctx.fillText('LEVEL', TABLE_RIGHT - 20, TABLE_TOP + 32);

        // Draw header separator line
        ctx.strokeStyle = '#ffffff11';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(TABLE_LEFT, TABLE_TOP + HEADER_HEIGHT);
        ctx.lineTo(TABLE_RIGHT, TABLE_TOP + HEADER_HEIGHT);
        ctx.stroke();

        // Draw vertical separators
        ctx.strokeStyle = '#ffffff11';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Progress bar section separator
        ctx.moveTo(TABLE_RIGHT - 400, TABLE_TOP);
        ctx.lineTo(TABLE_RIGHT - 400, TABLE_TOP + HEADER_HEIGHT + (ROW_HEIGHT * users.length));
        // Level section separator
        ctx.moveTo(TABLE_RIGHT - 150, TABLE_TOP);
        ctx.lineTo(TABLE_RIGHT - 150, TABLE_TOP + HEADER_HEIGHT + (ROW_HEIGHT * users.length));
        ctx.stroke();

        // Define colors for different ranks
        const rankColors = {
            0: '#71FF7B', // 1st place - green
            1: '#7B94FF', // 2nd place - blue
            2: '#C77BFF', // 3rd place - purple
            default: '#FFFFFF' // Default color
        };

        // Process each user
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const rowY = TABLE_TOP + HEADER_HEIGHT + (i * ROW_HEIGHT);
            const color = rankColors[i] || rankColors.default;

            // Draw row background (alternating)
            if (i % 2 === 0) {
                ctx.fillStyle = '#ffffff04';
                ctx.fillRect(TABLE_LEFT, rowY, TABLE_WIDTH, ROW_HEIGHT);
            }

            try {
                // Load and draw avatar
                if (user.avatarURL) {
                    const avatar = await loadImage(user.avatarURL);
                    const avatarSize = 40;
                    const avatarX = TABLE_LEFT + 20;
                    const avatarY = rowY + (ROW_HEIGHT - avatarSize) / 2;

                    // Draw avatar background/border
                    ctx.beginPath();
                    ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2 + 2, 0, Math.PI * 2);
                    ctx.fillStyle = color;
                    ctx.fill();

                    // Draw avatar
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
                    ctx.clip();
                    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
                    ctx.restore();
                }
            } catch (error) {
                console.error('Error loading avatar:', error);
            }

            // Draw username
            ctx.font = '28px "GeistMono"';
            ctx.fillStyle = color;
            ctx.textAlign = 'left';
            ctx.fillText(user.username, TABLE_LEFT + 80, rowY + (ROW_HEIGHT/2) + 10);

            // Draw level
            ctx.textAlign = 'right';
            ctx.fillStyle = color;
            ctx.fillText(`lvl ${user.level}`, TABLE_RIGHT - 20, rowY + (ROW_HEIGHT/2) + 10);

            // Draw XP progress
            const progressWidth = 250;
            const progressHeight = 6;
            const progressX = TABLE_RIGHT - 370;
            const progressY = rowY + (ROW_HEIGHT/2) + 10;
            const progress = user.xp / user.nextLevelXP;

            // Draw XP text
            ctx.font = '20px "GeistMono"';
            ctx.fillStyle = '#8BE2E7';
            ctx.textAlign = 'left';
            ctx.fillText(`${user.xp}/${user.nextLevelXP} XP`, progressX, progressY - 15);

            // Draw progress bar background
            ctx.fillStyle = '#ffffff11';
            ctx.fillRect(progressX, progressY, progressWidth, progressHeight);

            // Draw progress bar
            ctx.fillStyle = color;
            ctx.fillRect(progressX, progressY, progressWidth * Math.min(progress, 1), progressHeight);

            // Draw row separator
            if (i < users.length - 1) {
                ctx.strokeStyle = '#ffffff11';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(TABLE_LEFT, rowY + ROW_HEIGHT);
                ctx.lineTo(TABLE_RIGHT, rowY + ROW_HEIGHT);
                ctx.stroke();
            }
        }

        // Draw table border
        ctx.strokeStyle = '#ffffff11';
        ctx.lineWidth = 2;
        ctx.strokeRect(TABLE_LEFT, TABLE_TOP, TABLE_WIDTH, HEADER_HEIGHT + (ROW_HEIGHT * users.length));

        // Draw title above table
        ctx.font = '42px "GeistMono"';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'left';
        ctx.fillText('Leaderboard', TABLE_LEFT, TABLE_TOP - 20);

        return canvas.toBuffer();
    }
}

module.exports = CanvasUtils;