const request = require('supertest');
const app = require('../server');
const { convertToMinecraftStyle } = require('../services/openai');

// Mock OpenAI service
jest.mock('../services/openai');

describe('Convert Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('successfully converts an image', async () => {
    const mockResponse = {
      url: 'https://example.com/image.png',
      status: 'success'
    };

    convertToMinecraftStyle.mockResolvedValue(mockResponse);

    const response = await request(app)
      .post('/api/convert')
      .send({
        image: 'base64string',
        prompt: 'test prompt',
        size: '1024x1024'
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResponse);
  });

  it('validates required fields', async () => {
    const response = await request(app)
      .post('/api/convert')
      .send({
        prompt: 'test prompt'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Image is required');
  });

  it('validates image size', async () => {
    // Create a large base64 string
    const largeBase64 = 'a'.repeat(5 * 1024 * 1024);

    const response = await request(app)
      .post('/api/convert')
      .send({
        image: largeBase64,
        prompt: 'test prompt'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Image size exceeds maximum allowed size');
  });

  it('validates size parameter', async () => {
    const response = await request(app)
      .post('/api/convert')
      .send({
        image: 'base64string',
        prompt: 'test prompt',
        size: 'invalid'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid size parameter');
  });

  it('handles OpenAI service errors', async () => {
    convertToMinecraftStyle.mockRejectedValue(new Error('OpenAI Error'));

    const response = await request(app)
      .post('/api/convert')
      .send({
        image: 'base64string',
        prompt: 'test prompt'
      });

    expect(response.status).toBe(500);
    expect(response.body.error).toContain('OpenAI Error');
  });
}); 