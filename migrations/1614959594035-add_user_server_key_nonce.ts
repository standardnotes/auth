import { MigrationInterface, QueryRunner } from 'typeorm'

export class addUserServerKeyNonce1614959594035 implements MigrationInterface {
  name = 'addUserServerKeyNonce1614959594035'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `users` ADD `server_key_nonce` varchar(255) NULL')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `users` DROP COLUMN `server_key_nonce`')
  }
}
