# network_stats

A simple web app that collects browser/network diagnostic data and submits it to an Express server to generate a shareable reference ID (useful for customer support and debugging).

## Features

- Express.js web server
- Static file serving
- RESTful API endpoint to accept diagnostics and return a reference ID
- Modern HTML5/CSS3/JavaScript dashboard UI
- Theme switcher (Light, CyberPunk, Colorful)

## Data Collected

The app collects diagnostics **in the browser**. Some fields are **browser/permission dependent** and may show as “Not available”.

- **Browser & device**: user agent-derived browser/OS, screen + viewport size, pixel ratio, cookie + online status.
- **Locale & time**: language(s), timezone name + offset.
- **Network**: connection type/effective type, downlink, RTT, save-data (when supported).
- **Performance**: navigation timing metrics and resource timing entries (names, sizes, durations, protocol).
- **GPU**: WebGL vendor/renderer/version (when supported).
- **Memory**: JS heap statistics via `performance.memory` (Chromium-based browsers) and device RAM via `navigator.deviceMemory` (when supported).
- **Storage**: quota/usage estimates and persistent-storage status via `navigator.storage` (when supported).

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server (with auto-reload)
npm run dev

# Or start production server
npm start
```

Visit `http://localhost:3000` in your browser.

## Project Structure

```
.
├── server.js            # Express server and API routes
├── public/              # Static files
│   ├── index.html       # Main HTML page
│   ├── css/
│   │   └── style.css    # Styles
│   └── js/
│       └── app.js       # Client-side JavaScript
├── package.json         # Dependencies and scripts
├── .env.example         # Environment variables template
├── .gitignore           # Git ignore rules
├── CLAUDE.md            # Development guidelines
└── README.md            # This file
```

## Development

### Adding New Pages

1. Create an HTML file in `public/`
2. Add a route in `server.js`:
   ```javascript
   app.get('/page', (req, res) => {
     res.sendFile(path.join(__dirname, 'public', 'page.html'));
   });
   ```

### Adding API Endpoints

Add routes in `server.js`:
```javascript
app.get('/api/endpoint', (req, res) => {
  res.json({ data: 'your data' });
});
```

### Environment Variables

Configure in `.env`:
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)

## Scripts

- `npm start` - Start the server
- `npm run dev` - Start with auto-reload (Node 18+)

## Technologies

- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Environment**: dotenv

## License

MIT
