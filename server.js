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

// Extract network path headers (proxies, CDNs, load balancers)
function extractNetworkHeaders(req) {
  const headers = {};

  // Standard proxy headers
  const proxyHeaders = [
    'x-forwarded-for',
    'x-forwarded-proto',
    'x-forwarded-host',
    'x-forwarded-port',
    'x-real-ip',
    'x-client-ip',
    'true-client-ip',
    'forwarded'
  ];

  // Cloudflare headers
  const cloudflareHeaders = [
    'cf-connecting-ip',
    'cf-ipcountry',
    'cf-ray',
    'cf-visitor',
    'cf-request-id',
    'cf-connecting-ipv6'
  ];

  // Load balancer headers
  const loadBalancerHeaders = [
    'x-azure-clientip',
    'x-azure-socketip',
    'x-arr-log-id',
    'x-arr-ssl'
  ];

  // CDN and cache headers
  const cdnHeaders = [
    'via',
    'x-cdn',
    'x-cache',
    'x-cache-hits',
    'x-served-by',
    'x-timer',
    'x-edge-location'
  ];

  // Other useful headers
  const otherHeaders = [
    'accept-encoding',
    'accept-language',
    'connection',
    'host',
    'referer',
    'origin'
  ];

  // Combine all header names
  const allHeaders = [
    ...proxyHeaders,
    ...cloudflareHeaders,
    ...loadBalancerHeaders,
    ...cdnHeaders,
    ...otherHeaders
  ];

  // Extract each header if present
  allHeaders.forEach(headerName => {
    const value = req.get(headerName);
    if (value) {
      headers[headerName] = value;
    }
  });

  // Also capture all headers starting with x- that we might have missed
  Object.keys(req.headers).forEach(headerName => {
    if (headerName.startsWith('x-') && !headers[headerName]) {
      headers[headerName] = req.headers[headerName];
    }
  });

  return headers;
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

    // Extract network path headers
    const networkHeaders = extractNetworkHeaders(req);

    // Determine the real client IP (considering proxies)
    const realClientIp = req.get('cf-connecting-ip') ||
                         req.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                         req.get('x-real-ip') ||
                         req.get('true-client-ip') ||
                         req.ip ||
                         req.connection.remoteAddress;

    // Add server-side metadata
    const dataToStore = {
      referenceId,
      submittedAt: new Date().toISOString(),
      clientIp: realClientIp,
      userAgent: req.get('user-agent'),
      networkHeaders,
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

    // Log diagnostics submission with network path information
    console.log(`Diagnostics saved: ${referenceId}`);
    console.log(`  Client IP: ${realClientIp}`);

    // Log proxy/CDN information if present
    if (networkHeaders['cf-ray']) {
      console.log(`  Cloudflare Ray ID: ${networkHeaders['cf-ray']}`);
    }
    if (networkHeaders['cf-ipcountry']) {
      console.log(`  Country: ${networkHeaders['cf-ipcountry']}`);
    }
    if (networkHeaders['x-forwarded-for']) {
      console.log(`  X-Forwarded-For: ${networkHeaders['x-forwarded-for']}`);
    }
    if (networkHeaders['via']) {
      console.log(`  Via: ${networkHeaders['via']}`);
    }

    const capturedHeadersCount = Object.keys(networkHeaders).length;
    console.log(`  Network headers captured: ${capturedHeadersCount}`);

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
