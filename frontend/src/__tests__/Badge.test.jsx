import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from '../components/ui/Badge';

describe('Badge', () => {
  it('affiche le texte enfant', () => {
    render(<Badge>Actif</Badge>);
    expect(screen.getByText('Actif')).toBeInTheDocument();
  });

  it('est un élément <span>', () => {
    render(<Badge>Test</Badge>);
    const el = screen.getByText('Test');
    expect(el.tagName).toBe('SPAN');
  });

  it('applique la className personnalisée', () => {
    render(<Badge className="custom">Test</Badge>);
    expect(screen.getByText('Test')).toHaveClass('custom');
  });

  it('accepte du contenu JSX enfant', () => {
    render(<Badge><span data-testid="icon">✓</span> Vérifié</Badge>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
});
