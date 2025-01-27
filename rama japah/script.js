const API_KEY = 'AIzaSyANiGeOA6X-PVT98dD74KGIRXBB8c2vERo';

let nextPageToken = ''; // Token to fetch the next set of videos
let isLoading = false; // Flag to prevent multiple simultaneous requests
let firstVideoId = 'dXl2NdlmeIE'; // Default video ID
let currentSearchQuery = ''; // Track the current search query
let totalVideosLoaded = 0; // Keep track of how many videos have been loaded
let displayedVideos = new Set(); // Set to track displayed video IDs
let isLoadingMore = false; // Flag to track if "Show More" button is clicked
let isInitialLoad = true; // Flag to track the initial page load

// Initialize the YouTube API client
function initYouTubeAPI() {
    gapi.client.setApiKey(API_KEY);
    gapi.client.load('youtube', 'v3', () => {
        searchVideos(); // Load the videos based on the default search
        setDefaultVideo(firstVideoId); // Set default video but don't autoplay
    });
}

// Search for videos
function searchVideos(pageToken = '') {
    let searchQuery = document.getElementById('search-input').value || 'bajrang Song'; // Default to "bajrang Song" if no query is entered

    // Always append "Bhakti" to the search query for Bhakti content
    searchQuery += ' Bhakti'; // This ensures only Bhakti-related content is searched

    // If the search query is different from the previous one, reset the video list and nextPageToken
    if (searchQuery !== currentSearchQuery) {
        currentSearchQuery = searchQuery;
        nextPageToken = ''; // Reset nextPageToken for fresh search results
        document.getElementById('video-list-wrapper').innerHTML = ''; // Clear the existing videos
        totalVideosLoaded = 0; // Reset the video counter
        displayedVideos.clear(); // Reset the set of displayed video IDs
        isLoadingMore = false; // Ensure no scrolling happens when starting a fresh search
    }

    const request = gapi.client.youtube.search.list({
        part: 'snippet',
        q: searchQuery, // Use the search query with "Bhakti" keyword
        maxResults: 16, // Show 16 videos at once
        type: 'video',
        videoCategoryId: '10', // Category ID for Music videos
        videoDuration: 'medium', // Filter for medium-length videos (over 4 minutes)
        pageToken: pageToken, // If we have a pageToken, we will load more results
    });

    request.execute((response) => {
        const videos = response.items;
        nextPageToken = response.nextPageToken || null;
        displayVideos(videos); // Display the new videos

        // If less than 16 videos returned, try loading the next set of results
        if (videos.length < 16 && nextPageToken) {
            searchVideos(nextPageToken); // Load the next page to get the missing videos
        }

        nextPageToken ? showShowMoreButton() : hideShowMoreButton(); // Show "Show More" button if available
    });
}

// Display video slides vertically in a grid
function displayVideos(videos) {
    const listWrapper = document.getElementById('video-list-wrapper');

    // Check if there are any videos to display
    if (videos.length === 0) return;

    // Loop through the new videos and append them to the grid
    videos.forEach((video) => {
        // Only add the video if it hasn't been displayed yet
        if (!displayedVideos.has(video.id.videoId)) {
            const videoCard = createVideoCard(video);
            listWrapper.appendChild(videoCard);
            displayedVideos.add(video.id.videoId); // Track this video as displayed
            totalVideosLoaded++; // Increment the total videos loaded
        }
    });

    // Scroll to the top-most video (first video) when new search is performed, but not on "Show More" or initial load
    if (!isLoadingMore && !isInitialLoad) {
        listWrapper.scrollIntoView({ behavior: 'smooth', block: 'end' }); // Scroll to the top-most result
    }

    isInitialLoad = false; // Reset initial load flag after the first display
}

// Create a reusable video card element
function createVideoCard(video) {
    const videoCard = document.createElement('div');
    videoCard.classList.add('video-card');

    const videoThumbnail = document.createElement('img');
    videoThumbnail.src = video.snippet.thumbnails.high.url;

    const videoInfo = document.createElement('div');
    videoInfo.classList.add('video-info');
    const videoTitle = document.createElement('h3');
    videoTitle.textContent = video.snippet.title;
    videoInfo.appendChild(videoTitle);

    videoCard.appendChild(videoThumbnail);
    videoCard.appendChild(videoInfo);

    videoCard.onclick = () => {
        setDefaultVideo(video.id.videoId); // Set the selected video
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to the top
    };

    return videoCard;
}

// Set the default video (but do not autoplay)
function setDefaultVideo(videoId) {
    const iframe = document.getElementById('video-player');
    const wrapper = document.getElementById('video-player-wrapper');

    iframe.src = `https://www.youtube.com/embed/${videoId}?rel=0`; // No autoplay parameter, so the video won't start until clicked
    wrapper.style.display = 'block';
}

// Close video
function closeVideo() {
    const iframe = document.getElementById('video-player');
    const wrapper = document.getElementById('video-player-wrapper');

    iframe.src = ''; // Remove video
    wrapper.style.display = 'none'; // Hide video wrapper
}

// Show or hide the "Show More" button
function showShowMoreButton() {
    document.getElementById('show-more-button').style.display = 'block';
}

function hideShowMoreButton() {
    document.getElementById('show-more-button').style.display = 'none';
}

// Load more videos when the "Show More" button is clicked
function loadMoreVideos() {
    if (isLoading || !nextPageToken || isLoadingMore) return; // If loading or no nextPageToken, do nothing

    isLoadingMore = true; // Set flag to prevent scrolling behavior when loading more videos
    searchVideos(nextPageToken); // Load more videos using the nextPageToken
    isLoadingMore = false; // Reset flag after videos are loaded
}

// Trigger search on pressing Enter key
document.getElementById('search-input').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        searchVideos(); // Search videos and reset the list
    }
});

// Initialize API on load
window.onload = () => {
    gapi.load('client', initYouTubeAPI);
};