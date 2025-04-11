const { convertToMinecraftStyle } = require('../services/openai');

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    images: {
      create: jest.fn()
    }
  }));
});

describe('OpenAI Service', () => {
  let openai;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    // Get instance of mocked OpenAI
    openai = require('openai');
  });

  it('successfully converts an image', async () => {
    const mockResponse = {
      data: [{ url: 'https://example.com/image.png' }]
    };

    openai.mockImplementation(() => ({
      images: {
        create: jest.fn().mockResolvedValue(mockResponse)
      }
    }));

    const result = await convertToMinecraftStyle('base64image', 'test prompt');

    expect(result).toEqual({
      url: 'https://example.com/image.png',
      status: 'success'
    });
  });

  it('retries on rate limit error', async () => {
    const mockError = new Error('Rate limit exceeded');
    mockError.status = 429;

    const mockSuccess = {
      data: [{ url: 'https://example.com/image.png' }]
    };

    const mockOpenAI = {
      images: {
        create: jest.fn()
          .mockRejectedValueOnce(mockError)
          .mockResolvedValueOnce(mockSuccess)
      }
    };

    openai.mockImplementation(() => mockOpenAI);

    const result = await convertToMinecraftStyle('base64image', 'test prompt');

    expect(mockOpenAI.images.create).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      url: 'https://example.com/image.png',
      status: 'success'
    });
  });

  it('fails after max retries', async () => {
    const mockError = new Error('Rate limit exceeded');
    mockError.status = 429;

    const mockOpenAI = {
      images: {
        create: jest.fn().mockRejectedValue(mockError)
      }
    };

    openai.mockImplementation(() => mockOpenAI);

    await expect(convertToMinecraftStyle('base64image', 'test prompt'))
      .rejects
      .toThrow('Failed to convert image after 3 attempts');
  });

  it('does not retry on client errors', async () => {
    const mockError = new Error('Invalid input');
    mockError.status = 400;

    const mockOpenAI = {
      images: {
        create: jest.fn().mockRejectedValue(mockError)
      }
    };

    openai.mockImplementation(() => mockOpenAI);

    await expect(convertToMinecraftStyle('base64image', 'test prompt'))
      .rejects
      .toThrow('Failed to convert image after 1 attempts');

    expect(mockOpenAI.images.create).toHaveBeenCalledTimes(1);
  });
}); 