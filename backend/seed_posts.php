
#!/usr/bin/env php
<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Entity\Membership;
use App\Entity\Post;
use App\Entity\Quartier;
use App\Entity\User;
use App\Enum\QuartierStatus;
use App\Kernel;
use Symfony\Component\Dotenv\Dotenv;

(new Dotenv())->bootEnv(__DIR__ . '/.env');

$kernel = new Kernel($_SERVER['APP_ENV'] ?? 'dev', (bool) ($_SERVER['APP_DEBUG'] ?? true));
$kernel->boot();

$container = $kernel->getContainer();
/** @var \Doctrine\ORM\EntityManagerInterface $em */
$em = $container->get('doctrine.orm.entity_manager');

echo "\n=== Génération de posts dans les quartiers ===\n\n";

// ─── Récupérer les quartiers ACTIFS ───────────────────────────────────────────
$quartiers = $em->getRepository(Quartier::class)->findBy(['status' => QuartierStatus::ACTIF]);

if (empty($quartiers)) {
    echo "❌ Aucun quartier ACTIF trouvé. Crée et valide au moins un quartier d'abord.\n\n";
    exit(1);
}

echo "✓ " . count($quartiers) . " quartier(s) actif(s) trouvé(s).\n";

// ─── Récupérer tous les utilisateurs (fallback global si aucun membre valide) ─
$allUsers = $em->getRepository(User::class)->findAll();
$allUserIds = array_map(fn(User $u) => $u->getId(), $allUsers);

if (empty($allUserIds)) {
    echo "❌ Aucun utilisateur en base. Crée au moins un compte d'abord.\n\n";
    exit(1);
}

echo "✓ " . count($allUserIds) . " utilisateur(s) total(aux) disponibles comme auteurs.\n";

// ─── Banque de posts réalistes (en français) ──────────────────────────────────
$postsBank = [
    "Bonjour à tous ! Quelqu'un connaît un bon plombier dans le coin ? Le mien ne répond plus depuis 3 jours… 😅",
    "Petit rappel : la collecte des encombrants a lieu mercredi prochain. Pensez à sortir vos affaires la veille au soir !",
    "Je vends une poussette en très bon état (50€). MP si intéressé(e).",
    "Bravo aux organisateurs de la fête de quartier de samedi, c'était top ! Vivement l'année prochaine 🎉",
    "Quelqu'un aurait vu un chat noir avec un collier rouge ? Il s'appelle Mistou et a disparu hier soir 😢",
    "Le boulanger de la rue principale a changé sa recette de pain au levain, c'est une tuerie 🥖",
    "Réunion de copropriété ce jeudi à 19h dans la salle commune. Ordre du jour : travaux de ravalement.",
    "Je cherche quelqu'un pour partager un panier de légumes bio chaque semaine. Qui est partant ?",
    "Attention : plusieurs voitures forcées la nuit dernière rue des Acacias. Pensez à bien fermer les vôtres.",
    "Cours de yoga gratuit dimanche matin au parc, 10h. Apportez juste votre tapis !",
    "Quelqu'un a-t-il un escabeau à me prêter pour le week-end ? Merci d'avance 🙏",
    "Nouvelle pizzeria ouverte au bout de la rue, je recommande la quatre fromages 🍕",
    "Vide-grenier ce dimanche dans la cour de l'école, venez nombreux !",
    "Je propose des cours de soutien en maths (niveau collège) à prix raisonnable. MP pour infos.",
    "Avis aux propriétaires de chiens : merci de bien ramasser les déjections sur le trottoir, ça devient pénible…",
    "Le club de lecture se réunit mardi 18h au café du coin. Tous les nouveaux sont les bienvenus 📚",
    "Recherche covoiturage matinal vers le centre-ville (départ 8h). Je participe aux frais bien sûr.",
    "Merci au voisin du 3ème qui a remonté mes courses hier, vous êtes un ange ❤️",
    "Petit rappel sympa : la médiathèque est ouverte le samedi maintenant, jusqu'à 18h !",
    "Quelqu'un sait pourquoi il n'y a plus d'eau chaude dans le quartier ce matin ?",
    "Je donne un canapé 2 places en bon état, à venir chercher avant samedi.",
    "Marché de Noël au parc le 15 décembre, on cherche encore des bénévoles 🎄",
    "Pétition en ligne pour ajouter un passage piéton devant l'école, lien en commentaire.",
    "Bienvenue aux nouveaux arrivants du 12 rue Lafayette, n'hésitez pas à venir vous présenter !",
    "Atelier compostage samedi 10h au jardin partagé, animé par l'association locale.",
];

// ─── Création des posts ───────────────────────────────────────────────────────
$totalCreated = 0;
$totalSkipped = 0;
$now = new \DateTime();

foreach ($quartiers as $quartier) {
    echo "\n📍 Quartier : « " . $quartier->getName() . " » (id={$quartier->getId()})\n";

    // Récupérer les memberships de ce quartier puis ne garder que les users qui existent VRAIMENT
    $memberships = $em->getRepository(Membership::class)->findBy(['quartierId' => $quartier->getId()]);
    $memberUserIds = [];
    foreach ($memberships as $m) {
        if ($em->getRepository(User::class)->find($m->getUserId())) {
            $memberUserIds[] = $m->getUserId();
        }
    }

    // Fallback : si aucun membre valide, on prend n'importe quel user existant
    if (empty($memberUserIds)) {
        echo "   ⚠️  Aucun membre valide. Utilisation des utilisateurs globaux comme auteurs.\n";
        $authorIds = $allUserIds;
    } else {
        $authorIds = $memberUserIds;
    }

    echo "   👥 " . count($authorIds) . " auteur(s) disponible(s).\n";

    // Combien de posts ? (entre 5 et 10)
    $nbPosts = random_int(5, 10);
    $nbPosts = min($nbPosts, count($postsBank));

    // Choisir aléatoirement des posts dans la banque
    $keys = (array) array_rand($postsBank, $nbPosts);
    shuffle($keys);

    $createdThisQuartier = 0;

    foreach ($keys as $idx) {
        $authorId = $authorIds[array_rand($authorIds)];

        $post = new Post();
        $post->setUserId($authorId);
        $post->setQuartierId($quartier->getId());
        $post->setContent($postsBank[$idx]);

        // Date aléatoire dans les 30 derniers jours
        $daysAgo = random_int(0, 30);
        $hoursAgo = random_int(0, 23);
        $minutesAgo = random_int(0, 59);
        $createdAt = (clone $now)->modify("-{$daysAgo} days -{$hoursAgo} hours -{$minutesAgo} minutes");

        // Force la date de création (la propriété est initialisée dans __construct)
        $reflection = new \ReflectionClass($post);
        $prop = $reflection->getProperty('createdAt');
        $prop->setAccessible(true);
        $prop->setValue($post, $createdAt);

        try {
            $em->persist($post);
            $em->flush();
            $totalCreated++;
            $createdThisQuartier++;
        } catch (\Throwable $e) {
            $totalSkipped++;
            echo "   ❌ Erreur insertion (auteur=$authorId) : " . $e->getMessage() . "\n";
            // Reset l'EntityManager si il est dans un état d'erreur
            if (!$em->isOpen()) {
                echo "   ❌ EntityManager fermé suite à l'erreur. Arrêt.\n";
                exit(1);
            }
        }
    }

    echo "   ✅ {$createdThisQuartier} post(s) réellement insérés.\n";
}

echo "\n";
echo "═══════════════════════════════════════════════════════════\n";
echo "  ✨ Terminé : {$totalCreated} post(s) créé(s)";
if ($totalSkipped > 0) {
    echo " — {$totalSkipped} échec(s)";
}
echo ".\n";
echo "═══════════════════════════════════════════════════════════\n\n";
