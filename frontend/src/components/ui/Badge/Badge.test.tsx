import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from './Badge';

describe('Badge Component', () => {
    it('renders with default variant', () => {
        render(<Badge>Default</Badge>);
        const badge = screen.getByText('Default');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveClass('bg-primary-600');
    });

    it('renders secondary variant', () => {
        render(<Badge variant="secondary">Secondary</Badge>);
        expect(screen.getByText('Secondary')).toHaveClass('bg-slate-100');
    });

    it('renders outline variant', () => {
        render(<Badge variant="outline">Outline</Badge>);
        expect(screen.getByText('Outline')).toHaveClass('border-slate-200');
    });

    it('renders success variant', () => {
        render(<Badge variant="success">Success</Badge>);
        expect(screen.getByText('Success')).toHaveClass('bg-emerald-100');
    });

    it('applies custom className', () => {
        render(<Badge className="custom-class">Custom</Badge>);
        expect(screen.getByText('Custom')).toHaveClass('custom-class');
    });
});
