<?php

declare(strict_types=1);

namespace App\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260405180343 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // Add with ACTIF default so existing rows are active; then change default for new rows
        $this->addSql("ALTER TABLE quartiers ADD status VARCHAR(20) DEFAULT 'ACTIF' NOT NULL");
        $this->addSql("ALTER TABLE quartiers ALTER COLUMN status SET DEFAULT 'EN_ATTENTE'");
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE quartiers DROP status');
    }
}
