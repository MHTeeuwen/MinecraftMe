// Tests for the main App component
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  test('renders main heading', () => {
    render(<App />);
    const headingElement = screen.getByText(/Minecraft Me/i);
    expect(headingElement).toBeInTheDocument();
  });

  test('renders upload prompt', () => {
    render(<App />);
    const uploadText = screen.getByText(/Upload a photo to get started!/i);
    expect(uploadText).toBeInTheDocument();
  });
}); 