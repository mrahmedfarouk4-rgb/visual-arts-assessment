import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function seed() {
  console.log('--- Starting Database Seed ---');
  const exportPath = path.join(__dirname, 'db_export.json');
  if (!fs.existsSync(exportPath)) {
    console.error('db_export.json not found! Skipping seed.');
    return;
  }

  const rawData = fs.readFileSync(exportPath, 'utf8');
  const data = JSON.parse(rawData);

  // 1. Seed or Update SystemConfig
  if (data.config) {
    const existingConfig = await prisma.systemConfig.findFirst();
    if (existingConfig) {
      await prisma.systemConfig.update({
        where: { id: existingConfig.id },
        data: { config: JSON.stringify(data.config) }
      });
      console.log('✓ SystemConfig updated');
    } else {
      await prisma.systemConfig.create({
        data: { config: JSON.stringify(data.config) }
      });
      console.log('✓ SystemConfig created');
    }
  }

  // 2. Seed Students
  if (Array.isArray(data.students)) {
    for (const s of data.students) {
      const existing = await prisma.student.findUnique({ where: { id: s.id } });
      if (!existing) {
        await prisma.student.create({
          data: {
            id: s.id,
            name: s.name,
            gradeId: s.gradeId || null
          }
        });
      } else {
        await prisma.student.update({
          where: { id: s.id },
          data: {
            name: s.name,
            gradeId: s.gradeId || null
          }
        });
      }
    }
    console.log(`✓ Seeded/Updated ${data.students.length} students`);
  }

  // 3. Seed Evaluations
  if (Array.isArray(data.evaluations)) {
    let count = 0;
    for (const e of data.evaluations) {
      const existing = await prisma.evaluation.findUnique({ where: { id: e.id } });
      const scoresStr = typeof e.scores === 'string' ? e.scores : JSON.stringify(e.scores);
      if (!existing) {
        // verify student exists
        const st = await prisma.student.findUnique({ where: { id: e.studentId } });
        if (st) {
          await prisma.evaluation.create({
            data: {
              id: e.id,
              studentId: e.studentId,
              gradeId: e.gradeId,
              subjectId: e.subjectId,
              evaluationType: e.evaluationType,
              evaluationDate: e.evaluationDate,
              scores: scoresStr
            }
          });
          count++;
        }
      }
    }
    console.log(`✓ Seeded ${count} evaluations`);
  }

  // 4. Synchronize PostgreSQL autoincrement sequences to prevent unique constraint errors
  try {
    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Student"', 'id'), coalesce(max(id), 1) + 1, false) FROM "Student"`);
    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Evaluation"', 'id'), coalesce(max(id), 1) + 1, false) FROM "Evaluation"`);
    console.log('✓ PostgreSQL sequences synchronized');
  } catch (err) {
    console.log('Note: Sequence sync skipped (not PostgreSQL or table empty):', err.message);
  }

  console.log('--- Seed Completed Successfully ---');
}

seed()
  .catch((e) => {
    console.error('Seed Error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
