const fs = require('fs');
const path = require('path');

async function generatePhotosJson() {
  const photosDir = path.join(__dirname, 'photos');
  const hiddenDir = path.join(photosDir, 'hidden');
  
  const getFiles = (dir) => {
    try {
      return fs.readdirSync(dir)
        .filter(file => /\.(jpg|jpeg|png|gif|mp4)$/i.test(file))
        .map(file => {
          // Get the relative path and normalize it
          const relativePath = path.relative(__dirname, path.join(dir, file));
          // Convert backslashes to forward slashes and remove any leading slashes
          const normalizedPath = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
          
          return {
            name: file,
            path: normalizedPath
          };
        });
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`Directory not found: ${dir}`);
        return [];
      }
      throw error;
    }
  };

  const photos = {
    regular: getFiles(photosDir),
    hidden: getFiles(hiddenDir)
  };

  // Create the output file path
  const outputPath = path.join(__dirname, 'photos.json');
  
  // Write the file
  fs.writeFileSync(
    outputPath,
    JSON.stringify(photos, null, 2)
  );
  
  console.log(`Generated ${outputPath}`);
  console.log('Regular photos:', photos.regular.length);
  console.log('Hidden photos:', photos.hidden.length);
}

generatePhotosJson().catch(console.error);
