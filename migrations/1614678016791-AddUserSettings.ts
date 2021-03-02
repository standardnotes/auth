import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUserSettings1614678016791 implements MigrationInterface {
  name = 'AddUserSettings1614678016791'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE TABLE `settings` (`uuid` varchar(36) NOT NULL, `name` varchar(255) NOT NULL, `value` varchar(255) NOT NULL, `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, `userUuid` varchar(36) NOT NULL, PRIMARY KEY (`uuid`)) ENGINE=InnoDB')
    await queryRunner.query('ALTER TABLE `settings` ADD CONSTRAINT `FK_1cc1d030b83d6030795d3e7e63f` FOREIGN KEY (`userUuid`) REFERENCES `users`(`uuid`) ON DELETE CASCADE ON UPDATE NO ACTION')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `settings` DROP FOREIGN KEY `FK_1cc1d030b83d6030795d3e7e63f`')
    await queryRunner.query('DROP TABLE `settings`')
  }
}
