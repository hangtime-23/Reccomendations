// The Movie Database (TMDB) API Key
const TMDB_API_KEY = '3f32b0d37cec9744ea7f339b5b53fb52'; // Sign up for free at https://www.themoviedb.org/settings/api
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

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
    if (!TMDB_API_KEY || TMDB_API_KEY === 'YOUR_TMDB_API_KEY_HERE') {
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
            
            return {
                score: score,
                summary: summary,
                tmdbId: result.id,
                posterPath: result.poster_path
            };
        }
    } catch (error) {
        console.error(`Error fetching TMDB data for "${title}":`, error);
    }
    
    return { score: 'N/A', summary: 'Summary not available' };
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

function renderSection(sectionId, movies) {
    const section = document.getElementById(sectionId);
    const grid = section.querySelector('.movies-grid');
    grid.innerHTML = '';

    movies.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        
        const scoreClass = movie.score !== 'N/A' ? 
            (movie.score >= 70 ? 'high-score' : movie.score >= 50 ? 'medium-score' : 'low-score') : '';
        
        card.innerHTML = `
            <div class="movie-info">
                <h3>${movie.Name || 'Unknown'}</h3>
                <p class="type">🎞️ ${movie.Type || 'N/A'}</p>
                <p class="recommended"><strong>Recommended by:</strong> ${movie['Recommended by'] || 'Unknown'}</p>
                <p class="status"><strong>Status:</strong> ${movie.Status || 'Unknown'}</p>
                
                <div class="score-section">
                    <span class="score-label">🍅 Rotten Tomatoes Score:</span>
                    <span class="score ${scoreClass}">${movie.score}${movie.score !== 'N/A' ? '%' : ''}</span>
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
