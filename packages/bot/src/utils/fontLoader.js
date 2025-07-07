const { registerFont } = require('canvas');
const path = require('path');

function loadFonts() {
    try {
        // Register Geist Mono font with different weights
        registerFont(path.join(__dirname, '../assets/GeistMono-Regular.ttf'), {
            family: 'GeistMono',
            weight: 'normal',
            style: 'normal'
        });

        console.log('✅ Fonts loaded successfully');
    } catch (error) {
        console.error('Error loading fonts:', error);
        // Register fallback font
        console.log('⚠️ Using system fonts as fallback');
    }
}

module.exports = { loadFonts }; 