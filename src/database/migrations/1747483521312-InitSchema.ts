import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1747483521312 implements MigrationInterface {
    name = 'InitSchema1747483521312'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "suspension" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "expire_at" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" uuid, "staffId" uuid, CONSTRAINT "PK_b46f45ab12700f920ef9237a967" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "server_role" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "color" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "permissions" bigint NOT NULL DEFAULT '0', "normalized_name" text NOT NULL, "serverId" uuid, CONSTRAINT "PK_77fbb52d800cdca8c698bc0ddcc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0fce1c46a117b7a6ce87861649" ON "server_role" ("normalized_name") `);
        await queryRunner.query(`CREATE TABLE "member_role" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "memberId" uuid, "roleId" uuid, CONSTRAINT "PK_33b2aec0c43fcad85595baa1d9e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "audit_log_action" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, CONSTRAINT "PK_3f97d0f67627908f232650a97c8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "audit_log" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "targetedMemberId" uuid, "createdById" uuid, "actionId" uuid, CONSTRAINT "PK_07fefa57f7f5ab8fc3f52b3ed0b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "server_thread" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "serverId" uuid, CONSTRAINT "PK_b8d68c6c42265a8d06843bfa98f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "thread_message" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "message" text NOT NULL, "edited_at" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "threadId" uuid, "authorId" uuid, CONSTRAINT "PK_93b930acb465111c491d8476563" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "server_member" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nickname" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "timed_out" boolean NOT NULL DEFAULT false, "userId" uuid, "serverId" uuid, CONSTRAINT "PK_310a1c369f7913dd767e58d27e6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "server" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "ownerId" uuid, CONSTRAINT "PK_f8b8af38bdc23b447c0a57c7937" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('admin', 'regular', 'root')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "hashed_password" character varying NOT NULL, "username" character varying NOT NULL, "bio" character varying, "email_confirmed" boolean NOT NULL DEFAULT false, "email_verification_token" text, "role" "public"."user_role_enum" NOT NULL DEFAULT 'regular', CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "pending_deletion" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "REL_ea7b2493712f7ff9077519ed3b" UNIQUE ("userId"), CONSTRAINT "PK_944cc7f19c671adafd070cd54b7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."friendship_status_enum" AS ENUM('pending', 'accepted', 'blocked')`);
        await queryRunner.query(`CREATE TABLE "friendship" ("user_id_1" uuid NOT NULL, "user_id_2" uuid NOT NULL, "status" "public"."friendship_status_enum" NOT NULL DEFAULT 'pending', CONSTRAINT "PK_82d832403c41f7eeaefffec3e58" PRIMARY KEY ("user_id_1", "user_id_2"))`);
        await queryRunner.query(`ALTER TABLE "suspension" ADD CONSTRAINT "FK_a2d5419a0fbe1167d5764702666" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "suspension" ADD CONSTRAINT "FK_612f05f45b768a1a8ef0938fb99" FOREIGN KEY ("staffId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "server_role" ADD CONSTRAINT "FK_1e89da148a3d3b91e71eddc5ad5" FOREIGN KEY ("serverId") REFERENCES "server"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "member_role" ADD CONSTRAINT "FK_0fbb6acc021c683d9f9c73661ad" FOREIGN KEY ("memberId") REFERENCES "server_member"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "member_role" ADD CONSTRAINT "FK_c92e54788d8adffb89c618062c9" FOREIGN KEY ("roleId") REFERENCES "server_role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_log" ADD CONSTRAINT "FK_3c24ccb493e183456a0dbea7e0d" FOREIGN KEY ("targetedMemberId") REFERENCES "server_member"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_log" ADD CONSTRAINT "FK_40bec95f36f7f94229526ae2ba8" FOREIGN KEY ("createdById") REFERENCES "server_member"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_log" ADD CONSTRAINT "FK_8cd6d966370f7ef4be33d6162ae" FOREIGN KEY ("actionId") REFERENCES "audit_log_action"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "server_thread" ADD CONSTRAINT "FK_f54649f67060d123b801507eb99" FOREIGN KEY ("serverId") REFERENCES "server"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "thread_message" ADD CONSTRAINT "FK_7eb3bcc558c80d7d4c9129f1330" FOREIGN KEY ("threadId") REFERENCES "server_thread"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "thread_message" ADD CONSTRAINT "FK_4d20add946e67eeb300ad0567d7" FOREIGN KEY ("authorId") REFERENCES "server_member"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "server_member" ADD CONSTRAINT "FK_f9f9c53e6768e4ad9a7092a3993" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "server_member" ADD CONSTRAINT "FK_57806110c6ca99dbd5e6b1dd729" FOREIGN KEY ("serverId") REFERENCES "server"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "server" ADD CONSTRAINT "FK_f6359e2a174368f2787c48618b3" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pending_deletion" ADD CONSTRAINT "FK_ea7b2493712f7ff9077519ed3b8" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "friendship" ADD CONSTRAINT "FK_d1051f253d57d8da09bfc0284af" FOREIGN KEY ("user_id_1") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "friendship" ADD CONSTRAINT "FK_cfc181862f8099243508548231c" FOREIGN KEY ("user_id_2") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "friendship" DROP CONSTRAINT "FK_cfc181862f8099243508548231c"`);
        await queryRunner.query(`ALTER TABLE "friendship" DROP CONSTRAINT "FK_d1051f253d57d8da09bfc0284af"`);
        await queryRunner.query(`ALTER TABLE "pending_deletion" DROP CONSTRAINT "FK_ea7b2493712f7ff9077519ed3b8"`);
        await queryRunner.query(`ALTER TABLE "server" DROP CONSTRAINT "FK_f6359e2a174368f2787c48618b3"`);
        await queryRunner.query(`ALTER TABLE "server_member" DROP CONSTRAINT "FK_57806110c6ca99dbd5e6b1dd729"`);
        await queryRunner.query(`ALTER TABLE "server_member" DROP CONSTRAINT "FK_f9f9c53e6768e4ad9a7092a3993"`);
        await queryRunner.query(`ALTER TABLE "thread_message" DROP CONSTRAINT "FK_4d20add946e67eeb300ad0567d7"`);
        await queryRunner.query(`ALTER TABLE "thread_message" DROP CONSTRAINT "FK_7eb3bcc558c80d7d4c9129f1330"`);
        await queryRunner.query(`ALTER TABLE "server_thread" DROP CONSTRAINT "FK_f54649f67060d123b801507eb99"`);
        await queryRunner.query(`ALTER TABLE "audit_log" DROP CONSTRAINT "FK_8cd6d966370f7ef4be33d6162ae"`);
        await queryRunner.query(`ALTER TABLE "audit_log" DROP CONSTRAINT "FK_40bec95f36f7f94229526ae2ba8"`);
        await queryRunner.query(`ALTER TABLE "audit_log" DROP CONSTRAINT "FK_3c24ccb493e183456a0dbea7e0d"`);
        await queryRunner.query(`ALTER TABLE "member_role" DROP CONSTRAINT "FK_c92e54788d8adffb89c618062c9"`);
        await queryRunner.query(`ALTER TABLE "member_role" DROP CONSTRAINT "FK_0fbb6acc021c683d9f9c73661ad"`);
        await queryRunner.query(`ALTER TABLE "server_role" DROP CONSTRAINT "FK_1e89da148a3d3b91e71eddc5ad5"`);
        await queryRunner.query(`ALTER TABLE "suspension" DROP CONSTRAINT "FK_612f05f45b768a1a8ef0938fb99"`);
        await queryRunner.query(`ALTER TABLE "suspension" DROP CONSTRAINT "FK_a2d5419a0fbe1167d5764702666"`);
        await queryRunner.query(`DROP TABLE "friendship"`);
        await queryRunner.query(`DROP TYPE "public"."friendship_status_enum"`);
        await queryRunner.query(`DROP TABLE "pending_deletion"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
        await queryRunner.query(`DROP TABLE "server"`);
        await queryRunner.query(`DROP TABLE "server_member"`);
        await queryRunner.query(`DROP TABLE "thread_message"`);
        await queryRunner.query(`DROP TABLE "server_thread"`);
        await queryRunner.query(`DROP TABLE "audit_log"`);
        await queryRunner.query(`DROP TABLE "audit_log_action"`);
        await queryRunner.query(`DROP TABLE "member_role"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0fce1c46a117b7a6ce87861649"`);
        await queryRunner.query(`DROP TABLE "server_role"`);
        await queryRunner.query(`DROP TABLE "suspension"`);
    }

}
