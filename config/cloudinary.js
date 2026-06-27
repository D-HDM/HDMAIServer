// ====================================================================================================
// HDM AI Server — Cloudinary Configuration
// Image/file upload to Cloudinary CDN
// ====================================================================================================

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const uploadToCloudinary = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: options.folder || 'hdm_ai',
      resource_type: options.resourceType || 'auto',
      ...options,
    });
    return { success: true, url: result.secure_url, publicId: result.public_id };
  } catch (error) {
    console.error('Cloudinary upload failed:', error.message);
    return { success: false, error: error.message };
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return { success: true };
  } catch (error) {
    console.error('Cloudinary delete failed:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { cloudinary, uploadToCloudinary, deleteFromCloudinary };