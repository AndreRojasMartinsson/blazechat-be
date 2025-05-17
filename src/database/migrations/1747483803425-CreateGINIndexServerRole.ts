import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGINIndexServerRole1747483803425
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_serverrole_normalizedname_trgm ON "server_role" USING GIN (normalized_name gin_trgm_ops)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_serverrole_normalizedname_trgm`,
    );
  }
}
