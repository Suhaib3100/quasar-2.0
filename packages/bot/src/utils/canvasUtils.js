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

        return canvas.toBuffer();
    }

    static async createLevelUpImage(user, level) {
        const canvas = createCanvas(1280, 504);
        const ctx = canvas.getContext('2d');

        // Create dark background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw vertical lines
        ctx.strokeStyle = '#ffffff33'; // Increased to 20% opacity
        ctx.lineWidth = 1;
        
        // Line between avatar and text
        const dividerX = 450;
        ctx.beginPath();
        ctx.moveTo(dividerX, 0);
        ctx.lineTo(dividerX, canvas.height);
        ctx.stroke();

        // Line near right side (moved closer to edge)
        ctx.beginPath();
        ctx.moveTo(1200, 0);
        ctx.lineTo(1200, canvas.height);
        ctx.stroke();

        // Calculate avatar circle center and size
        const circleRadius = 140; // Increased from 110
        const circleX = dividerX / 2; // Center between left edge and divider line
        const circleY = canvas.height / 2;

        // Draw green ring animation (multiple arcs for effect)
        ctx.strokeStyle = '#71FF7B';
        ctx.lineWidth = 4;
        
        // Draw multiple segments with gaps
        const segments = 8;
        for (let i = 0; i < segments; i++) {
            const startAngle = (i * Math.PI * 2 / segments);
            const endAngle = startAngle + (Math.PI * 2 / segments) * 0.8; // 0.8 creates the gap
            
            ctx.beginPath();
            ctx.arc(circleX, circleY, circleRadius + 20, startAngle, endAngle);
            ctx.stroke();
        }

        // Draw avatar
        try {
            const avatar = await loadImage(user.displayAvatarURL());
            ctx.save();
            
            // Create circular clip for avatar
            ctx.beginPath();
            ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
            ctx.clip();
            
            // Draw avatar image
            const avatarSize = circleRadius * 2;
            ctx.drawImage(avatar, 
                circleX - circleRadius, 
                circleY - circleRadius, 
                avatarSize, 
                avatarSize
            );
            
            ctx.restore();
        } catch (error) {
            console.error('Error loading avatar:', error);
        }

        // Calculate vertical positions for centered text
        const centerY = canvas.height / 2;
        const verticalOffset = 40; // Shift everything down by 40px
        const levelUpY = centerY - 130 + verticalOffset;
        const usernameY = centerY + verticalOffset;
        const levelY = centerY + 80 + verticalOffset;

        // Draw horizontal lines with same style as vertical lines
        ctx.strokeStyle = '#ffffff33';
        ctx.lineWidth = 1;

        // Line above "Level up!"
        ctx.beginPath();
        ctx.moveTo(dividerX, levelUpY - 60);
        ctx.lineTo(1200, levelUpY - 60);
        ctx.stroke();

        // Line below "Level up!"
        ctx.beginPath();
        ctx.moveTo(dividerX, levelUpY + 40);
        ctx.lineTo(1200, levelUpY + 40);
        ctx.stroke();

        // Line below level number
        ctx.beginPath();
        ctx.moveTo(dividerX, levelY + 40);
        ctx.lineTo(1200, levelY + 40);
        ctx.stroke();

        // Draw "Level up!" text
        ctx.font = '42px "GeistMono"';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'left';
        ctx.fillText('Level up!', 500, levelUpY);

        // Draw username
        ctx.font = '84px "GeistMono"';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(user.username, 500, usernameY);
        
        // Draw level
        ctx.fillStyle = '#71FF7B';
        ctx.fillText('lvl ' + level, 500, levelY);

        return canvas.toBuffer();
    }

    static async createLeaderboardImage(users) {
        const canvas = createCanvas(1280, 720);
        const ctx = canvas.getContext('2d');

        // Create dark background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw "Leaderboard" title
        ctx.font = '42px "GeistMono"';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'left';
        ctx.fillText('Leaderboard', 80, 75);

        // Draw "Rank" title
        ctx.textAlign = 'right';
        ctx.fillText('Rank', canvas.width - 80, 75);

        // Process users (showing 8 users now)
        const startY = 110;
        const entryHeight = 70;
        const topUsers = users.slice(0, 8);
        const leftPadding = 80;
        const rightPadding = 80;
        const xpBarX = canvas.width - 400;

        // Draw vertical lines
        ctx.strokeStyle = '#ffffff33';
        ctx.beginPath();
        // Left line
        ctx.moveTo(leftPadding, startY);
        ctx.lineTo(leftPadding, startY + (topUsers.length * entryHeight));
        // Right line
        ctx.moveTo(canvas.width - rightPadding, startY);
        ctx.lineTo(canvas.width - rightPadding, startY + (topUsers.length * entryHeight));
        // XP bar line
        ctx.moveTo(xpBarX - 30, startY);
        ctx.lineTo(xpBarX - 30, startY + (topUsers.length * entryHeight));
        ctx.stroke();

        // Rank colors
        const rankColors = {
            0: '#71FF7B', // Brand green for #1
            1: '#7B94FF', // Brand blue for #2
            2: '#C77BFF', // Brand purple for #3
        };

        for (let i = 0; i < topUsers.length; i++) {
            const user = topUsers[i];
            const y = startY + (i * entryHeight);

            // Draw horizontal line above entry
            ctx.strokeStyle = '#ffffff33';
            ctx.beginPath();
            ctx.moveTo(leftPadding, y);
            ctx.lineTo(canvas.width - rightPadding, y);
            ctx.stroke();

            try {
                // Draw avatar
                const avatar = await loadImage(user.displayAvatarURL());
                const avatarSize = 40;
                const avatarX = leftPadding + 30;
                const avatarY = y + (entryHeight - avatarSize) / 2 + 5;
                
                // Create circular clip for avatar
                ctx.save();
                ctx.beginPath();
                ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
                ctx.clip();
                ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
                ctx.restore();
            } catch (error) {
                console.error('Error loading avatar:', error);
            }

            // Draw username with rank color for top 3
            ctx.font = '32px "GeistMono"';
            ctx.fillStyle = rankColors[i] || '#FFFFFF';
            ctx.textAlign = 'left';
            ctx.fillText('#' + user.username, leftPadding + 100, y + 45);

            // Draw level text
            const levelText = 'lvl ' + user.level;
            ctx.font = '32px "GeistMono"';
            ctx.textAlign = 'right';
            ctx.fillText(levelText, canvas.width - rightPadding - 20, y + 42);

            // Draw progress bar
            const barWidth = 300;
            const barHeight = 6;
            const barX = xpBarX;
            const barY = y + 62;
            const progress = user.xp / user.nextLevelXP;

            // Draw background bar
            ctx.fillStyle = '#ffffff33';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            // Draw progress
            ctx.fillStyle = '#71FF7B';
            ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        }

        // Draw final horizontal line
        ctx.strokeStyle = '#ffffff33';
        ctx.beginPath();
        ctx.moveTo(leftPadding, startY + (topUsers.length * entryHeight));
        ctx.lineTo(canvas.width - rightPadding, startY + (topUsers.length * entryHeight));
        ctx.stroke();

        return canvas.toBuffer();
    }
}

module.exports = CanvasUtils;