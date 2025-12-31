import express from 'express';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { existsSync } from 'fs';

// Load environment variables
config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const PROFILES_DIR = path.join(__dirname, 'profiles');

// Ensure profiles directory exists
async function ensureProfilesDir() {
  if (!existsSync(PROFILES_DIR)) {
    await fs.mkdir(PROFILES_DIR, { recursive: true });
    console.log('Created profiles directory');
  }
}

// Generate unique reference ID
// Format: XXXXX-XXXXX-XXXXX (5-letter groups, uppercase, no ambiguous chars)
// Excludes: 0, O, I, 1, L (to avoid confusion)
function generateReferenceId() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // No ambiguous characters
  const groupLength = 5;
  const numGroups = 3;

  const groups = [];
  for (let i = 0; i < numGroups; i++) {
    let group = '';
    for (let j = 0; j < groupLength; j++) {
      group += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    groups.push(group);
  }

  return groups.join('-');
}

// Check if reference ID already exists
async function isIdUnique(id) {
  const filename = `${id}.json`;
  const filepath = path.join(PROFILES_DIR, filename);
  return !existsSync(filepath);
}

// Generate unique reference ID (with collision check)
async function generateUniqueReferenceId() {
  let id;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    id = generateReferenceId();
    attempts++;
  } while (!(await isIdUnique(id)) && attempts < maxAttempts);

  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique reference ID');
  }

  return id;
}

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to submit diagnostics
app.post('/api/diagnostics', async (req, res) => {
  try {
    const diagnosticsData = req.body;

    // Validate data
    if (!diagnosticsData || typeof diagnosticsData !== 'object') {
      return res.status(400).json({ error: 'Invalid diagnostics data' });
    }

    // Generate unique reference ID
    const referenceId = await generateUniqueReferenceId();

    // Add server-side metadata
    const dataToStore = {
      referenceId,
      submittedAt: new Date().toISOString(),
      clientIp: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      diagnostics: diagnosticsData
    };

    // Save to file
    const filename = `${referenceId}.json`;
    const filepath = path.join(PROFILES_DIR, filename);

    await fs.writeFile(
      filepath,
      JSON.stringify(dataToStore, null, 2),
      'utf8'
    );

    console.log(`Diagnostics saved: ${referenceId}`);

    // Return reference ID to client
    res.json({
      success: true,
      referenceId,
      message: 'Diagnostics submitted successfully'
    });

  } catch (error) {
    console.error('Error saving diagnostics:', error);
    res.status(500).json({
      error: 'Failed to save diagnostics',
      message: error.message
    });
  }
});

// API endpoint to retrieve diagnostics (for support team)
app.get('/api/diagnostics/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!/^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(id)) {
      return res.status(400).json({ error: 'Invalid reference ID format' });
    }

    const filename = `${id}.json`;
    const filepath = path.join(PROFILES_DIR, filename);

    // Check if file exists
    if (!existsSync(filepath)) {
      return res.status(404).json({ error: 'Diagnostics not found' });
    }

    // Read and return the data
    const data = await fs.readFile(filepath, 'utf8');
    const diagnostics = JSON.parse(data);

    res.json(diagnostics);

  } catch (error) {
    console.error('Error retrieving diagnostics:', error);
    res.status(500).json({
      error: 'Failed to retrieve diagnostics',
      message: error.message
    });
  }
});

// API endpoint example
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from network_stats!' });
});

// Start server
async function startServer() {
  await ensureProfilesDir();

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Profiles directory: ${PROFILES_DIR}`);
  });
}

startServer().catch(console.error);
