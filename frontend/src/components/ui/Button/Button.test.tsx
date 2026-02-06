import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button Component', () => {
    it('renders correctly with default props', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
        // Check default variant classes (primary)
        const button = screen.getByRole('button');
        expect(button).toHaveClass('bg-primary-600');
    });

    it('renders outline variant correctly', () => {
        render(<Button variant="outline">Outline</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('border-slate-200');
        expect(button).not.toHaveClass('bg-primary-600');
    });

    it('handles click events', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click me</Button>);
        fireEvent.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('shows loading state', () => {
        const { container } = render(<Button isLoading>Submit</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
        expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('can be disabled', () => {
        render(<Button disabled>Disabled</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
    });
});
