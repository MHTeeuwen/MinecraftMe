// Handles image conversion API calls

/**
 * Converts an image file to base64 string
 */
const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove data:image/jpeg;base64, prefix
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Converts an image to Minecraft style
 */
const convertToMinecraft = async (imageFile) => {
  try {
    // Convert the image to base64
    const base64Image = await convertToBase64(imageFile);
    
    // Make API call to your backend endpoint
    const response = await fetch('/api/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
        prompt: 'Convert this image into Minecraft style, with 16x16 pixel blocks, using Minecraft\'s signature blocky textures and color palette.',
        size: '1024x1024'
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to convert image');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Image conversion failed:', error);
    throw new Error('Failed to convert image: ' + error.message);
  }
};

export { convertToMinecraft }; 