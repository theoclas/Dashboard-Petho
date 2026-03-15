import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFirebaseUid1773523000000 implements MigrationInterface {
  name = 'AddFirebaseUid1773523000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "firebase_uid" character varying`);
    await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_users_firebase_uid" UNIQUE ("firebase_uid")`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_users_firebase_uid"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "firebase_uid"`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL`);
  }
}
