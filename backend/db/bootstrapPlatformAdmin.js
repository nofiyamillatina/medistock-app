import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';

const backendDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(backendDirectory, '.env') });

const { Prisma, PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

class BootstrapError extends Error {}

async function bootstrapPlatformAdmin() {
  const email = typeof process.env.PLATFORM_ADMIN_EMAIL === 'string'
    ? process.env.PLATFORM_ADMIN_EMAIL.trim().toLowerCase()
    : '';
  const password = process.env.PLATFORM_ADMIN_PASSWORD || '';
  const confirmation = typeof process.env.PLATFORM_ADMIN_BOOTSTRAP_CONFIRM === 'string'
    ? process.env.PLATFORM_ADMIN_BOOTSTRAP_CONFIRM.trim().toLowerCase()
    : '';

  if (!process.env.DATABASE_URL) throw new BootstrapError('DATABASE_URL is required. No database connection was attempted.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BootstrapError('PLATFORM_ADMIN_EMAIL must be a valid email.');
  if (confirmation !== email) throw new BootstrapError('Set PLATFORM_ADMIN_BOOTSTRAP_CONFIRM to the same email to confirm this one-time operation.');
  if (password.length < 14 || password.length > 128 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9\s]/.test(password)) {
    throw new BootstrapError('PLATFORM_ADMIN_PASSWORD must be 14–128 characters and include uppercase, lowercase, a number, and a symbol.');
  }

  return prisma.$transaction(async (tx) => {
    const existingEmail = await tx.users.findUnique({ where: { email } });
    if (existingEmail) {
      if (existingEmail.role === 'platform_admin') return false;
      throw new BootstrapError('That email already belongs to another account; no account was changed.');
    }

    const existingAdmin = await tx.users.findFirst({
      where: { role: 'platform_admin' },
      select: { id: true }
    });
    if (existingAdmin) throw new BootstrapError('A platform admin already exists; bootstrap will not create or change accounts.');

    const password_hash = await bcrypt.hash(password, 12);
    await tx.users.create({
      data: {
        email,
        username: null,
        password_hash,
        role: 'platform_admin',
        pharmacy_id: null
      },
      select: { id: true }
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

try {
  const created = await bootstrapPlatformAdmin();
  console.log(created
    ? 'Platform admin bootstrap completed; no credentials were printed.'
    : 'Platform admin account already exists; no account was modified.');
} catch (error) {
  if (error instanceof BootstrapError) {
    console.error(`Platform admin bootstrap stopped: ${error.message}`);
  } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
    console.error('Platform admin bootstrap encountered a concurrent change. Retry only after confirming the database target.');
  } else {
    console.error('Platform admin bootstrap failed. Database details and credentials were not logged.');
  }
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
