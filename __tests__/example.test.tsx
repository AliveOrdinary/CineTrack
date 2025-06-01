import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Simple component for testing
function TestComponent({ title }: { title: string }) {
  return (
    <div>
      <h1>{title}</h1>
      <p>This is a test component</p>
    </div>
  );
}

describe('Example Test', () => {
  it('renders the test component correctly', () => {
    render(<TestComponent title="Test Title" />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Title');
    expect(screen.getByText('This is a test component')).toBeInTheDocument();
  });

  it('passes a simple assertion', () => {
    expect(2 + 2).toBe(4);
  });

  it('tests async behavior', async () => {
    const promise = Promise.resolve('Hello World');
    const result = await promise;
    expect(result).toBe('Hello World');
  });
});
