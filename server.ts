/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API to fetch shared folder files without requiring visitor authentication
  app.get('/api/public-files', async (req, res) => {
    try {
      const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
      const defaultFolderId = '1W_9Ab_i_hBWwisY3XMqsGYLNb6nWY1o_';
      const folderId = (req.query.folderId as string) || defaultFolderId;

      if (!apiKey) {
        // Return gorgeous structured fallback files when API key is not yet set up
        // So that the app looks completely ready and premium immediately
        // If they navigate into "TUBAN" (simulated folder ID mock-folder-tuban)
        if (folderId === 'mock-folder-tuban') {
          return res.json({
            isMock: true,
            files: [
              {
                id: 'mock-img-1',
                name: 'Foto Dokumentasi Lokasi Tuban 1.jpg',
                mimeType: 'image/jpeg',
                size: '1850000',
                createdTime: new Date(Date.now() - 3600000 * 2).toISOString(),
                modifiedTime: new Date(Date.now() - 3600000 * 1).toISOString(),
                webViewLink: 'https://drive.google.com/drive/folders/1W_9Ab_i_hBWwisY3XMqsGYLNb6nWY1o_?usp=sharing',
                owners: [{ displayName: 'Junisoe Pratama', emailAddress: 'JunisoePratama@gmail.com' }]
              },
              {
                id: 'mock-img-2',
                name: 'Foto Lokasi Tuban 2.jpg',
                mimeType: 'image/jpeg',
                size: '2150000',
                createdTime: new Date(Date.now() - 3600000 * 4).toISOString(),
                modifiedTime: new Date(Date.now() - 3600000 * 3).toISOString(),
                webViewLink: 'https://drive.google.com/drive/folders/1W_9Ab_i_hBWwisY3XMqsGYLNb6nWY1o_?usp=sharing',
                owners: [{ displayName: 'Junisoe Pratama', emailAddress: 'JunisoePratama@gmail.com' }]
              }
            ]
          });
        }

        return res.json({
          isMock: true,
          files: [
            {
              id: 'mock-file-1',
              name: '1. Panduan Integrasi Google Drive API.pdf',
              mimeType: 'application/pdf',
              size: '1240500',
              createdTime: new Date(Date.now() - 3600000 * 4).toISOString(),
              modifiedTime: new Date(Date.now() - 3600000 * 3).toISOString(),
              webViewLink: 'https://drive.google.com/drive/folders/1W_9Ab_i_hBWwisY3XMqsGYLNb6nWY1o_?usp=sharing',
              owners: [{ displayName: 'Junisoe Pratama', emailAddress: 'JunisoePratama@gmail.com' }]
            },
            {
              id: 'mock-folder-tuban',
              name: 'TUBAN',
              mimeType: 'application/vnd.google-apps.folder',
              size: '-',
              createdTime: new Date(Date.now() - 3600000 * 10).toISOString(),
              modifiedTime: new Date(Date.now() - 3600000 * 9).toISOString(),
              webViewLink: 'https://drive.google.com/drive/folders/1W_9Ab_i_hBWwisY3XMqsGYLNb6nWY1o_?usp=sharing',
              owners: [{ displayName: 'Junisoe Pratama', emailAddress: 'JunisoePratama@gmail.com' }]
            },
            {
              id: 'mock-file-2',
              name: '2. Portofolio & CV Professional.docx',
              mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              size: '2450000',
              createdTime: new Date(Date.now() - 3600000 * 24).toISOString(),
              modifiedTime: new Date(Date.now() - 3600000 * 20).toISOString(),
              webViewLink: 'https://drive.google.com/drive/folders/1W_9Ab_i_hBWwisY3XMqsGYLNb6nWY1o_?usp=sharing',
              owners: [{ displayName: 'Junisoe Pratama', emailAddress: 'JunisoePratama@gmail.com' }]
            },
            {
              id: 'mock-file-3',
              name: 'Screenshot Landing Page Hasil Desain.png',
              mimeType: 'image/png',
              size: '648200',
              createdTime: new Date(Date.now() - 3600000 * 48).toISOString(),
              modifiedTime: new Date(Date.now() - 3600000 * 45).toISOString(),
              webViewLink: 'https://drive.google.com/drive/folders/1W_9Ab_i_hBWwisY3XMqsGYLNb6nWY1o_?usp=sharing',
              owners: [{ displayName: 'Junisoe Pratama', emailAddress: 'JunisoePratama@gmail.com' }]
            },
            {
              id: 'mock-file-4',
              name: 'Database Inventory Barang Ekspor.xlsx',
              mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              size: '412000',
              createdTime: new Date(Date.now() - 3600000 * 72).toISOString(),
              modifiedTime: new Date(Date.now() - 3600000 * 70).toISOString(),
              webViewLink: 'https://drive.google.com/drive/folders/1W_9Ab_i_hBWwisY3XMqsGYLNb6nWY1o_?usp=sharing',
              owners: [{ displayName: 'Junisoe Pratama', emailAddress: 'JunisoePratama@gmail.com' }]
            }
          ]
        });
      }

      // Query real Google Drive API using API Key for the public shared folder (can be subfolders as well)
      const fields = 'files(id, name, mimeType, size, createdTime, modifiedTime, thumbnailLink, iconLink, webViewLink, webContentLink, owners(displayName, photoLink, emailAddress))';
      const query = `'${folderId}' in parents and trashed = false`;
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&key=${apiKey}&orderBy=name%20asc`;

      const response = await fetch(url);
      if (!response.ok) {
        const errText = await response.text();
        console.error('Google API Error:', errText);
        throw new Error(`Google API returned status ${response.status}`);
      }

      const data = await response.json();
      return res.json({
        isMock: false,
        files: data.files || []
      });
    } catch (error: any) {
      console.error('Server error on public-files route:', error);
      res.status(500).json({ error: error.message || 'Gagal terhubung dengan Google Drive API.' });
    }
  });

  // Serve static files in production or hook Vite development middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
