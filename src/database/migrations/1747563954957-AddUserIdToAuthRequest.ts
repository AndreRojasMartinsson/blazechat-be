import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserIdToAuthRequest1747563954957 implements MigrationInterface {
  name = 'AddUserIdToAuthRequest1747563954957';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "auth_request" ADD "userId" uuid NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "auth_request" DROP COLUMN "userId"`);
  }
}
