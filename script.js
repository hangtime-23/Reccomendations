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
        card.innerHTML = `
            <div class="movie-info">
                <h3>${movie.Name || 'Unknown'}</h3>
                <p class="type">🎞️ ${movie.Type || 'N/A'}</p>
                <p class="recommended"><strong>Recommended by:</strong> ${movie['Recommended by'] || 'Unknown'}</p>
                <p class="status"><strong>Status:</strong> ${movie.Status || 'Unknown'}</p>
            </div>
        `;
        grid.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', loadMoviesFromSheet);
