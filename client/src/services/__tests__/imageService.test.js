import { convertToMinecraft } from '../imageService';

// Mock fetch globally
global.fetch = jest.fn();

describe('imageService', () => {
  beforeEach(() => {
    // Clear mock before each test
    fetch.mockClear();
  });

  it('successfully converts an image', async () => {
    // Mock successful response
    const mockResponse = {
      convertedImageUrl: 'http://example.com/converted.png'
    };
    fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    );

    const mockFile = new File([''], 'test.png', { type: 'image/png' });
    const result = await convertToMinecraft(mockFile);

    expect(result).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('/api/convert', expect.any(Object));
  });

  it('handles API errors', async () => {
    // Mock error response
    fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'API Error' })
      })
    );

    const mockFile = new File([''], 'test.png', { type: 'image/png' });
    
    await expect(convertToMinecraft(mockFile)).rejects.toThrow('Failed to convert image: API Error');
  });

  it('handles network errors', async () => {
    // Mock network error
    fetch.mockImplementationOnce(() => 
      Promise.reject(new Error('Network error'))
    );

    const mockFile = new File([''], 'test.png', { type: 'image/png' });
    
    await expect(convertToMinecraft(mockFile)).rejects.toThrow('Failed to convert image: Network error');
  });
}); 