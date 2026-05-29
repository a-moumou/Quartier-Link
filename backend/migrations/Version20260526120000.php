<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260526120000 extends AbstractMigration
{
    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE users ADD COLUMN reset_token VARCHAR(6) DEFAULT NULL');
        $this->addSql('ALTER TABLE users ADD COLUMN reset_token_expires_at TIMESTAMP DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE users DROP COLUMN reset_token');
        $this->addSql('ALTER TABLE users DROP COLUMN reset_token_expires_at');
    }
}
