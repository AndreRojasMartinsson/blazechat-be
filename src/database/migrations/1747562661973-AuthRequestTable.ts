import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuthRequestTable1747562661973 implements MigrationInterface {
  name = 'AuthRequestTable1747562661973';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "auth_request" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "redirectUri" character varying NOT NULL, "codeChallenge" text NOT NULL, "codeChallengeMethod" character varying NOT NULL, CONSTRAINT "PK_e6ffa70d10a90f700fa437cfd93" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "auth_request"`);
  }
}
