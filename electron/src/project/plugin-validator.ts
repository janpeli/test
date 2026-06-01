import Ajv from "ajv";
import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";
import { app } from "electron";

export type PluginFileType = "config" | "schema" | "template" | "product" | "unknown";

export type ValidationResult = {
  errors: string[];
  warnings: string[];
};

type MetaSchemas = {
  config: object;
  jsonSchema: object;
  template: object;
};

let cachedSchemas: MetaSchemas | null = null;

function getMetaSchemasPath(): string {
  if (app.isPackaged) {
    return path.join(path.dirname(app.getAppPath()), "data", "plugins", "meta-schemas");
  }
  return path.join(__dirname, "../data", "plugins", "meta-schemas");
}

function loadMetaSchemas(): MetaSchemas {
  if (cachedSchemas) return cachedSchemas;
  const dir = getMetaSchemasPath();
  cachedSchemas = {
    config: JSON.parse(
      fs.readFileSync(path.join(dir, "plugin-config.meta.schema.json"), "utf8")
    ),
    jsonSchema: JSON.parse(
      fs.readFileSync(path.join(dir, "json-schema.meta.schema.json"), "utf8")
    ),
    template: JSON.parse(
      fs.readFileSync(path.join(dir, "template.meta.schema.json"), "utf8")
    ),
  };
  return cachedSchemas;
}

export function classifyPluginFile(filePath: string): PluginFileType {
  const basename = path.basename(filePath);
  const lower = basename.toLowerCase();
  if (basename === "config.yaml") return "config";
  if (lower.endsWith(".schm.yaml") || basename === "model_schema.yaml") return "schema";
  if (lower.endsWith(".tmpl.yaml")) return "template";
  if (lower.endsWith(".njk")) return "product";
  return "unknown";
}

export async function validatePluginFile(
  filePath: string,
  content: string
): Promise<ValidationResult> {
  const type = classifyPluginFile(filePath);

  if (type === "unknown" || type === "product") {
    return { errors: [], warnings: [] };
  }

  let parsed: unknown;
  try {
    parsed = yaml.parse(content);
  } catch (e) {
    return { errors: [`YAML parse error: ${e}`], warnings: [] };
  }

  let schemas: MetaSchemas;
  try {
    schemas = loadMetaSchemas();
  } catch (e) {
    console.error("Failed to load meta schemas:", e);
    return { errors: [], warnings: [`Could not load validation schema: ${e}`] };
  }

  const schemaMap: Record<Exclude<PluginFileType, "product" | "unknown">, object> = {
    config: schemas.config,
    schema: schemas.jsonSchema,
    template: schemas.template,
  };
  const metaSchema = schemaMap[type as Exclude<PluginFileType, "product" | "unknown">];

  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(metaSchema);
  const valid = validate(parsed);

  if (!valid && validate.errors) {
    const errors = validate.errors.map(
      (e) => `${e.instancePath || "(root)"}: ${e.message ?? "validation error"}`
    );
    return { errors, warnings: [] };
  }

  return { errors: [], warnings: [] };
}

export type ReloadPluginProps = {
  pluginDir: string;
  folderPath: string;
};

export type CreatePluginFileProps = {
  filePath: string;
  folderPath: string;
  content: string;
};
