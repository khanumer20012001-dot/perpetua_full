import { v2 as cloudinary } from 'cloudinary';

const url = process.env.CLOUDINARY_URL;
console.log('CLOUDINARY_URL is:', url ? 'SET' : 'NOT SET', url);

async function run() {
  try {
    const res = await cloudinary.uploader.upload('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', {
      folder: 'test'
    });
    console.log('Success!', res.secure_url);
  } catch (e) {
    console.error('Error:', e);
  }
}

run();
