import { convertToMinecraftStyle } from '../openaiService';

// Mock fetch globally
global.fetch = jest.fn();

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn();

describe('openaiService', () => {
  beforeEach(() => {
    // Clear mocks before each test
    fetch.mockClear();
    URL.createObjectURL.mockClear();
  });

  it('successfully converts an image to Minecraft style', async () => {
    // Mock successful response
    const mockResponse = {
      url: 'http://example.com/converted.png'
    };
    fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    );

    // Mock URL.createObjectURL
    URL.createObjectURL.mockReturnValue('blob:test-url');

    const mockFile = new File([''], 'test.png', { type: 'image/png' });
    const result = await convertToMinecraftStyle(mockFile);

    expect(result).toEqual({
      originalImage: 'blob:test-url',
      convertedImageUrl: 'http://example.com/converted.png'
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('/api/convert', expect.any(Object));
  });

  it('handles API errors', async () => {
    // Mock error response
    fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'OpenAI API Error' })
      })
    );

    const mockFile = new File([''], 'test.png', { type: 'image/png' });
    
    await expect(convertToMinecraftStyle(mockFile)).rejects.toThrow('Failed to convert image: OpenAI API Error');
  });

  it('handles network errors', async () => {
    // Mock network error
    fetch.mockImplementationOnce(() => 
      Promise.reject(new Error('Network error'))
    );

    const mockFile = new File([''], 'test.png', { type: 'image/png' });
    
    await expect(convertToMinecraftStyle(mockFile)).rejects.toThrow('Failed to convert image: Network error');
  });

  it('handles file reading errors', async () => {
    // Create a file that will fail to read
    const mockFile = new File([''], 'test.png', { type: 'image/png' });
    
    // Mock FileReader to simulate an error
    const mockFileReader = {
      readAsDataURL: jest.fn(),
      onerror: null,
    };
    
    jest.spyOn(window, 'FileReader').mockImplementation(() => mockFileReader);
    
    // Simulate FileReader error
    setTimeout(() => {
      mockFileReader.onerror(new Error('File reading failed'));
    }, 0);

    await expect(convertToMinecraftStyle(mockFile)).rejects.toThrow('Failed to convert image');
  });
}); 