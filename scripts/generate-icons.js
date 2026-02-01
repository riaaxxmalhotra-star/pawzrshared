const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const assetsDir = path.join(__dirname, '..', 'assets');

// Simple orange paw icon as SVG
const pawSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="1024" height="1024" rx="230" fill="#FFFBF5"/>

  <!-- Main Paw Pad -->
  <ellipse cx="512" cy="600" rx="170" ry="150" fill="#FF6B35"/>

  <!-- Top Left Toe -->
  <ellipse cx="350" cy="360" rx="80" ry="95" fill="#FF6B35"/>

  <!-- Top Right Toe -->
  <ellipse cx="674" cy="360" rx="80" ry="95" fill="#FF6B35"/>

  <!-- Middle Left Toe -->
  <ellipse cx="285" cy="500" rx="70" ry="85" fill="#FF6B35"/>

  <!-- Middle Right Toe -->
  <ellipse cx="739" cy="500" rx="70" ry="85" fill="#FF6B35"/>
</svg>`;

// Adaptive icon (no rounded corners, Android handles that)
const adaptiveSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="1024" height="1024" fill="#FFFBF5"/>

  <!-- Main Paw Pad -->
  <ellipse cx="512" cy="600" rx="170" ry="150" fill="#FF6B35"/>

  <!-- Top Left Toe -->
  <ellipse cx="350" cy="360" rx="80" ry="95" fill="#FF6B35"/>

  <!-- Top Right Toe -->
  <ellipse cx="674" cy="360" rx="80" ry="95" fill="#FF6B35"/>

  <!-- Middle Left Toe -->
  <ellipse cx="285" cy="500" rx="70" ry="85" fill="#FF6B35"/>

  <!-- Middle Right Toe -->
  <ellipse cx="739" cy="500" rx="70" ry="85" fill="#FF6B35"/>
</svg>`;

// Splash icon (smaller, centered paw)
const splashSvg = `<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Main Paw Pad -->
  <ellipse cx="100" cy="118" rx="34" ry="30" fill="#FF6B35"/>

  <!-- Top Left Toe -->
  <ellipse cx="68" cy="70" rx="16" ry="19" fill="#FF6B35"/>

  <!-- Top Right Toe -->
  <ellipse cx="132" cy="70" rx="16" ry="19" fill="#FF6B35"/>

  <!-- Middle Left Toe -->
  <ellipse cx="55" cy="98" rx="14" ry="17" fill="#FF6B35"/>

  <!-- Middle Right Toe -->
  <ellipse cx="145" cy="98" rx="14" ry="17" fill="#FF6B35"/>
</svg>`;

// Favicon (tiny)
const faviconSvg = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="48" height="48" rx="10" fill="#FF6B35"/>

  <!-- Main Paw Pad -->
  <ellipse cx="24" cy="28" rx="9" ry="8" fill="white"/>

  <!-- Top Left Toe -->
  <ellipse cx="16" cy="16" rx="4" ry="5" fill="white"/>

  <!-- Top Right Toe -->
  <ellipse cx="32" cy="16" rx="4" ry="5" fill="white"/>

  <!-- Middle Left Toe -->
  <ellipse cx="13" cy="23" rx="3.5" ry="4.5" fill="white"/>

  <!-- Middle Right Toe -->
  <ellipse cx="35" cy="23" rx="3.5" ry="4.5" fill="white"/>
</svg>`;

async function generateIcons() {
  try {
    // Generate main icon (1024x1024)
    await sharp(Buffer.from(pawSvg))
      .resize(1024, 1024)
      .png()
      .toFile(path.join(assetsDir, 'icon.png'));
    console.log('✓ Generated icon.png (1024x1024)');

    // Generate adaptive icon (1024x1024)
    await sharp(Buffer.from(adaptiveSvg))
      .resize(1024, 1024)
      .png()
      .toFile(path.join(assetsDir, 'adaptive-icon.png'));
    console.log('✓ Generated adaptive-icon.png (1024x1024)');

    // Generate splash icon (200x200)
    await sharp(Buffer.from(splashSvg))
      .resize(200, 200)
      .png()
      .toFile(path.join(assetsDir, 'splash-icon.png'));
    console.log('✓ Generated splash-icon.png (200x200)');

    // Generate favicon (48x48)
    await sharp(Buffer.from(faviconSvg))
      .resize(48, 48)
      .png()
      .toFile(path.join(assetsDir, 'favicon.png'));
    console.log('✓ Generated favicon.png (48x48)');

    console.log('\n✅ All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
