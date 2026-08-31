const https = require('https');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(process.cwd(), 'public', 'images');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  const logoUrl = 'https://img1.wsimg.com/isteam/ip/5366c8a7-2ad9-4c64-88ee-30990fe29d3a/Global1-transparent%20globe-horizontal.png';
  const iconUrl = 'https://img1.wsimg.com/isteam/ip/5366c8a7-2ad9-4c64-88ee-30990fe29d3a/favicon/c023b546-6acc-43c9-8c50-d2e17a3e3103.png';

  console.log('Downloading logo...');
  await downloadFile(logoUrl, path.join(targetDir, 'global1-logo.png'));
  console.log('Logo saved to public/images/global1-logo.png');

  console.log('Downloading icon...');
  await downloadFile(iconUrl, path.join(targetDir, 'global1-icon.png'));
  console.log('Icon saved to public/images/global1-icon.png');
}

run().catch(err => {
  console.error('Error downloading assets:', err);
});
