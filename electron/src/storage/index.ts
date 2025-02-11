import { promises as fs } from "fs";
import { join, dirname } from "path";
import { createHash } from "crypto";
import { app } from "electron";

interface StorageData {
  [key: string]: unknown;
}

interface FileContent {
  data: StorageData;
  hash: string;
  timestamp: number;
}

export class Storage {
  private filepath: string;
  private pendingWrites: Map<string, unknown>;
  private writeTimeout: NodeJS.Timeout | null;

  constructor(filename: string) {
    this.filepath = join(app.getPath("userData"), filename);
    this.pendingWrites = new Map();
    this.writeTimeout = null;
  }

  // Generate hash of data for integrity checking
  private generateHash(data: StorageData): string {
    return createHash("sha256").update(JSON.stringify(data)).digest("hex");
  }

  private async ensureDirectory(): Promise<void> {
    try {
      await fs.access(dirname(this.filepath));
    } catch {
      await fs.mkdir(dirname(this.filepath), { recursive: true });
    }
  }

  // Debounced write to prevent excessive disk I/O
  private debouncedWrite(): void {
    if (this.writeTimeout) {
      clearTimeout(this.writeTimeout);
    }

    this.writeTimeout = setTimeout(async () => {
      const writes = Array.from(this.pendingWrites.entries());
      this.pendingWrites.clear();

      try {
        const data: StorageData = {};
        writes.forEach(([key, value]) => {
          data[key] = value;
        });

        const fileContent: FileContent = {
          data,
          hash: this.generateHash(data),
          timestamp: Date.now(),
        };

        await this.ensureDirectory();
        await fs.writeFile(
          this.filepath,
          JSON.stringify(fileContent, null, 2),
          "utf8"
        );
      } catch (error) {
        console.error("Failed to write to storage:", error);
        // Re-add failed writes to pending queue
        writes.forEach(([key, value]) => {
          this.pendingWrites.set(key, value);
        });
      }
    }, 100); // Debounce time in ms
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.pendingWrites.set(key, value);
    this.debouncedWrite();
  }

  async get<T>(key: string, defaultValue: T | null = null): Promise<T | null> {
    try {
      // Check pending writes first
      if (this.pendingWrites.has(key)) {
        return this.pendingWrites.get(key) as T;
      }

      const fileContent = JSON.parse(
        await fs.readFile(this.filepath, "utf8")
      ) as FileContent;

      // Verify data integrity
      const computedHash = this.generateHash(fileContent.data);
      if (computedHash !== fileContent.hash) {
        throw new Error("Storage file corrupted");
      }

      return (fileContent.data[key] ?? defaultValue) as T;
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return defaultValue; // File doesn't exist yet
      }
      console.error("Failed to read from storage:", error);
      return defaultValue;
    }
  }

  async delete(key: string): Promise<void> {
    this.pendingWrites.set(key, undefined);
    this.debouncedWrite();
  }
}

/*
import { Storage } from './storage';

interface Settings {
  theme: 'light' | 'dark';
  volume: number;
}

const storage = new Storage('settings.json');

// Save data with type checking
await storage.set<Settings['theme']>('theme', 'dark');
await storage.set<Settings['volume']>('volume', 0.8);

// Read data with type checking
const theme = await storage.get<Settings['theme']>('theme', 'light');
const volume = await storage.get<Settings['volume']>('volume', 0.5);

// Delete data
await storage.delete('theme');

*/
