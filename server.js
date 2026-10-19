const { createServer } = require('https');
const { createServer: createHttpServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

// Tailscale certificate paths - adjust these to match your certificate location
const CERT_DOMAIN = process.env.TAILSCALE_DOMAIN || 'tomgeneraltrading.tail572bbf.ts.net';
const CERT_DIR = process.env.CERT_DIR || '.';

const certPath = path.join(CERT_DIR, `${CERT_DOMAIN}.crt`);
const keyPath = path.join(CERT_DIR, `${CERT_DOMAIN}.key`);

// Check if certificates exist
const hasCerts = fs.existsSync(certPath) && fs.existsSync(keyPath);

console.log('');
console.log('='.repeat(60));
console.log('  AB Pro POS - HTTPS Configuration');
console.log('='.repeat(60));
console.log(`  Domain: ${CERT_DOMAIN}`);
console.log(`  Certificate path: ${certPath}`);
console.log(`  Key path: ${keyPath}`);
console.log(`  Certificates found: ${hasCerts ? 'YES ✓' : 'NO ✗'}`);
console.log('='.repeat(60));
console.log('');

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  if (hasCerts) {
    // HTTPS mode with Tailscale certificates
    const httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };

    createServer(httpsOptions, async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    }).listen(port, hostname, () => {
      console.log('');
      console.log('  ✓ HTTPS Server Started Successfully!');
      console.log('');
      console.log(`  → Access via: https://${CERT_DOMAIN}:${port}`);
      console.log('');
      console.log('  Camera permissions will work on this HTTPS URL.');
      console.log('');
    });

    // Optional: Also start HTTP server on different port for local development
    if (dev) {
      const httpPort = 3001;
      createHttpServer(async (req, res) => {
        try {
          const parsedUrl = parse(req.url, true);
          await handle(req, res, parsedUrl);
        } catch (err) {
          console.error('Error handling request:', err);
          res.statusCode = 500;
          res.end('Internal Server Error');
        }
      }).listen(httpPort, hostname, () => {
        console.log(`  → HTTP fallback: http://localhost:${httpPort}`);
        console.log('');
      });
    }
  } else {
    // HTTP mode (no certificates found)
    console.log('');
    console.log('  ⚠ WARNING: No SSL certificates found!');
    console.log('');
    console.log('  Starting in HTTP mode (camera will NOT work on remote devices)');
    console.log('');
    console.log('  To enable HTTPS for camera access:');
    console.log('');
    console.log('  Option 1: Generate Tailscale certificates');
    console.log(`    Run: tailscale cert ${CERT_DOMAIN}`);
    console.log('    Then restart this server.');
    console.log('');
    console.log('  Option 2: Use Tailscale Serve (easier)');
    console.log('    Run: npm run dev (in one terminal)');
    console.log('    Run: tailscale serve https / http://localhost:3000 (in another)');
    console.log(`    Access: https://${CERT_DOMAIN}`);
    console.log('');
    
    createHttpServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    }).listen(port, hostname, () => {
      console.log(`  → HTTP Server: http://localhost:${port}`);
      console.log(`  → Tailscale HTTP: http://${CERT_DOMAIN}:${port}`);
      console.log('');
    });
  }
});
