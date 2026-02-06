import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Pagination } from './Pagination';

describe('Pagination Component', () => {
    it('does not render when totalPages is 0 or less', () => {
        const { container } = render(<Pagination currentPage={1} totalPages={0} onPageChange={() => { }} />);
        expect(container).toBeEmptyDOMElement();

        const { container: container2 } = render(<Pagination currentPage={1} totalPages={-1} onPageChange={() => { }} />);
        expect(container2).toBeEmptyDOMElement();
    });

    it('renders correctly', () => {
        const { container } = render(<Pagination currentPage={2} totalPages={5} onPageChange={() => { }} />);
        expect(container).toHaveTextContent(/Showing page.*2.*of.*5/);
    });

    it('calls onPageChange with correct values', () => {
        const handlePageChange = vi.fn();
        render(<Pagination currentPage={2} totalPages={5} onPageChange={handlePageChange} hasNext={true} hasPrev={true} />);

        // Find triggers. Mobile view has "Previous" and "Next" text buttons.
        // Desktop view has icons (ChevronLeft/Right).
        // Since we test in jsdom, layout CSS (hidden sm:flex) doesn't hide elements unless we mock layout or checking visible.
        // But usually both sets exist in DOM.
        // Let's target by accessible names.

        // The desktop icon buttons have <span className="sr-only">Next</span>
        const nextButtons = screen.getAllByRole('button', { name: /next/i });
        fireEvent.click(nextButtons[0]); // Click the first "Next" button found
        expect(handlePageChange).toHaveBeenCalledWith(3);

        const prevButtons = screen.getAllByRole('button', { name: /previous/i });
        fireEvent.click(prevButtons[0]);
        expect(handlePageChange).toHaveBeenCalledWith(1);
    });

    it('disables previous button on first page', () => {
        const handlePageChange = vi.fn();
        render(<Pagination currentPage={1} totalPages={5} onPageChange={handlePageChange} hasPrev={false} hasNext={true} />);

        const prevButtons = screen.getAllByRole('button', { name: /previous/i });
        prevButtons.forEach(btn => expect(btn).toBeDisabled());
    });

    it('disables next button on last page', () => {
        const handlePageChange = vi.fn();
        render(<Pagination currentPage={5} totalPages={5} onPageChange={handlePageChange} hasPrev={true} hasNext={false} />);

        const nextButtons = screen.getAllByRole('button', { name: /next/i });
        nextButtons.forEach(btn => expect(btn).toBeDisabled());
    });
});
