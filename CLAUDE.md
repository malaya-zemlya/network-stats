# Web Project Guidelines

This project is a Node.js-based web application using Express.
The purpose of the project is to collect data from the browser in order to
help the networking team to debug any customer issues.

Javascript running in the browser collects necessary data from the browser
and posts it to the server via an API call. 
The server returns a unique id to the browser UI. The custome can refer to this unique id when talking to the customer support.

##Project Structure

- **server.js**: Main server file and entry point
- **public/**: Static files served to the client
  - **index.html**: Main HTML page
  - **css/**: Stylesheets
  - **js/**: Client-side JavaScript
- **package.json**: Project configuration and dependencies

## Code Quality Standards

### JavaScript/Node.js
- Use modern ES6+ syntax (const/let, arrow functions, async/await)
- Use ES modules (import/export) not CommonJS (require)
- Follow consistent naming conventions
- Handle errors properly with try/catch
- Use ESLint for code linting

### HTML
- Use semantic HTML5 elements
- Include proper meta tags
- Ensure accessibility (ARIA labels, alt text)
- Keep structure clean and well-indented

### CSS
- Use CSS custom properties (variables) for theming
- Mobile-first responsive design
- Organize styles logically (reset, layout, components)
- Use meaningful class names
- Avoid inline styles

### Client-side JavaScript
- Separate concerns (DOM manipulation, data fetching, business logic)
- Use async/await for API calls
- Add event listeners properly
- Handle errors gracefully
- Keep functions small and focused

## Development Workflow

### Setup
1. Copy `.env.example` to `.env` and configure
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`

### Running the Application
- Development (with auto-reload): `npm run dev`
- Production: `npm start`
- The server runs on `http://localhost:3000` by default

### Adding Dependencies
```bash
# Runtime dependency
npm install package-name

# Development dependency
npm install --save-dev package-name
```

## API Development

### Creating Routes
- RESTful endpoint naming
- Proper HTTP methods (GET, POST, PUT, DELETE)
- Return appropriate status codes
- Use JSON for API responses

### Example API Route
```javascript
app.get('/api/resource', (req, res) => {
  res.json({ data: 'your data' });
});
```

## Security Best Practices

1. Never commit `.env` files
2. Validate and sanitize user input
3. Use HTTPS in production
4. Set appropriate CORS policies
5. Keep dependencies updated
6. Use environment variables for secrets

## File Organization

### Adding New Pages
1. Create HTML file in `public/`
2. Add corresponding CSS in `public/css/`
3. Add JavaScript in `public/js/`
4. Add route in `server.js` if needed

### Static Assets
- Place in appropriate `public/` subdirectories
- Reference using absolute paths from root (e.g., `/css/style.css`)

## Common Commands

```bash
# Install dependencies
npm install

# Start development server (auto-reload)
npm run dev

# Start production server
npm start

# Lint code
npx eslint .
```

## Best Practices

1. Keep server and client code separate
2. Use meaningful variable and function names
3. Comment complex logic
4. Keep functions small and focused
5. Handle errors explicitly
6. Test API endpoints thoroughly
7. Optimize images and assets
8. Use consistent code formatting
