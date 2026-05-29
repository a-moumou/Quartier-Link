<?php

declare(strict_types=1);

namespace App\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260525120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add pending update fields to quartiers table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE quartiers ADD COLUMN pending_name VARCHAR(150) DEFAULT NULL');
        $this->addSql('ALTER TABLE quartiers ADD COLUMN pending_description TEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE quartiers ADD COLUMN pending_address TEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE quartiers ADD COLUMN has_pending_update BOOLEAN DEFAULT FALSE NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE quartiers DROP COLUMN pending_name');
        $this->addSql('ALTER TABLE quartiers DROP COLUMN pending_description');
        $this->addSql('ALTER TABLE quartiers DROP COLUMN pending_address');
        $this->addSql('ALTER TABLE quartiers DROP COLUMN has_pending_update');
    }
}
