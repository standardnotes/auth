import { MigrationInterface, QueryRunner } from 'typeorm'

export class addSensitiveFlag1629705289178 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `settings` ADD `sensitive` tinyint NOT NULL DEFAULT 0')

    await queryRunner.query('UPDATE `settings` SET sensitive = 1 WHERE name = "MFA_SECRET"')
    await queryRunner.query('UPDATE `settings` SET sensitive = 1 WHERE name = "EXTENSION_KEY"')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `settings` DROP COLUMN `sensitive`')
  }
}
