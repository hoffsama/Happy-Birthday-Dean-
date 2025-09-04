const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001; // Changed from 3000 to 3001

// Serve static files from the current directory
app.use(express.static(__dirname));

// Helper function to get files from a directory
function getFilesFromDir(dir) {
    return new Promise((resolve, reject) => {
        fs.readdir(dir, (err, files) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    console.log(`Directory ${dir} not found, skipping...`);
                    return resolve([]);
                }
                return reject(err);
            }

            const mediaFiles = files
                .filter(file => {
                    const ext = path.extname(file).toLowerCase();
                    return ['.jpg', '.jpeg', '.png', '.gif', '.mp4'].includes(ext);
                })
                .map(file => ({
                    name: file,
                    path: path.join(dir, file).replace(/\\/g, '/').replace(/^.*?\/photos/, '/photos')
                }));

            resolve(mediaFiles);
        });
    });
}

// Endpoint to list photos
app.get('/api/photos', async (req, res) => {
    try {
        const [regularPhotos, hiddenPhotos] = await Promise.all([
            getFilesFromDir(path.join(__dirname, 'photos')),
            getFilesFromDir(path.join(__dirname, 'photos', 'hidden'))
        ]);
        
        // Make sure both arrays are properly formatted
        const formatPhotos = (photos, basePath = '') => {
            return photos.map(photo => ({
                name: photo.name || path.basename(photo.path || photo),
                path: photo.path || `${basePath}${photo}`
            }));
        };
        
        res.json({
            regular: formatPhotos(regularPhotos, 'photos/'),
            hidden: formatPhotos(hiddenPhotos, 'photos/hidden/')
        });
    } catch (error) {
        console.error('Error reading photos:', error);
        res.status(500).json({ error: 'Could not read photos directory' });
    }
});

// Endpoint to search for hidden photos (exact match required)
app.get('/api/search', async (req, res) => {
    const query = (req.query.q || '').toLowerCase();
    if (!query) return res.json([]);
    
    try {
        const hiddenDir = path.join(__dirname, 'photos', 'hidden');
        const files = await getFilesFromDir(hiddenDir);
        
        // Find exact match (case insensitive for the filename without extension)
        const result = files.find(file => {
            const fileName = file.name.toLowerCase();
            const queryWithoutExt = query.replace(/\.[^/.]+$/, ''); // Remove extension if provided
            return fileName === query || 
                   fileName === `${query}.jpg` || 
                   fileName === `${query}.jpeg` || 
                   fileName === `${query}.png` ||
                   fileName === `${query}.gif` ||
                   fileName === `${query}.mp3` ||
                   fileName === `${query}.mp4`;
        });
        
        res.json(result ? [result] : []);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Serve the main HTML file for all other routes
app.get('/{*any}', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const server = app.listen(PORT, '0.0.0.0')
    .on('listening', () => {
        console.log(`Server is running on http://localhost:${PORT}`);
        console.log(`Hold ctrl then click on URL above`);
    })
    .on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`Port ${PORT} is already in use. Please close any other running instances.`);
            console.log(`To find and stop the process using port ${PORT}, run this command in a new terminal:`);
            console.log('For Windows:');
            console.log(`  netstat -ano | findstr :${PORT}`);
            console.log('  taskkill /PID <PID> /F');
            console.log('For Mac/Linux:');
            console.log(`  lsof -i :${PORT}`);
            console.log('  kill -9 <PID>');
        } else {
            console.error('Server error:', err);
        }
        process.exit(1);
    });
