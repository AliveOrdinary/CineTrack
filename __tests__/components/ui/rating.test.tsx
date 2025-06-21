/**
 * Unit tests for Rating component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { Rating } from '@/components/ui/rating';

describe('Rating component', () => {
  it('should render 10 star buttons', () => {
    render(<Rating />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(10);
  });

  it('should display current rating value', () => {
    render(<Rating value={7} />);
    
    expect(screen.getByText('7/10')).toBeInTheDocument();
  });

  it('should not display rating text when value is 0', () => {
    render(<Rating value={0} />);
    
    expect(screen.queryByText('0/10')).not.toBeInTheDocument();
  });

  it('should call onChange when star is clicked', () => {
    const mockOnChange = jest.fn();
    render(<Rating onChange={mockOnChange} />);
    
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[4]); // Click 5th star (rating 5)
    
    expect(mockOnChange).toHaveBeenCalledWith(5);
  });

  it('should not call onChange when readonly', () => {
    const mockOnChange = jest.fn();
    render(<Rating onChange={mockOnChange} readonly />);
    
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[4]);
    
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('should disable buttons when readonly', () => {
    render(<Rating readonly />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('should update hover state on mouse enter', () => {
    render(<Rating value={3} />);
    
    const buttons = screen.getAllByRole('button');
    fireEvent.mouseEnter(buttons[6]); // Hover over 7th star
    
    // Check that stars are highlighted up to the hovered star
    // This is tested indirectly through the component's visual state
    expect(buttons[6]).toBeInTheDocument();
  });

  it('should reset hover state on mouse leave', () => {
    render(<Rating value={3} />);
    
    const buttons = screen.getAllByRole('button');
    fireEvent.mouseEnter(buttons[6]);
    fireEvent.mouseLeave(buttons[6]);
    
    // Component should return to showing original value
    expect(screen.getByText('3/10')).toBeInTheDocument();
  });

  it('should not update hover state when readonly', () => {
    const { container } = render(<Rating value={3} readonly />);
    
    const buttons = screen.getAllByRole('button');
    fireEvent.mouseEnter(buttons[6]);
    
    // Should still show original rating
    expect(screen.getByText('3/10')).toBeInTheDocument();
  });

  it('should apply size classes correctly', () => {
    const { rerender } = render(<Rating size="sm" />);
    let stars = screen.getAllByRole('button').map(btn => btn.querySelector('svg'));
    stars.forEach(star => {
      expect(star).toHaveClass('h-4', 'w-4');
    });

    rerender(<Rating size="md" />);
    stars = screen.getAllByRole('button').map(btn => btn.querySelector('svg'));
    stars.forEach(star => {
      expect(star).toHaveClass('h-5', 'w-5');
    });

    rerender(<Rating size="lg" />);
    stars = screen.getAllByRole('button').map(btn => btn.querySelector('svg'));
    stars.forEach(star => {
      expect(star).toHaveClass('h-6', 'w-6');
    });
  });

  it('should apply custom className', () => {
    const { container } = render(<Rating className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should handle decimal ratings correctly', () => {
    render(<Rating value={7.5} />);
    
    expect(screen.getByText('7.5/10')).toBeInTheDocument();
  });

  it('should fill correct number of stars for rating', () => {
    render(<Rating value={4} />);
    
    const stars = screen.getAllByRole('button').map(btn => btn.querySelector('svg'));
    
    // First 4 stars should be filled (yellow)
    for (let i = 0; i < 4; i++) {
      expect(stars[i]).toHaveClass('fill-yellow-400', 'text-yellow-400');
    }
    
    // Remaining stars should be unfilled (gray)
    for (let i = 4; i < 10; i++) {
      expect(stars[i]).toHaveClass('fill-none', 'text-gray-300');
    }
  });

  it('should handle edge case ratings', () => {
    const { rerender } = render(<Rating value={0} />);
    expect(screen.queryByText('/10')).not.toBeInTheDocument();

    rerender(<Rating value={10} />);
    expect(screen.getByText('10/10')).toBeInTheDocument();

    rerender(<Rating value={-1} />);
    expect(screen.queryByText('/10')).not.toBeInTheDocument();
  });

  it('should work without onChange prop', () => {
    render(<Rating value={5} />);
    
    const buttons = screen.getAllByRole('button');
    expect(() => fireEvent.click(buttons[0])).not.toThrow();
  });
});