import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../components/ui/Button';

describe('Button', () => {
  it('affiche le texte enfant', () => {
    render(<Button>Connexion</Button>);
    expect(screen.getByText('Connexion')).toBeInTheDocument();
  });

  it('appelle onClick au clic', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Cliquer</Button>);
    fireEvent.click(screen.getByText('Cliquer'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('est désactivé quand disabled=true', () => {
    render(<Button disabled>Envoyer</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('est désactivé quand loading=true', () => {
    render(<Button loading>Envoyer</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('affiche un spinner SVG quand loading=true', () => {
    render(<Button loading>Chargement</Button>);
    const button = screen.getByRole('button');
    const svg = button.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('n\'appelle pas onClick si disabled', () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Clic</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('a type="button" par défaut', () => {
    render(<Button>Test</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('accepte type="submit"', () => {
    render(<Button type="submit">Valider</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('applique la className personnalisée', () => {
    render(<Button className="ma-classe">Test</Button>);
    expect(screen.getByRole('button')).toHaveClass('ma-classe');
  });
});
