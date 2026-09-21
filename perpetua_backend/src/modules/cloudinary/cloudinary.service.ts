import { v2 as cloudinary } from 'cloudinary';


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'r5ro2qre',
  api_key: process.env.CLOUDINARY_API_KEY || '538871857573799',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Q59ELc6r0Lu67-xOOV1oxeAggcU',
  secure: true,
});

export const cloudinaryService = {
  /**
   * Uploads a base64 image string to Cloudinary and returns the secure URL.
   * If the string is already a URL (not base64 data URL), it returns the string as is.
   */
  async uploadImage(base64String: string, folder: string = 'perpetua_courses'): Promise<string> {
    if (!base64String || !base64String.startsWith('data:image')) {
      return base64String;
    }

    try {
      const result = await cloudinary.uploader.upload(base64String, {
        folder,
        resource_type: 'image',
      });
      return result.secure_url;
    } catch (error: any) {
      console.error('Cloudinary upload failed:', error);
      throw new Error(`Failed to upload image to Cloudinary: ${error.message || JSON.stringify(error)}`);
    }
  }
};
