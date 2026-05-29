<?php

declare(strict_types=1);

namespace App\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260524140000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add latitude and longitude to quartiers table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE quartiers ADD COLUMN latitude DOUBLE PRECISION DEFAULT NULL');
        $this->addSql('ALTER TABLE quartiers ADD COLUMN longitude DOUBLE PRECISION DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE quartiers DROP COLUMN latitude');
        $this->addSql('ALTER TABLE quartiers DROP COLUMN longitude');
    }
}
