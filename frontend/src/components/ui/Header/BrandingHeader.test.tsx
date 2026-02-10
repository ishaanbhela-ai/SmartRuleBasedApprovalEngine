import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrandingHeader } from './BrandingHeader';

describe('BrandingHeader Component', () => {
    it('renders with default title and subtitle', () => {
        render(<BrandingHeader />);
        expect(screen.getByText('SmartRule Engine')).toBeInTheDocument();
        expect(screen.getByText('Enterprise Approval Administration')).toBeInTheDocument();
    });

    it('renders with custom title and subtitle', () => {
        render(<BrandingHeader title="Custom App" subtitle="Custom Subtitle" />);
        expect(screen.getByText('Custom App')).toBeInTheDocument();
        expect(screen.getByText('Custom Subtitle')).toBeInTheDocument();
    });
});
