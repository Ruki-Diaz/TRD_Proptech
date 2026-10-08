import { supabase } from '../services/supabase';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_IMAGE_COUNT = 10;

export const sanitizeFileName = (fileName) => {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
};

export const validateImages = (files) => {
  if (!files || files.length === 0) return null;

  if (files.length > MAX_IMAGE_COUNT) {
    return `You can upload a maximum of ${MAX_IMAGE_COUNT} images (you selected ${files.length}).`;
  }

  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return `File "${file.name}" is not supported. Please upload JPEG, PNG, or WebP images only.`;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return `File "${file.name}" exceeds the 5 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`;
    }
  }

  return null;
};

export const resizeImage = (file, maxWidth = 1920) => {
  return new Promise((resolve) => {
    // If not in a browser environment or cannot create URL, return original
    if (typeof window === 'undefined' || !window.URL || !window.URL.createObjectURL) {
      resolve(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const { width, height } = img;

      if (width <= maxWidth) {
        resolve(file);
        return;
      }

      const scaleFactor = maxWidth / width;
      const targetWidth = maxWidth;
      const targetHeight = Math.round(height * scaleFactor);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const outputType = file.type === 'image/png' ? 'image/png' : (file.type === 'image/webp' ? 'image/webp' : 'image/jpeg');
      const quality = outputType === 'image/png' ? undefined : 0.85;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const resizedFile = new File([blob], file.name, {
            type: outputType,
            lastModified: Date.now(),
          });
          resolve(resizedFile);
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // If resizing fails, fallback to original file
      resolve(file);
    };

    img.src = objectUrl;
  });
};

export const uploadPropertyImages = async (filesToUpload, currentUser) => {
  const uploadedUrls = [];

  for (const file of filesToUpload) {
    if (!file || file.size === 0) continue;

    const resized = await resizeImage(file, 1920);
    const safeName = sanitizeFileName(file.name);
    const filePath = `${currentUser.id}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(filePath, resized, {
        contentType: resized.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(uploadError.message);
    }

    const { data: publicUrlData } = supabase.storage
      .from('property-images')
      .getPublicUrl(filePath);

    uploadedUrls.push(publicUrlData.publicUrl);
  }

  return uploadedUrls;
};
