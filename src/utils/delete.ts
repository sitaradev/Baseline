import fs from 'fs/promises';
import path from 'path';

export async function deleteContent(directory: string) {
  try {
    const files = await fs.readdir(directory);
    await Promise.all(files.map(async (file: any) => {
      const filepath = path.join(directory, file);
      const stats = await fs.stat(filepath);

      if (stats.isDirectory()) {
        await deleteContent(filepath);
      } else {
        await fs.unlink(filepath);
      }
    }));
  } catch (error) {
    console.error('Error deleting content:', error);
  }
}
