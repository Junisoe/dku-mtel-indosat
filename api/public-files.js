/**
 * Vercel Serverless Function for Google Drive API Proxy
 * Handles server-side fetching of shared files securely without exposing API keys.
 */
export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
    const defaultFolderId = '1W_9Ab_i_hBWwisY3XMqsGYLNb6nWY1o_';
    
    // Extract query parameter
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const folderId = urlObj.searchParams.get('folderId') || defaultFolderId;

    if (!apiKey) {
      // Mock Data fallback if API key is not yet set up
      if (folderId === 'mock-folder-tuban') {
        return res.status(200).json({
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

      return res.status(200).json({
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

    // Connect to Google Drive API
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
    return res.status(200).json({
      isMock: false,
      files: data.files || []
    });
  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({ error: error.message || 'Gagal terhubung dengan Google Drive API.' });
  }
}
