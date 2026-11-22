// Runtime configuration. The UI talks to the data side ONLY through this API base URL.
// Point it anywhere that serves the static API described in contract/ — a CDN, another repo's
// GitHub Pages, a local folder — without touching any other UI file.
// A ?api=https://example.org/api/v1 query parameter overrides it for one session.
window.BIOATLAS_CONFIG = {
  apiBase: "./api/v1",
  docsBase: "./docs",
  repoUrl: "https://github.com/travelagentshawn/BioAtlas",
  repoBranch: "main",
};
