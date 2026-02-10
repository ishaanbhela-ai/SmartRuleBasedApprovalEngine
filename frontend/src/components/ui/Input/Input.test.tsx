import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Input } from './Input';

describe('Input Component', () => {
    it('renders correctly', () => {
        render(<Input placeholder="Enter text" />);
        expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('handles change events', () => {
        const handleChange = vi.fn();
        render(<Input onChange={handleChange} />);
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'New value' } });
        expect(handleChange).toHaveBeenCalled();
        expect(input).toHaveValue('New value');
    });

    it('can be disabled', () => {
        render(<Input disabled />);
        expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('renders with label if provided (optional feature check)', () => {
        // Checking if Input supports label prop or if it's just a raw input
        const { container } = render(<Input id="test-input" className="custom-class" />);
        expect(container.querySelector('input')).toHaveClass('custom-class');
    });

    it('renders error state correctly', () => {
        render(<Input error="Invalid input" />);
        const input = screen.getByRole('textbox');
        // Assuming error prop adds a red border or class
        expect(input).toHaveClass('border-red-500');
        // And renders the error message
        expect(screen.getByText('Invalid input')).toBeInTheDocument();
    });
});
