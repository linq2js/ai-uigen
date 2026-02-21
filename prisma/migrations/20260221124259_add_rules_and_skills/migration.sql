-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "rules" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "skills" TEXT NOT NULL DEFAULT '[]';
