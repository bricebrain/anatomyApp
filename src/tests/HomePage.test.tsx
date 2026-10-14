import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomePage from '../pages/HomePage';

describe('HomePage', () => {
  it('accueille Eva et présente les parcours principaux', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <HomePage />
      </QueryClientProvider>,
    );
    expect(screen.getByText('Bonjour Eva,')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Commencer un dessin/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Importer une illustration/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Bibliothèque/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Explorer en 3D/i })).toBeInTheDocument();
    // Les modèles suggérés sont des planches réelles de la sélection locale.
    expect(await screen.findByText('Cœur et gros vaisseaux (vue de face)')).toBeInTheDocument();
    expect(screen.getByText('Crâne (vue de face)')).toBeInTheDocument();
  });
});
