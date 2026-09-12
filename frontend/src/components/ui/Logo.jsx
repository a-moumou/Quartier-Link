import { Link } from 'react-router-dom';

import logoComplet from '../../assets/logo-complet.png';
import logoMarque from '../../assets/logo-marque.png';

// Deux fichiers pour un seul logo :
//   logo-complet : la pastille et le mot « QuartierLink »
//   logo-marque  : la pastille seule, pour les emplacements etroits
// Ils sont decoupes dans le fichier d'origine, sans marge autour du
// dessin, ce qui permet de les aligner precisement sur le texte voisin.

const HAUTEURS = {
  xs: 'h-6',
  sm: 'h-7',
  md: 'h-8',
  lg: 'h-10',
  xl: 'h-12',
};

export default function Logo({
  to = '/',
  size = 'md',
  className = '',
  showText = true,
}) {
  const hauteur = HAUTEURS[size] ?? HAUTEURS.md;

  const image = (
    <img
      src={showText ? logoComplet : logoMarque}
      // Le logo porte le nom du service : c'est une image porteuse de
      // sens, elle doit donc avoir une alternative textuelle. Repeter
      // « QuartierLink » a cote quand showText est actif ferait doublon
      // pour un lecteur d'ecran, d'ou l'alternative unique ici.
      alt="QuartierLink"
      className={[hauteur, 'w-auto shrink-0 select-none'].join(' ')}
      draggable="false"
    />
  );

  if (!to) {
    return <span className={['inline-flex items-center', className].join(' ')}>{image}</span>;
  }

  return (
    <Link
      to={to}
      aria-label="QuartierLink — accueil"
      className={[
        'inline-flex items-center rounded-md',
        'transition-opacity hover:opacity-80',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40',
        className,
      ].join(' ')}
    >
      {image}
    </Link>
  );
}
