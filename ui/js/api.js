// The ONLY module that fetches data. Everything it returns is shaped by contract/api-v1.schema.json.
const cfg = window.BIOATLAS_CONFIG || {};
const override = new URLSearchParams(location.search).get("api");
export const API_BASE = (override || cfg.apiBase || "./api/v1").replace(/\/$/, "");
export const REPO = { url: cfg.repoUrl, branch: cfg.repoBranch || "main" };
export const DOCS_BASE = (cfg.docsBase || "./docs").replace(/\/$/, "");

const cache = new Map();
async function getJSON(url) {
  if (!cache.has(url)) {
    cache.set(url, fetch(url).then((r) => {
      if (!r.ok) throw new Error(`${r.status} ${r.statusText} — ${url}`);
      return r.json();
    }));
  }
  try { return await cache.get(url); } catch (e) { cache.delete(url); throw e; }
}
const get = (p) => getJSON(`${API_BASE}/${p}`);
const id = encodeURIComponent;

export const api = {
  manifest: () => get("manifest.json"),
  tree: () => get("tree.json"),
  taxa: () => get("taxa.json"),
  taxon: (i) => get(`taxa/${id(i)}.json`),
  speciesList: () => get("species.json"),
  species: (i) => get(`species/${id(i)}.json`),
  regionList: () => get("regions.json"),
  region: (i) => get(`regions/${id(i)}.json`),
  calendar: () => get("calendar.json"),
  sources: () => get("sources.json"),
  search: () => get("search.json"),
};
export const fetchDocs = (path) => fetch(`${DOCS_BASE}/${path}`).then((r) => {
  if (!r.ok) throw new Error(`${r.status} — ${path}`);
  return path.endsWith(".json") ? r.json() : r.text();
});
