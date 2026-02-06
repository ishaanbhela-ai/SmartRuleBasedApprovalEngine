import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge Component', () => {
    it('renders approved status', () => {
        render(<StatusBadge status="approved" />);
        const badge = screen.getByText('Approved');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveClass('bg-emerald-100');
    });

    it('renders rejected status', () => {
        render(<StatusBadge status="rejected" />);
        const badge = screen.getByText('Rejected');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveClass('bg-red-100');
    });

    it('renders pending status', () => {
        render(<StatusBadge status="pending_approval" />);
        const badge = screen.getByText('Pending');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveClass('bg-amber-100');
    });

    it('renders auto_approved status', () => {
        render(<StatusBadge status="auto_approved" />);
        const badge = screen.getByText('System');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveClass('bg-blue-100');
    });

    it('renders default/submitted status', () => {
        render(<StatusBadge status="unknown_status" />);
        const badge = screen.getByText('Submitted');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveClass('bg-slate-100');
    });

    it('applies custom className', () => {
        render(<StatusBadge status="approved" className="custom-class" />);
        expect(screen.getByText('Approved')).toHaveClass('custom-class');
    });
});
