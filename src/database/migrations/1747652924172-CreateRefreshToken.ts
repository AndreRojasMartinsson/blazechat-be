import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRefreshToken1747652924172 implements MigrationInterface {
  name = 'CreateRefreshToken1747652924172';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "refresh_token" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "issued" TIMESTAMP NOT NULL DEFAULT now(), "invalidated" TIMESTAMP, "token" text NOT NULL, "userId" uuid, CONSTRAINT "PK_b575dd3c21fb0831013c909e7fe" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_token" ADD CONSTRAINT "FK_8e913e288156c133999341156ad" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_token" DROP CONSTRAINT "FK_8e913e288156c133999341156ad"`,
    );
    await queryRunner.query(`DROP TABLE "refresh_token"`);
  }
}
