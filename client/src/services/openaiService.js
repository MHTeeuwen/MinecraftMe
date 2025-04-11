// Handles OpenAI API interactions for image conversion
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const MINECRAFT_PROMPT = "Convert this image into Minecraft style, with 16x16 pixel blocks, using Minecraft's signature blocky textures and color palette. Maintain the original image's composition but render it in Minecraft's distinct cubic style.";

const convertImageToBase64 = (file) => {
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

const convertToMinecraftStyle = async (imageFile) => {
  try {
    console.log('Starting conversion process for:', imageFile.name);
    
    // Convert image to base64
    const base64Image = await convertImageToBase64(imageFile);
    console.log('Image converted to base64');

    // Prepare the API request
    const response = await fetch(`${API_URL}/api/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
        prompt: MINECRAFT_PROMPT,
        size: '1024x1024',
      }),
    });

    console.log('Received response:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    });

    // Handle non-200 responses
    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error:', errorData);
      throw new Error(errorData.error || 'Failed to convert image');
    }

    const result = await response.json();
    console.log('Parsed response:', {
      status: result.status,
      hasUrl: !!result.url,
      status: result.status
    });

    // Validate response data
    if (result.status !== 'success' || !result.url) {
      throw new Error('Invalid response format from server');
    }

    return {
      originalImage: URL.createObjectURL(imageFile),
      convertedImageUrl: result.url,
    };
  } catch (error) {
    console.error('OpenAI conversion failed:', error);
    throw new Error('Failed to convert image: ' + error.message);
  }
};

export { convertToMinecraftStyle }; 