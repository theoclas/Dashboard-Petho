import { MigrationInterface, QueryRunner } from "typeorm";

export class NuevoCambio1773521930879 implements MigrationInterface {
    name = 'NuevoCambio1773521930879'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "is_deleted" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_deleted"`);
    }

}
