import { copyFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDirectory = path.join(projectRoot, 'src', 'generated', 'prisma');
const targetDirectory = path.join(projectRoot, 'dist', 'generated', 'prisma');
const engineFiles = (await readdir(sourceDirectory)).filter((file) => file.endsWith('.node'));

if (engineFiles.length === 0) {
  throw new Error('No generated Prisma engine binaries found. Run `npm run db:generate` before building.');
}

await mkdir(targetDirectory, { recursive: true });
await Promise.all(engineFiles.map((file) =>
  copyFile(path.join(sourceDirectory, file), path.join(targetDirectory, file))
));
