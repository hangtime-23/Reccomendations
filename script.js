// The Movie Database (TMDB) API Key
const TMDB_API_KEY = '3f32b0d37cec9744ea7f339b5b53fb52'; // Sign up for free at https://www.themoviedb.org/settings/api
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const WATCH_REGION = 'NZ'; // New Zealand

// Quick runtime debug to confirm the API key is available in the browser environment
// (Remove this log if you don't want the key visible in console.)
console.log('TMDB_API_KEY present:', !!TMDB_API_KEY, 'length:', (TMDB_API_KEY || '').length);

// Google Sheet CSV export URL
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1uxSoc4gFHb2B4BF29VJVHWrAG7-L4Mr08xrd2XBdPpI/export?format=csv';

async function loadMoviesFromSheet() {
    try {
        const response = await fetch(SHEET_URL);
        const csvText = await response.text();
        const movies = parseCSV(csvText);
        
        // Fetch additional data from TMDB for each movie
        const enrichedMovies = await Promise.all(
            movies.map(async (movie) => {
                const tmdbData = await fetchTMDBData(movie.Name, movie.Type);
                return { ...movie, ...tmdbData };
            })
        );
        
        renderMovies(enrichedMovies);
    } catch (error) {
        console.error('Error loading movies:', error);
    }
}

async function fetchTMDBData(title, type) {
    // Treat empty string or common placeholder as missing
    if (!TMDB_API_KEY || TMDB_API_KEY.trim() === '' || TMDB_API_KEY === 'YOUR_TMDB_API_KEY_HERE') {
        return { score: 'N/A', summary: 'API key not configured' };
    }
    
    try {
        const searchType = type && type.toLowerCase() === 'tv' ? 'tv' : 'movie';
        const endpoint = `${TMDB_BASE_URL}/search/${searchType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`;
        
        const response = await fetch(endpoint);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            const result = data.results[0];
            // Convert TMDB vote average (0-10) to Rotten Tomatoes style (0-100)
            const score = Math.round(result.vote_average * 10);
            const summary = result.overview || 'No summary available';
            
            // Fetch detailed information including genres, runtime, cast, and watch providers
            const detailsData = await fetchTMDBDetails(result.id, searchType);
            const watchProvidersData = await fetchWatchProviders(result.id, searchType);
            
            return {
                score: score,
                summary: summary,
                tmdbId: result.id,
                posterPath: result.poster_path,
                genres: detailsData.genres,
                runtime: detailsData.runtime,
                leadActors: detailsData.leadActors,
                searchType: searchType,
                watchProviders: watchProvidersData
            };
        }
    } catch (error) {
        console.error(`Error fetching TMDB data for "${title}":`, error);
    }
    
    return { 
        score: 'N/A', 
        summary: 'Summary not available',
        genres: 'N/A',
        runtime: 'N/A',
        leadActors: 'N/A',
        tmdbId: null,
        searchType: 'movie',
        watchProviders: { flatrate: [], rent: [] }
    };
}

async function fetchTMDBDetails(tmdbId, searchType) {
    try {
        const detailsEndpoint = `${TMDB_BASE_URL}/${searchType}/${tmdbId}?api_key=${TMDB_API_KEY}`;
        const creditsEndpoint = `${TMDB_BASE_URL}/${searchType}/${tmdbId}/credits?api_key=${TMDB_API_KEY}`;
        
        const [detailsResponse, creditsResponse] = await Promise.all([
            fetch(detailsEndpoint),
            fetch(creditsEndpoint)
        ]);
        
        const detailsData = await detailsResponse.json();
        const creditsData = await creditsResponse.json();
        
        // Extract genres
        const genres = detailsData.genres && detailsData.genres.length > 0 
            ? detailsData.genres.map(g => g.name).join(', ')
            : 'N/A';
        
        // Extract runtime
        let runtime = 'N/A';
        if (searchType === 'movie' && detailsData.runtime) {
            runtime = `${detailsData.runtime} min`;
        } else if (searchType === 'tv' && detailsData.episode_run_time && detailsData.episode_run_time.length > 0) {
            runtime = `${detailsData.episode_run_time[0]} min/ep`;
        }
        
        // Extract lead actors (top 3 cast members)
        let leadActors = 'N/A';
        if (creditsData.cast && creditsData.cast.length > 0) {
            const topActors = creditsData.cast.slice(0, 3).map(actor => actor.name);
            leadActors = topActors.join(', ');
        }
        
        return { genres, runtime, leadActors };
    } catch (error) {
        console.error(`Error fetching TMDB details for ID ${tmdbId}:`, error);
        return { genres: 'N/A', runtime: 'N/A', leadActors: 'N/A' };
    }
}

async function fetchWatchProviders(tmdbId, searchType) {
    try {
        const endpoint = `${TMDB_BASE_URL}/${searchType}/${tmdbId}/watch/providers?api_key=${TMDB_API_KEY}`;
        const response = await fetch(endpoint);
        const data = await response.json();
        
        // Get New Zealand watch providers
        if (data.results && data.results[WATCH_REGION]) {
            const nzProviders = data.results[WATCH_REGION];
            return {
                flatrate: nzProviders.flatrate || [],
                rent: nzProviders.rent || []
            };
        }
    } catch (error) {
        console.error(`Error fetching watch providers for ID ${tmdbId}:`, error);
    }
    
    return { flatrate: [], rent: [] };
}

function parseCSV(csvText) {
    const lines = [];
    let currentLine = '';
    let insideQuotes = false;

    // Parse CSV properly handling quoted fields
    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];

        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                // Escaped quote
                currentLine += '"';
                i++;
            } else {
                // Toggle quote state
                insideQuotes = !insideQuotes;
            }
        } else if (char === '\n' && !insideQuotes) {
            // End of line (only if not inside quotes)
            lines.push(currentLine);
            currentLine = '';
        } else if (char === '\r') {
            // Skip carriage returns
            continue;
        } else {
            currentLine += char;
        }
    }

    if (currentLine) {
        lines.push(currentLine);
    }

    // Parse headers
    const headers = parseCSVLine(lines[0]);
    const movies = [];

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue; // Skip empty lines

        const values = parseCSVLine(lines[i]);
        const movie = {};
        headers.forEach((header, index) => {
            movie[header] = values[index] || '';
        });
        movies.push(movie);
    }

    return movies;
}

function parseCSVLine(line) {
    const values = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                // Escaped quote
                currentValue += '"';
                i++;
            } else {
                // Toggle quote state
                insideQuotes = !insideQuotes;
            }
        } else if (char === ',' && !insideQuotes) {
            // Comma outside quotes = field separator
            values.push(currentValue.trim());
            currentValue = '';
        } else {
            currentValue += char;
        }
    }

    values.push(currentValue.trim());
    return values;
}

function renderMovies(movies) {
    const watched = movies.filter(m => m.Status === 'Watched');
    const toWatch = movies.filter(m => m.Status !== 'Watched');

    renderSection('to-watch', toWatch);
    renderSection('watched', watched);
}

function renderWatchProviders(providers) {
    let html = '';
    
    if (!providers) {
        return '<p class="no-providers">Not available in New Zealand</p>';
    }
    
    const { flatrate = [], rent = [] } = providers;
    
    // Stream (subscription)
    if (flatrate && flatrate.length > 0) {
        html += '<div class="provider-group">';
        html += '<h4>Stream</h4>';
        html += '<div class="providers-list">';
        flatrate.forEach(provider => {
            html += `<div class="provider-item" title="${provider.provider_name}">
                        <img src="https://image.tmdb.org/t/p/original${provider.logo_path}" alt="${provider.provider_name}">
                        <span class="provider-name">${provider.provider_name}</span>
                    </div>`;
        });
        html += '</div></div>';
    }
    
    // Rent
    if (rent && rent.length > 0) {
        html += '<div class="provider-group">';
        html += '<h4>Rent</h4>';
        html += '<div class="providers-list">';
        rent.forEach(provider => {
            html += `<div class="provider-item" title="${provider.provider_name}">
                        <img src="https://image.tmdb.org/t/p/original${provider.logo_path}" alt="${provider.provider_name}">
                        <span class="provider-name">${provider.provider_name}</span>
                    </div>`;
        });
        html += '</div></div>';
    }
    
    // If no providers found
    if (!html) {
        html = '<p class="no-providers">Not available for streaming in New Zealand</p>';
    }
    
    return html;
}

function renderSection(sectionId, movies) {
    const section = document.getElementById(sectionId);
    const grid = section.querySelector('.movies-grid');
    grid.innerHTML = '';

    movies.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        
        const scoreClass = movie.score !== 'N/A' ? 
            (movie.score >= 70 ? 'high-score' : movie.score >= 50 ? 'medium-score' : 'low-score') : '';
        
        // Build the title element - clickable link if TMDB ID exists
        let titleElement = movie.Name || 'Unknown';
        if (movie.tmdbId) {
            const tmdbUrl = `https://www.themoviedb.org/${movie.searchType}/${movie.tmdbId}`;
            titleElement = `<a href="${tmdbUrl}" target="_blank" rel="noopener noreferrer">${movie.Name || 'Unknown'}</a>`;
        }
        
        const watchProvidersHtml = renderWatchProviders(movie.watchProviders);
        
        card.innerHTML = `
            <div class="movie-info">
                <h3>${titleElement}</h3>
                <p class="type">🎞️ ${movie.Type || 'N/A'}</p>
                <p class="recommended"><strong>Recommended by:</strong> ${movie['Recommended by'] || 'Unknown'}</p>
                <p class="status"><strong>Status:</strong> ${movie.Status || 'Unknown'}</p>
                
                <p class="genre"><strong>Genre:</strong> ${movie.genres || 'N/A'}</p>
                <p class="runtime"><strong>Runtime:</strong> ${movie.runtime || 'N/A'}</p>
                <p class="cast"><strong>Lead Actors:</strong> ${movie.leadActors || 'N/A'}</p>
                
                <div class="score-section">
                    <span class="score-label">🍅 Rotten Tomatoes Score:</span>
                    <span class="score ${scoreClass}">${movie.score}${movie.score !== 'N/A' ? '%' : ''}</span>
                </div>
                
                <div class="watch-providers-section">
                    <h4 class="watch-title">Where to Watch in NZ 🇳🇿</h4>
                    ${watchProvidersHtml}
                </div>
                
                <div class="summary-section">
                    <p class="summary">${movie.summary}</p>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', loadMoviesFromSheet);
