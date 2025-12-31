# network_stats

A simple interactive web application template built with Node.js and Express.

## Features

- Express.js web server
- Static file serving
- RESTful API endpoints
- Modern HTML5/CSS3/JavaScript
- Responsive design
- Interactive UI components

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
