import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ImageUpload from '../ImageUpload';

describe('ImageUpload', () => {
  const mockOnImageSelect = jest.fn();

  beforeEach(() => {
    mockOnImageSelect.mockClear();
  });

  test('renders upload area with correct text', () => {
    render(<ImageUpload onImageSelect={mockOnImageSelect} />);
    expect(screen.getByText(/Drop your photo here/i)).toBeInTheDocument();
    expect(screen.getByText(/Choose a File/i)).toBeInTheDocument();
  });

  test('handles file selection', () => {
    render(<ImageUpload onImageSelect={mockOnImageSelect} />);
    
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    const input = screen.getByAcceptingUpload();

    fireEvent.change(input, { target: { files: [file] } });
    expect(mockOnImageSelect).toHaveBeenCalledWith(file);
  });

  test('shows error for invalid file type', () => {
    render(<ImageUpload onImageSelect={mockOnImageSelect} />);
    
    const file = new File(['dummy content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByAcceptingUpload();

    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByText(/Please upload an image file/i)).toBeInTheDocument();
    expect(mockOnImageSelect).not.toHaveBeenCalled();
  });

  test('shows error for large files', () => {
    render(<ImageUpload onImageSelect={mockOnImageSelect} />);
    
    // Create a mock file larger than 5MB
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    const input = screen.getByAcceptingUpload();

    fireEvent.change(input, { target: { files: [largeFile] } });
    expect(screen.getByText(/Image must be less than 5MB/i)).toBeInTheDocument();
    expect(mockOnImageSelect).not.toHaveBeenCalled();
  });
}); 