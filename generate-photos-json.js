const fs = require('fs');
const path = require('path');

async function generatePhotosJson() {
  const photosDir = path.join(__dirname, 'photos');
  const hiddenDir = path.join(photosDir, 'hidden');
  
  const getFiles = (dir) => {
    try {
      return fs.readdirSync(dir)
        .filter(file => /\.(jpg|jpeg|png|gif|mp4)$/i.test(file))
        .map(file => ({
          name: file,
          path: path.relative(__dirname, path.join(dir, file)).replace(/\\/g, '/')
        }));
    } catch (error) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }
  };

  const photos = {
    regular: getFiles(photosDir),
    hidden: getFiles(hiddenDir)
  };

  fs.writeFileSync(
    path.join(__dirname, 'photos.json'),
    JSON.stringify(photos, null, 2)
  );
  console.log('Generated photos.json');
}

generatePhotosJson().catch(console.error);
