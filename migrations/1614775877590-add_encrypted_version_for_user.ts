import { MigrationInterface, QueryRunner } from 'typeorm'

export class addEncryptedVersionForUser1614775877590 implements MigrationInterface {
  name = 'addEncryptedVersionForUser1614775877590'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `users` ADD `encryption_version` tinyint NOT NULL DEFAULT 0')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `users` DROP COLUMN `encryption_version`')
  }
}
