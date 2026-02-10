import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RequestTypeIcon } from './RequestTypeIcon';

describe('RequestTypeIcon Component', () => {
    it('renders correctly', () => {
        const { container } = render(<RequestTypeIcon />);
        // Wraps icon in a div
        expect(container.firstChild).toHaveClass('bg-indigo-50');
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('applies custom className', () => {
        const { container } = render(<RequestTypeIcon className="bg-red-50" />);
        expect(container.firstChild).toHaveClass('bg-red-50');
    });
});
