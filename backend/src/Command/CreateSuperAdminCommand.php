<?php

namespace App\Command;

use App\Entity\User;
use App\Enum\VerificationStatus;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Question\Question;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Cree un administrateur general (le « super admin » de l'application).
 *
 * Le role ADMIN_GENERAL est le plus eleve : User::getRoles() le traduit en
 * ROLE_ADMIN_GENERAL, seul role autorise sur /api/super-admin par la regle
 * access_control de config/packages/security.yaml.
 *
 *   php bin/console app:create-super-admin
 *   php bin/console app:create-super-admin admin@quartierlink.fr --first-name=Ada
 */
#[AsCommand(
    name: 'app:create-super-admin',
    description: 'Cree (ou promeut) un compte administrateur general',
)]
class CreateSuperAdminCommand extends Command
{
    private const ROLE = 'ADMIN_GENERAL';
    private const LONGUEUR_MINI = 12;

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserRepository $users,
        private readonly UserPasswordHasherInterface $hasher,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('email', InputArgument::OPTIONAL, 'Adresse e-mail du compte')
            ->addOption('password', 'p', InputOption::VALUE_REQUIRED,
                'Mot de passe (deconseille : il reste dans l\'historique du shell)')
            ->addOption('first-name', null, InputOption::VALUE_REQUIRED, 'Prenom', 'Admin')
            ->addOption('last-name', null, InputOption::VALUE_REQUIRED, 'Nom', 'General')
            ->addOption('promote', null, InputOption::VALUE_NONE,
                'Si l\'e-mail existe deja, le promouvoir au lieu d\'echouer');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Creation d\'un administrateur general');

        // ── e-mail ────────────────────────────────────────────────────
        $email = $input->getArgument('email')
            ?? $io->ask('Adresse e-mail', null, $this->validateurEmail());

        try {
            ($this->validateurEmail())($email);
        } catch (\InvalidArgumentException $e) {
            $io->error($e->getMessage());

            return Command::INVALID;
        }

        $email = strtolower(trim($email));
        $existant = $this->users->findOneBy(['email' => $email]);

        // ── compte deja present : promotion ───────────────────────────
        if ($existant !== null) {
            if ($existant->getRole() === self::ROLE) {
                $io->warning(sprintf('« %s » est deja administrateur general. Rien a faire.', $email));

                return Command::SUCCESS;
            }

            if (!$input->getOption('promote')
                && !$io->confirm(sprintf(
                    'Le compte « %s » existe deja avec le role %s. Le promouvoir ?',
                    $email, $existant->getRole()
                ), false)) {
                $io->comment('Abandon, aucune modification.');

                return Command::SUCCESS;
            }

            $existant->setRole(self::ROLE);
            $existant->setStatus(VerificationStatus::VERIFIE);
            $this->em->flush();

            $io->success(sprintf('« %s » est desormais administrateur general.', $email));

            return Command::SUCCESS;
        }

        // ── mot de passe ──────────────────────────────────────────────
        $motDePasse = $input->getOption('password');

        if ($motDePasse === null) {
            $question = (new Question('Mot de passe (la saisie reste invisible)'))
                ->setHidden(true)
                ->setHiddenFallback(false)
                ->setValidator($this->validateurMotDePasse());
            $motDePasse = $io->askQuestion($question);

            $confirmation = (new Question('Confirmez le mot de passe'))
                ->setHidden(true)
                ->setHiddenFallback(false);
            if ($motDePasse !== $io->askQuestion($confirmation)) {
                $io->error('Les deux saisies different.');

                return Command::INVALID;
            }
        } else {
            try {
                ($this->validateurMotDePasse())($motDePasse);
            } catch (\InvalidArgumentException $e) {
                $io->error($e->getMessage());

                return Command::INVALID;
            }
            $io->warning('Mot de passe passe en option : pensez a nettoyer l\'historique du shell.');
        }

        // ── creation ──────────────────────────────────────────────────
        $user = new User();
        $user->setEmail($email);
        $user->setFirstName($input->getOption('first-name'));
        $user->setLastName($input->getOption('last-name'));
        $user->setPassword($this->hasher->hashPassword($user, $motDePasse));
        $user->setRole(self::ROLE);
        $user->setStatus(VerificationStatus::VERIFIE);

        $this->em->persist($user);
        $this->em->flush();

        $io->success('Administrateur general cree.');
        $io->definitionList(
            ['Identifiant' => (string) $user->getId()],
            ['E-mail'      => $user->getEmail()],
            ['Role'        => self::ROLE.' (ROLE_ADMIN_GENERAL)'],
            ['Statut'      => VerificationStatus::VERIFIE->value],
        );
        $io->note('Ce compte a acces a /api/super-admin : validation des justificatifs et des quartiers.');

        return Command::SUCCESS;
    }

    private function validateurEmail(): callable
    {
        return static function (?string $valeur): string {
            $valeur = trim((string) $valeur);
            if ($valeur === '') {
                throw new \InvalidArgumentException('L\'adresse e-mail est obligatoire.');
            }
            if (!filter_var($valeur, FILTER_VALIDATE_EMAIL)) {
                throw new \InvalidArgumentException(sprintf('« %s » n\'est pas une adresse valide.', $valeur));
            }

            return $valeur;
        };
    }

    private function validateurMotDePasse(): callable
    {
        return static function (?string $valeur): string {
            $valeur = (string) $valeur;
            if (mb_strlen($valeur) < self::LONGUEUR_MINI) {
                throw new \InvalidArgumentException(sprintf(
                    'Le mot de passe doit faire au moins %d caracteres.', self::LONGUEUR_MINI
                ));
            }
            if (!preg_match('/[A-Za-z]/', $valeur) || !preg_match('/\d/', $valeur)) {
                throw new \InvalidArgumentException('Le mot de passe doit melanger lettres et chiffres.');
            }

            return $valeur;
        };
    }
}
