import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNormalizedNameMember1747484078145
  implements MigrationInterface
{
  name = 'CreateNormalizedNameMember1747484078145';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "server_member" ADD "normalized_name" text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "server_member" DROP COLUMN "nickname"`,
    );
    await queryRunner.query(
      `ALTER TABLE "server_member" ADD "nickname" text NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5e1087d444eeefae11e1a7ae1d" ON "server_member" ("nickname") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_25173d7c25ad110892f74903cc" ON "server_member" ("normalized_name") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_25173d7c25ad110892f74903cc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5e1087d444eeefae11e1a7ae1d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "server_member" DROP COLUMN "nickname"`,
    );
    await queryRunner.query(
      `ALTER TABLE "server_member" ADD "nickname" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "server_member" DROP COLUMN "normalized_name"`,
    );
  }
}
