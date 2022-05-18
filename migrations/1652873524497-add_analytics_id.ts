import { MigrationInterface, QueryRunner } from 'typeorm'

export class addAnalyticsId1652873524497 implements MigrationInterface {
  name = 'addAnalyticsId1652873524497'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `users` ADD `analytics_id` int NULL AUTO_INCREMENT')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `users` DROP COLUMN `analytics_id`')
  }
}
