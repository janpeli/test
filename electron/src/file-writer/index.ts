import { promises as fs } from "fs";
import { resolve, dirname, parse } from "path";
import { app } from "electron";
//import { createHash } from 'crypto';

interface WriteOptions {
  // Create backup of existing file before writing
  createBackup?: boolean;
  // Directory to store backups (relative to app data directory)
  backupDir?: string;
  // Encoding for text files
  encoding?: BufferEncoding;
  // Whether to ensure directories exist
  createDirs?: boolean;
}

export class FileWriter {
  private baseDir: string;

  constructor(baseDir?: string) {
    // If no base directory specified, use app's userData directory
    this.baseDir = baseDir ?? app.getPath("userData");
  }

  /**
   * Generates a hash of the file content for integrity checking
   */
  /*private generateHash(data: Buffer | string): string {
    return createHash('sha256')
      .update(data)
      .digest('hex');
  }*/

  /**
   * Ensures all directories in the path exist
   */
  private async ensureDirectory(filePath: string): Promise<void> {
    const directory = dirname(filePath);
    try {
      await fs.access(directory);
    } catch {
      await fs.mkdir(directory, { recursive: true });
    }
  }

  /**
   * Creates a backup of the existing file
   */
  private async createBackup(
    filePath: string,
    backupDir?: string
  ): Promise<string> {
    try {
      const { name, ext } = parse(filePath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupName = `${name}_${timestamp}${ext}`;
      const backupPath = resolve(
        this.baseDir,
        backupDir ?? "backups",
        backupName
      );

      await this.ensureDirectory(backupPath);
      await fs.copyFile(filePath, backupPath);

      return backupPath;
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        // No existing file to backup
        return "";
      }
      throw error;
    }
  }

  /**
   * Writes data to a file with optional backup creation
   */
  async writeFile(
    relativePath: string,
    data: string | Buffer,
    options: WriteOptions = {}
  ): Promise<{ path: string; hash?: string; backupPath?: string }> {
    const {
      createBackup = false,
      backupDir,
      encoding = "utf8",
      createDirs = true,
    } = options;

    const fullPath = resolve(this.baseDir, relativePath);

    try {
      if (createDirs) {
        await this.ensureDirectory(fullPath);
      }

      let backupPath: string | undefined;
      if (createBackup) {
        backupPath = await this.createBackup(fullPath, backupDir);
      }

      const contentBuffer = Buffer.isBuffer(data)
        ? data
        : Buffer.from(data, encoding);
      await fs.writeFile(fullPath, contentBuffer);

      return {
        path: fullPath,
        //hash: this.generateHash(contentBuffer),
        ...(backupPath && { backupPath }),
      };
    } catch (error) {
      console.error("Failed to write file:", error);
      throw error;
    }
  }

  /**
   * Reads entire file content
   */
  async readFile(
    relativePath: string,
    encoding?: BufferEncoding
  ): Promise<string | Buffer> {
    const fullPath = resolve(this.baseDir, relativePath);

    try {
      const content = await fs.readFile(fullPath);
      return encoding ? content.toString(encoding) : content;
    } catch (error) {
      console.error("Failed to read file:", error);
      throw error;
    }
  }

  async readTextFile(path: string) {
    return (await this.readFile(path, "utf-8")) as string;
  }

  /**
   * Checks if a file exists
   */
  async exists(relativePath: string): Promise<boolean> {
    try {
      await fs.access(resolve(this.baseDir, relativePath));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Deletes a file
   */
  async deleteFile(relativePath: string): Promise<void> {
    try {
      await fs.unlink(resolve(this.baseDir, relativePath));
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code !== "ENOENT"
      ) {
        throw error;
      }
    }
  }
}

/*
import { FileWriter } from './file-writer';

const fileWriter = new FileWriter();

// Write a text file
await fileWriter.writeFile(
  'config/settings.json',
  JSON.stringify({ theme: 'dark' }, null, 2),
  {
    createBackup: true,
    encoding: 'utf8'
  }
);

// Write a binary file
const binaryData = Buffer.from([ ... ]);
await fileWriter.writeFile(
    'data/binary-file.dat',
    binaryData
  );
  
  // Read a file
  const content = await fileWriter.readFile('config/settings.json', 'utf8');
  
  // Check if file exists
  const exists = await fileWriter.exists('config/settings.json');
  
  // Delete a file
  await fileWriter.deleteFile('temp/cache.tmp');
*/
