const photoElement = document.getElementById('randomPhoto');
const newPhotoBtn = document.getElementById('newPhotoBtn');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

let photos = [];
let currentPhoto = '';

// Function to fetch all photos from the API or static JSON
async function loadPhotos() {
    const isGitHubPages = window.location.hostname.includes('github.io');
    const basePath = isGitHubPages ? '/Happy-Birthday-Dean-' : '';
    
    // Try to load from photos.json first (works for GitHub Pages)
    try {
        const response = await fetch(`${basePath}/photos.json`);
        if (response.ok) {
            const data = await response.json();
            console.log('Photos loaded from photos.json:', data);
            return data;
        }
    } catch (e) {
        console.log('Could not load from photos.json, trying API...');
    }
    
    // Fall back to API if photos.json not found (for local development)
    try {
        const response = await fetch(`${basePath}/api/photos`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Photos loaded from API:', data);
        // Update data to handle new path format
        data.regular = data.regular.map(photo => {
            if (typeof photo === 'string') {
                return { path: `photos/${photo}`, name: photo };
            }
            return photo; // Already in the correct format
        });
        return data;
    } catch (error) {
        console.error('Error loading photos:', error);
        return { regular: [], hidden: [] };
    }
}

// Function to get a random photo from the array
function getRandomPhoto() {
    if (photos.length === 0) return 'placeholder.jpg';
    const randomIndex = Math.floor(Math.random() * photos.length);
    
    // Handle both object format {path, name} and string format
    const photo = photos[randomIndex];
    const isGitHubPages = window.location.hostname.includes('github.io');
    
    let photoPath;
    
    if (typeof photo === 'object' && photo.path) {
        // If the path is already a full URL or starts with http, use it as is
        if (photo.path.startsWith('http') || photo.path.startsWith('//')) {
            return photo.path;
        }
        
        // Use the path from photos.json directly
        photoPath = photo.path;
        
        // For GitHub Pages, ensure proper encoding and path structure
        if (isGitHubPages) {
            // Remove the repository name from the path if it exists
            photoPath = photoPath.replace('Happy-Birthday-Dean-/', '');
            // Encode the filename properly for URLs
            const pathParts = photoPath.split('/');
            const encodedParts = pathParts.map(part => encodeURIComponent(part));
            photoPath = `/Happy-Birthday-Dean-/${encodedParts.join('/')}`;
            console.log('GitHub Pages photo path:', photoPath);
        } else {
            // For local development, use relative path
            photoPath = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
        }
    } else {
        // Handle string format
        photoPath = typeof photo === 'string' ? photo : 'placeholder.jpg';
        if (!photoPath.startsWith('photos/') && !photoPath.startsWith('/photos/')) {
            photoPath = `photos/${photoPath}`;
        }
        
        if (isGitHubPages) {
            const pathParts = photoPath.split('/');
            const encodedParts = pathParts.map(part => encodeURIComponent(part));
            photoPath = `/Happy-Birthday-Dean-/${encodedParts.join('/')}`;
        }
    }
    
    return photoPath;
}

// Function to update the displayed photo with a fade effect
function updatePhoto(photoPath = '') {
    photoElement.style.opacity = 0;
    
    setTimeout(() => {
        if (photoPath) {
            // If a specific photo path is provided, use it
            photoElement.src = photoPath;
            photoElement.alt = 'Searched Photo';
            currentPhoto = photoPath;
        } else if (photos.length > 0) {
            // Otherwise, show a random photo
            const randomPhoto = getRandomPhoto();
            photoElement.src = randomPhoto;
            photoElement.alt = 'Random Photo';
            currentPhoto = randomPhoto;
        } else {
            // No photos available
            photoElement.src = 'placeholder.jpg';
            photoElement.alt = 'No photos found';
            currentPhoto = '';
        }
        photoElement.style.opacity = 1;
    }, 300);
}

// Function to search for hidden photos
async function searchPhotos(query) {
    const isGitHubPages = window.location.hostname.includes('github.io');
    
    if (isGitHubPages) {
        // For GitHub Pages, search through the loaded photos data
        const data = await loadPhotos();
        const allPhotos = [...(data.regular || []), ...(data.hidden || [])];
        
        const results = allPhotos.filter(photo => 
            photo.name.toLowerCase().includes(query.toLowerCase())
        );
        
        if (results.length > 0) {
            // Show the first matching photo
            const photo = results[0];
            const pathParts = photo.path.split('/');
            const encodedParts = pathParts.map(part => encodeURIComponent(part));
            const photoPath = `/Happy-Birthday-Dean-/${encodedParts.join('/')}`;
            updatePhoto(photoPath);
        } else {
            alert('No matching photos found');
        }
    } else {
        // For local development, use the API
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const results = await response.json();
            
            if (results.length > 0) {
                // Show the first matching photo
                updatePhoto(results[0].path);
            } else {
                alert('No matching photos found');
            }
        } catch (error) {
            console.error('Search error:', error);
            alert('Error searching for photos');
        }
    }
}

// Load a random photo when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM fully loaded');
    
    // Try to load photos from the directory
    const data = await loadPhotos();
    
    // Process regular photos to ensure they have the correct path format
    photos = (data.regular || []).map(photo => {
        if (typeof photo === 'string') {
            return { path: `photos/${photo}`, name: photo };
        }
        return photo; // Already in the correct format
    });
    
    if (photos.length === 0) {
        console.warn('No regular photos found in the photos directory.');
    } else {
        console.log(`Successfully loaded ${photos.length} media files`);
    }
    
    updatePhoto();
});

// Event Listeners
newPhotoBtn.addEventListener('click', () => updatePhoto());

searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
        searchPhotos(query);
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
            searchPhotos(query);
        }
    }
});
