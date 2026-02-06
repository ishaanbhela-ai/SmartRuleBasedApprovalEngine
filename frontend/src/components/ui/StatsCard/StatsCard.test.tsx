import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatsCard } from './StatsCard';
import { Users } from 'lucide-react';

describe('StatsCard Component', () => {
    it('renders title and value', () => {
        render(<StatsCard title="Total Users" value="1,234" icon={Users} />);
        expect(screen.getByText('Total Users')).toBeInTheDocument();
        expect(screen.getByText('1,234')).toBeInTheDocument();
    });

    it('renders description', () => {
        render(<StatsCard title="Users" value="100" icon={Users} description="Active users" />);
        expect(screen.getByText('Active users')).toBeInTheDocument();
    });

    it('renders positive trend', () => {
        render(<StatsCard title="Users" value="100" icon={Users} trend={{ value: 12, label: 'vs last month', positive: true }} />);
        const trendElement = screen.getByText('+12%');
        expect(trendElement).toBeInTheDocument();
        expect(trendElement).toHaveClass('text-emerald-600');
    });

    it('renders negative trend', () => {
        render(<StatsCard title="Users" value="100" icon={Users} trend={{ value: 5, label: 'vs last month', positive: false }} />);
        const trendElement = screen.getByText('5%');
        expect(trendElement).toBeInTheDocument();
        expect(trendElement).toHaveClass('text-red-600');
    });
});
