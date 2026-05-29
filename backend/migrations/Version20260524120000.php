<?php

declare(strict_types=1);

namespace App\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260524120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add banner_url column to quartiers table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE quartiers ADD COLUMN banner_url TEXT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE quartiers DROP COLUMN banner_url');
    }
}
