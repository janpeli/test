import { promises as fs } from "fs";
import { resolve, dirname, parse, sep, normalize } from "path";
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
    let bd = baseDir ?? app.getPath("userData");
    bd = normalize(bd);
    if (sep === "/") {
      bd = bd.replace(/\\/g, "/");
    }
    this.baseDir = bd;
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
    backupDir?: string,
  ): Promise<string> {
    try {
      const { name, ext } = parse(filePath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupName = `${name}_${timestamp}${ext}`;
      const backupPath = resolve(
        this.baseDir,
        backupDir ?? "backups",
        backupName,
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

  private assertWithinBase(fullPath: string): void {
    const base = this.baseDir.endsWith(sep) ? this.baseDir : this.baseDir + sep;
    if (!fullPath.startsWith(base) && fullPath !== this.baseDir) {
      throw new Error(`Path traversal detected: ${fullPath}`);
    }
  }

  /**
   * Creates a folder at the specified path
   * @param relativePath - Path relative to the base directory
   * @param recursive - Whether to create parent directories if they don't exist
   * @returns The full path of the created directory
   */
  async createFolder(
    relativePath: string,
    recursive: boolean = true,
  ): Promise<string> {
    let rp = normalize(relativePath);
    if (sep === "/") {
      rp = rp.replace(/\\/g, "/");
    }
    const fullPath = resolve(this.baseDir, rp);
    this.assertWithinBase(fullPath);

    try {
      await fs.mkdir(fullPath, { recursive });
      return fullPath;
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "EEXIST"
      ) {
        // Directory already exists, which is fine
        return fullPath;
      }
      console.error("Failed to create directory:", error);
      throw error;
    }
  }

  /**
   * Writes data to a file with optional backup creation
   */
  async writeFile(
    relativePath: string,
    data: string | Buffer,
    options: WriteOptions = {},
  ): Promise<{ path: string; hash?: string; backupPath?: string }> {
    const {
      createBackup = false,
      backupDir,
      encoding = "utf8",
      createDirs = true,
    } = options;

    let rp = normalize(relativePath);
    if (sep === "/") {
      rp = rp.replace(/\\/g, "/");
    }
    const fullPath = resolve(this.baseDir, rp);
    this.assertWithinBase(fullPath);

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
    encoding?: BufferEncoding,
  ): Promise<string | Buffer> {
    let rp = normalize(relativePath);
    if (sep === "/") {
      rp = rp.replace(/\\/g, "/");
    }
    const fullPath = resolve(this.baseDir, rp);
    this.assertWithinBase(fullPath);

    try {
      const content = await fs.readFile(fullPath);
      return encoding ? content.toString(encoding) : content;
    } catch (error) {
      console.error("Failed to read file:", error);
      throw error;
    }
  }

  async readTextFile(path: string) {
    let rp = normalize(path);
    if (sep === "/") {
      rp = rp.replace(/\\/g, "/");
    }

    return (await this.readFile(rp, "utf-8")) as string;
  }

  /**
   * Checks if a file exists
   */
  async exists(relativePath: string): Promise<boolean> {
    let rp = normalize(relativePath);
    if (sep === "/") {
      rp = rp.replace(/\\/g, "/");
    }
    const fullPath = resolve(this.baseDir, rp);
    this.assertWithinBase(fullPath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Deletes a file
   */
  async deleteFile(relativePath: string): Promise<void> {
    let rp = normalize(relativePath);
    if (sep === "/") {
      rp = rp.replace(/\\/g, "/");
    }
    const fullPath = resolve(this.baseDir, rp);
    this.assertWithinBase(fullPath);
    try {
      await fs.unlink(fullPath);
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

  /**
   * Moves a file or folder to a new location within the base directory
   */
  async moveNode(srcRelPath: string, destRelPath: string): Promise<void> {
    let src = normalize(srcRelPath);
    let dest = normalize(destRelPath);
    if (sep === "/") {
      src = src.replace(/\\/g, "/");
      dest = dest.replace(/\\/g, "/");
    }
    const srcFull = resolve(this.baseDir, src);
    const destFull = resolve(this.baseDir, dest);
    this.assertWithinBase(srcFull);
    this.assertWithinBase(destFull);
    await this.ensureDirectory(destFull);
    await fs.rename(srcFull, destFull);
  }

  /**
   * Recursively deletes a folder and all its contents
   */
  async deleteFolder(relativePath: string): Promise<void> {
    let rp = normalize(relativePath);
    if (sep === "/") {
      rp = rp.replace(/\\/g, "/");
    }
    const fullPath = resolve(this.baseDir, rp);
    this.assertWithinBase(fullPath);
    await fs.rm(fullPath, { recursive: true, force: true });
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
