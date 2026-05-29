<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260525200000 extends AbstractMigration
{
    public function up(Schema $schema): void
    {
        // Ajoute la colonne role avec valeur par défaut MEMBRE
        $this->addSql("ALTER TABLE quartier_members ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'MEMBRE'");

        // Promeut automatiquement les créateurs de quartier en ADMIN
        $this->addSql("
            UPDATE quartier_members qm
            SET role = 'ADMIN'
            FROM quartiers q
            WHERE qm.quartier_id = q.id AND qm.user_id = q.admin_id
        ");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE quartier_members DROP COLUMN role');
    }
}
