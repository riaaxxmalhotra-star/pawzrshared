const sharp = require('sharp');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');
const logoPath = path.join(assetsDir, 'original-logo.png');

async function resizeLogo() {
  try {
    // Generate main icon (1024x1024) with rounded corners for iOS
    await sharp(logoPath)
      .resize(1024, 1024, { fit: 'cover' })
      .png()
      .toFile(path.join(assetsDir, 'icon.png'));
    console.log('✓ Generated icon.png (1024x1024)');

    // Generate adaptive icon (1024x1024) for Android
    await sharp(logoPath)
      .resize(1024, 1024, { fit: 'cover' })
      .png()
      .toFile(path.join(assetsDir, 'adaptive-icon.png'));
    console.log('✓ Generated adaptive-icon.png (1024x1024)');

    // Generate splash icon (200x200)
    await sharp(logoPath)
      .resize(200, 200, { fit: 'cover' })
      .png()
      .toFile(path.join(assetsDir, 'splash-icon.png'));
    console.log('✓ Generated splash-icon.png (200x200)');

    // Generate favicon (48x48)
    await sharp(logoPath)
      .resize(48, 48, { fit: 'cover' })
      .png()
      .toFile(path.join(assetsDir, 'favicon.png'));
    console.log('✓ Generated favicon.png (48x48)');

    console.log('\n✅ All icons generated from your logo!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resizeLogo();
