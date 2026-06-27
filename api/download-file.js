/**
 * Vercel Serverless Function to download individual files as a CORS proxy.
 * Needed to download binaries client-side to package them into a ZIP archive.
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
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const fileId = urlObj.searchParams.get('fileId');

    if (!fileId) {
      return res.status(400).json({ error: 'Parameter fileId diperlukan' });
    }

    if (!apiKey) {
      // Mock data download fallback: Return a simple text file
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="mock-${fileId}.txt"`);
      return res.status(200).send(`Ini adalah file tiruan (ID: ${fileId}) karena Google Drive API Key belum dikonfigurasi di Vercel.`);
    }

    const driveUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;
    const driveRes = await fetch(driveUrl);

    if (!driveRes.ok) {
      console.error(`Google API file download failed with status ${driveRes.status}`);
      return res.status(driveRes.status).json({ error: `Gagal mengunduh file: ${driveRes.statusText}` });
    }

    const contentType = driveRes.headers.get('content-type') || 'application/octet-stream';
    const contentLength = driveRes.headers.get('content-length');

    res.setHeader('Content-Type', contentType);
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    const arrayBuffer = await driveRes.arrayBuffer();
    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('Error on download-file Vercel handler:', error);
    return res.status(500).json({ error: error.message || 'Gagal mengunduh file.' });
  }
}
