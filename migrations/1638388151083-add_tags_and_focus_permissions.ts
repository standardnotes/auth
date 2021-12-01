import { MigrationInterface, QueryRunner } from 'typeorm'

export class addTagsAndFocusPermissions1638388151083 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('INSERT INTO `permissions` (uuid, name) VALUES ("1cd5d412-cb57-4cc0-a982-10045ef92780", "app:focus-mode")')
    await queryRunner.query('INSERT INTO `permissions` (uuid, name) VALUES ("6c854d5f-3879-4433-aa3d-8a4440ed0efa", "app:tag-nesting")')

    // Pro User Permissions
    await queryRunner.query('INSERT INTO `role_permissions` (role_uuid, permission_uuid) VALUES \
    ("8047edbb-a10a-4ff8-8d53-c2cae600a8e8", "6c854d5f-3879-4433-aa3d-8a4440ed0efa"), \
    ("8047edbb-a10a-4ff8-8d53-c2cae600a8e8", "1cd5d412-cb57-4cc0-a982-10045ef92780") \
    ')

    // Plus User Permissions
    await queryRunner.query('INSERT INTO `role_permissions` (role_uuid, permission_uuid) VALUES \
      ("dee6e144-724b-4450-86d1-cc784770b2e2", "6c854d5f-3879-4433-aa3d-8a4440ed0efa"), \
      ("dee6e144-724b-4450-86d1-cc784770b2e2", "1cd5d412-cb57-4cc0-a982-10045ef92780") \
    ')

    // Core User Permissions
    await queryRunner.query('INSERT INTO `role_permissions` (role_uuid, permission_uuid) VALUES \
      ("bde42e26-628c-44e6-9d76-21b08954b0bf", "1cd5d412-cb57-4cc0-a982-10045ef92780") \
    ')
  }

  public async down(): Promise<void> {
    return
  }
}
