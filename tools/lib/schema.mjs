// Minimal, dependency-free JSON Schema (draft 2020-12 subset) validator.
// Supports: $ref (local + cross-file), $defs, type, const, enum, pattern, minLength,
// minimum, maximum, minItems, uniqueItems, items, properties, required, additionalProperties.
// This is intentionally small. If you need more keywords, extend here and document it.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export function loadSchemas(dir) {
  const byFile = {};
  for (const f of readdirSync(dir)) {
    if (f.endsWith(".schema.json")) byFile[f] = JSON.parse(readFileSync(join(dir, f), "utf8"));
  }
  return byFile;
}

function typeOf(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  if (Number.isInteger(v)) return "integer";
  return typeof v;
}
function typeMatches(v, t) {
  const actual = typeOf(v);
  if (t === "number") return actual === "number" || actual === "integer";
  return actual === t;
}

function resolveRef(ref, currentFile, schemas) {
  const [file, pointer = ""] = ref.split("#");
  const targetFile = file || currentFile;
  let node = schemas[targetFile];
  if (!node) throw new Error(`Unknown schema file in $ref: ${ref}`);
  for (const part of pointer.split("/").filter(Boolean)) node = node?.[part];
  if (node === undefined) throw new Error(`Unresolvable $ref: ${ref}`);
  return { node, file: targetFile };
}

export function validate(value, schema, schemas, file, path = "") {
  const errors = [];
  const err = (msg) => errors.push(`${path || "/"}: ${msg}`);

  if (schema.$ref) {
    const r = resolveRef(schema.$ref, file, schemas);
    return validate(value, r.node, schemas, r.file, path);
  }
  if ("const" in schema && JSON.stringify(value) !== JSON.stringify(schema.const)) {
    err(`must equal ${JSON.stringify(schema.const)}`);
    return errors;
  }
  if (schema.enum && !schema.enum.some((e) => JSON.stringify(e) === JSON.stringify(value))) {
    err(`must be one of ${JSON.stringify(schema.enum)} (got ${JSON.stringify(value)})`);
    return errors;
  }
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => typeMatches(value, t))) {
      err(`expected ${types.join("|")}, got ${typeOf(value)}`);
      return errors;
    }
  }
  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) err(`shorter than ${schema.minLength}`);
    if (schema.pattern && !new RegExp(schema.pattern, "u").test(value)) err(`does not match /${schema.pattern}/ (got "${value}")`);
  }
  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) err(`below minimum ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) err(`above maximum ${schema.maximum}`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) err(`needs at least ${schema.minItems} items`);
    if (schema.uniqueItems) {
      const seen = new Set();
      for (const v of value) {
        const k = JSON.stringify(v);
        if (seen.has(k)) err(`duplicate item ${k}`);
        seen.add(k);
      }
    }
    if (schema.items) value.forEach((v, i) => errors.push(...validate(v, schema.items, schemas, file, `${path}/${i}`)));
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const props = schema.properties || {};
    for (const req of schema.required || []) if (!(req in value)) err(`missing required property "${req}"`);
    for (const [k, v] of Object.entries(value)) {
      if (k in props) errors.push(...validate(v, props[k], schemas, file, `${path}/${k}`));
      else if (schema.additionalProperties === false) err(`unknown property "${k}"`);
    }
  }
  return errors;
}
