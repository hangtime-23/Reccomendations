// Google Sheet CSV export URL
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1uxSoc4gFHb2B4BF29VJVHWrAG7-L4Mr08xrd2XBdPpI/export?format=csv';

async function loadMoviesFromSheet() {
    try {
        const response = await fetch(SHEET_URL);
        const csvText = await response.text();
        const movies = parseCSV(csvText);
        renderMovies(movies);
    } catch (error) {
        console.error('Error loading movies:', error);
    }
}

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const movies = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const movie = {};
        headers.forEach((header, index) => {
            movie[header] = values[index] || '';
        });
        movies.push(movie);
    }
    return movies;
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
        card.innerHTML = `
            <div class="movie-info">
                <h3>${movie.Name}</h3>
                <p class="type">🎞️ ${movie.Type}</p>
                <p class="recommended"><strong>Recommended by:</strong> ${movie['Recommended by']}</p>
                <p class="status"><strong>Status:</strong> ${movie.Status}</p>
            </div>
        `;
        grid.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', loadMoviesFromSheet);
