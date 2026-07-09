# Premier League Standings Website

A beautiful, responsive website displaying the Premier League standings with all match statistics.

## Features

✨ **Complete Statistics**
- Team Position and Name
- Matches Played (P)
- Wins (W), Draws (D), Losses (L)
- Goals For (GF) and Goals Against (GA)
- Goal Difference (GD)
- Total Points (Pts)

🎨 **Color-Coded Zones**
- 🟢 **Green** (Top 4): Champions League Qualification
- 🟠 **Orange** (5-6): European Competition Qualification
- 🔴 **Red** (18-20): Relegation Zone

📱 **Responsive Design**
- Works perfectly on desktop, tablet, and mobile
- Smooth animations and hover effects
- Professional UI with gradient backgrounds

⚡ **Interactive Features**
- Refresh button to update standings
- Auto-calculated points and goal difference
- Real-time timestamp of last update
- Automatic sorting by position

## How to Use

1. Open `index.html` in your web browser
2. View the current Premier League standings
3. Click "Refresh Data" to update the display
4. Use on any device - fully responsive design

## Files

- `index.html` - Main HTML structure
- `styles.css` - Responsive styling and animations
- `script.js` - Logic and Premier League data
- `README.md` - This documentation file

## Customization

### Update Team Data

Edit the `standingsData` array in `script.js`:

```javascript
const standingsData = [
    { position: 1, team: 'Team Name', played: 15, wins: 12, draws: 2, losses: 1, gf: 38, ga: 12 },
    // ... more teams
];
```

### Connect to a Real API

Replace the static data with API calls:

```javascript
async function fetchStandings() {
    const response = await fetch('https://api.football-data.org/v4/competitions/PL/standings');
    const data = await response.json();
    // Process and display data
}
```

Popular football API options:
- [football-data.org](https://www.football-data.org/)
- [RapidAPI - Football API](https://rapidapi.com/api-sports/api/api-football)
- [ESPN API](https://www.espn.com/apis/site/index.html)

### Change Theme Colors

Modify the gradient colors in `styles.css`:

```css
body {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

## Zone Descriptions

| Zone | Positions | Description |
|------|-----------|----------|
| Champions League | 1-4 | Qualify for UEFA Champions League |
| Europa League | 5-6 | Qualify for UEFA Europa League |
| Main | 7-17 | Mid-table teams |
| Relegation | 18-20 | Risk of demotion to Championship |

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

Free to use and modify.

## Future Enhancements

- [ ] Live API integration
- [ ] Team statistics detail view
- [ ] Fixture/Results history
- [ ] Dark mode toggle
- [ ] Mobile app version
- [ ] Historical standings comparison
