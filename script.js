const photoElement = document.getElementById('randomPhoto');
const newPhotoBtn = document.getElementById('newPhotoBtn');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

let photos = [];
let currentPhoto = '';

// Function to fetch all photos from the API or static JSON
async function loadPhotos() {
    // In production (GitHub Pages), load from photos.json
    // In development, try the API endpoint first, then fall back to photos.json
    const isProduction = window.location.hostname.includes('github.io');
    const apiUrl = isProduction ? 'photos.json' : '/api/photos';
    
    try {
        console.log(`Fetching photos from ${apiUrl}`);
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Photos loaded:', data);
        return data; // Returns { regular: [...], hidden: [...] }
    } catch (error) {
        console.error('Error loading photos:', error);
        
        // If we're not in production and the API failed, try loading from photos.json
        if (!isProduction) {
            try {
                console.log('Trying to load from photos.json as fallback');
                const fallbackResponse = await fetch('photos.json');
                if (fallbackResponse.ok) {
                    return await fallbackResponse.json();
                }
            } catch (e) {
                console.error('Fallback loading failed:', e);
            }
        }
        
        return { regular: [], hidden: [] };
    }
}

// Function to get a random photo from the array
function getRandomPhoto() {
    if (photos.length === 0) return 'placeholder.jpg';
    const randomIndex = Math.floor(Math.random() * photos.length);
    
    // Handle both object format {path, name} and string format
    const photo = photos[randomIndex];
    if (typeof photo === 'object' && photo.path) {
        // If the path is already a full URL or starts with http, use it as is
        if (photo.path.startsWith('http') || photo.path.startsWith('//')) {
            return photo.path;
        }
        // Otherwise, ensure it's a relative path
        return photo.path.startsWith('/') ? photo.path : `/${photo.path}`;
    }
    
    // Handle string format
    const photoPath = typeof photo === 'string' ? photo : 'placeholder.jpg';
    return photoPath.startsWith('photos/') || photoPath.startsWith('/photos/') 
        ? photoPath 
        : `photos/${photoPath}`;
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
