import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Logo } from './Logo';

describe('Logo Component', () => {
    it('renders correctly', () => {
        const { container } = render(<Logo />);
        // Logo renders a lucide icon (SVG)
        expect(container.querySelector('svg')).toBeInTheDocument();
        expect(container.firstChild).toHaveClass('text-primary-600');
    });

    it('applies custom className', () => {
        const { container } = render(<Logo className="text-red-500" />);
        expect(container.firstChild).toHaveClass('text-red-500');
    });
});
