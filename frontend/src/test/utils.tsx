import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render as rtlRender, type RenderOptions } from '@testing-library/react';
import { type ReactElement } from 'react';

const createTestQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: {
            retry: false, // Disable retries for tests to fail faster
        },
    },
});

export function renderWithClient(ui: ReactElement, options?: RenderOptions) {
    const testQueryClient = createTestQueryClient();
    const { rerender, ...result } = rtlRender(
        <QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>,
        options
    );
    return {
        ...result,
        rerender: (rerenderUi: ReactElement) =>
            rerender(
                <QueryClientProvider client={testQueryClient}>{rerenderUi}</QueryClientProvider>
            ),
    };
}

export * from '@testing-library/react';
export { renderWithClient as render };
