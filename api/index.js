// Vercel Serverless Function entry point for Backend
import { createApp } from '../Backend/src/app.js';
import { initDb } from '../Backend/src/services/storage.js';

let app;

// Initialize the app once
async function getApp() {
  if (!app) {
    await initDb();
    app = createApp();
  }
  return app;
}

// Export the handler for Vercel serverless functions
export default async function handler(req, res) {
  const app = await getApp();
  return app(req, res);
}
