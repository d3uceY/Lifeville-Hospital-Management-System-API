import fs from "fs";
import path from "path";
import config from "../../constants/config";

export function loadICD() {
  const filePath = path.join(__dirname, `../../${config.icdTextName}`);

  const raw = fs.readFileSync(filePath, "utf-8");

  icdList = raw.split("\n").map(line => {
    const [code, ...descParts] = line.trim().split(/\s+/);
    const description = descParts.join(" ");

    return { code, description };
  });

  // Build hashmap for O(1) lookup (data structure optimization, typeshit)
  icdMap = Object.fromEntries(
    icdList.map(entry => [entry.code, entry])
  );
}

const MAX_RESULTS = 20;

// Matches ICD-10-CM code patterns: one leading letter, optionally followed by a digit then
// any mix of digits, dots, and letters (e.g. "A00", "E11.9", "S52.001A", "T14.91XA", "Z")
const CODE_PATTERN = /^[a-zA-Z](\d[\d.a-zA-Z]*)?$/;

export function searchICD(q) {
  const trimmed = q.trim();
  if (!trimmed) return [];

  if (CODE_PATTERN.test(trimmed)) {
    // Code-prefix search: fast path via scan since startsWith on sorted codes is O(n) worst case
    const prefix = trimmed.toUpperCase();
    const results = [];
    for (const entry of icdList) {
      if (entry.code.startsWith(prefix)) {
        results.push(entry);
        if (results.length === MAX_RESULTS) break;
      }
    }
    return results;
  }

  // Description keyword search (case-insensitive)
  const keyword = trimmed.toLowerCase();
  const results = [];
  for (const entry of icdList) {
    if (entry.description.toLowerCase().includes(keyword)) {
      results.push(entry);
      if (results.length === MAX_RESULTS) break;
    }
  }
  return results;
}

export function lookupByCode(code) {
  return icdMap[code.toUpperCase()] ?? null;
}