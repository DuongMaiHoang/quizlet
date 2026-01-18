
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportOverlay } from './ImportOverlay';

describe('ImportOverlay', () => {
    it('renders correctly with default state', () => {
        render(<ImportOverlay onImport={vi.fn()} onClose={vi.fn()} />);

        // Zone A
        expect(screen.getByPlaceholderText(/Word1\tDefinition1/)).toBeTruthy();

        // Zone B - Defaults
        const tabRadio = screen.getByLabelText('Tab') as HTMLInputElement;
        expect(tabRadio.checked).toBe(true);

        const newlineRadio = screen.getByLabelText('New line') as HTMLInputElement;
        expect(newlineRadio.checked).toBe(true);

        // Zone C
        expect(screen.getByText('No data to preview')).toBeTruthy();
        const importBtn = screen.getByText('Import questions').closest('button');
        expect(importBtn?.disabled).toBe(true);
    });

    it('updates preview when text is entered (debounced)', async () => {
        render(<ImportOverlay onImport={vi.fn()} onClose={vi.fn()} />);
        const textarea = screen.getByPlaceholderText(/Word1\tDefinition1/);

        await userEvent.type(textarea, 'Term1\tDef1');

        await waitFor(() => {
            expect(screen.getByText('Term1')).toBeTruthy();
            expect(screen.getByText('Def1')).toBeTruthy();
            expect(screen.getByText('1 Valid')).toBeTruthy();
        }, { timeout: 1000 });
    });

    it('updates parsing when separator changes', async () => {
        render(<ImportOverlay onImport={vi.fn()} onClose={vi.fn()} />);
        const textarea = screen.getByPlaceholderText(/Word1\tDefinition1/);

        await userEvent.type(textarea, 'Term1,Def1');

        // Initially invalid (expects Tab)
        await waitFor(() => {
            expect(screen.getByText('1 Invalid')).toBeTruthy();
        });

        // Switch to Comma
        await userEvent.click(screen.getByLabelText('Comma'));

        await waitFor(() => {
            expect(screen.getByText('1 Valid')).toBeTruthy();
            expect(screen.getByText('Term1')).toBeTruthy();
        });
    });

    it('handles custom separators', async () => {
        render(<ImportOverlay onImport={vi.fn()} onClose={vi.fn()} />);
        const textarea = screen.getByPlaceholderText(/Word1\tDefinition1/);

        await userEvent.type(textarea, 'T1-D1::T2-D2');

        // Select Custom QA (-)
        await userEvent.click(screen.getByLabelText(/Custom/i, { selector: 'label:has(input[name="qaSep"]) input' }));

        const customQaInput = await screen.findByPlaceholderText('e.g. -');
        await userEvent.clear(customQaInput);
        await userEvent.type(customQaInput, '-');

        // Select Custom Card (::)
        const radios = screen.getAllByLabelText(/Custom/i);
        await userEvent.click(radios[1]);

        const customCardInput = await screen.findByPlaceholderText('e.g. ::');
        await userEvent.clear(customCardInput);
        await userEvent.type(customCardInput, '::');

        await waitFor(() => {
            expect(screen.getByText('2 Valid')).toBeTruthy();
            expect(screen.getByText('T1')).toBeTruthy();
            expect(screen.getByText('T2')).toBeTruthy();
        });
    });

    it('blocks import if custom separator is empty', async () => {
        render(<ImportOverlay onImport={vi.fn()} onClose={vi.fn()} />);
        const textarea = screen.getByPlaceholderText(/Word1\tDefinition1/);
        await userEvent.type(textarea, 'A\tB');

        await userEvent.click(screen.getAllByLabelText(/Custom/i)[0]);
        const customQaInput = await screen.findByPlaceholderText('e.g. -');
        await userEvent.clear(customQaInput);

        await waitFor(() => {
            expect(screen.queryByText(/Custom separator cannot be empty/i)).not.toBeNull();
            const btn = screen.getByRole('button', { name: /import/i }) as HTMLButtonElement;
            expect(btn.disabled).toBe(true);
        });
    });

    it('imports only valid cards if skipInvalid is true', async () => {
        const onImport = vi.fn();
        render(<ImportOverlay onImport={onImport} onClose={vi.fn()} />);
        const textarea = screen.getByPlaceholderText(/Word1\tDefinition1/);

        await userEvent.type(textarea, 'Q1\tA1\nInvalidRow');

        await waitFor(() => {
            expect(screen.getByText('Q1')).toBeTruthy();
            expect(screen.getByText('1 Valid')).toBeTruthy();
            expect(screen.getByText('1 Invalid')).toBeTruthy();
        });

        const importBtn = screen.getByRole('button', { name: /Import 1 questions/i });
        await userEvent.click(importBtn);

        expect(onImport).toHaveBeenCalledWith([
            { term: 'Q1', definition: 'A1' }
        ]);
    });

    it('disables import if skipInvalid is false and errors exist', async () => {
        const onImport = vi.fn();
        render(<ImportOverlay onImport={onImport} onClose={vi.fn()} />);
        const textarea = screen.getByPlaceholderText(/Word1\tDefinition1/);

        await userEvent.type(textarea, 'Q1\tA1\nInvalidRow');

        // Uncheck Skip Invalid
        await userEvent.click(screen.getByLabelText('Skip questions with errors'));

        await waitFor(() => {
            expect(screen.queryByText(/Fix invalid rows/i)).not.toBeNull();
            const btn = screen.getByRole('button', { name: /Import 1 questions/i }) as HTMLButtonElement;
            expect(btn.disabled).toBe(true);
        });
    });

    it.skip('calls confirm for large imports', async () => {
        window.confirm = vi.fn(() => true);
        const onImport = vi.fn();
        render(<ImportOverlay onImport={onImport} onClose={vi.fn()} />);

        const lines = Array.from({ length: 201 }, (_, i) => `Q${i}\tA${i}`).join('\n');

        const textarea = screen.getByPlaceholderText(/Word1\tDefinition1/);
        // Using fireEvent for large inputs to ensure speed and reliability in JSDOM
        fireEvent.change(textarea, { target: { value: lines } });

        await waitFor(() => {
            expect(screen.getByText('201 Valid')).toBeTruthy();
        }, { timeout: 3000 });

        const importBtn = screen.getByRole('button', { name: /Import 201 questions/i });
        await userEvent.click(importBtn);

        expect(window.confirm).toHaveBeenCalled();
        expect(onImport).toHaveBeenCalledTimes(1);
    });
});
