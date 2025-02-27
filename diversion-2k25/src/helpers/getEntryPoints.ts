import { QdrantClient } from "@qdrant/js-client-rest";
import { qdrantClientProvider } from "./clientProviders";

async function getEntryPoints(collectionName: string) {
  // Get all files with potential route definitions
  const result = await qdrantClientProvider.scroll(collectionName, {
    with_payload: ["content", "file_path"],
    limit: 10000 // Adjust based on collection size
  });

  const routePatterns = {
    express: /(?:app|router)\.(get|post|put|delete|all|patch|options|head)\s*\(\s*['"`]([^'"`]+)/g,
    react: /<Route\s+path\s*=\s*['"`]([^'"`]+)/gi,
    vue: /(?:path:\s*['"`]([^'"`]+)|<RouterLink\s+:to\s*=\s*['"`][^'"`]+)/gi,
    angular: /path:\s*['"`]([^'"`]+)/g,
    flask: /@app\.route\s*\(\s*['"`]([^'"`]+)/g,
    django: /path\s*\(\s*['"`]([^'"`]+)/g,
    generic: /(?:['"`]|\/)((?:[a-zA-Z0-9\-_\/{}:]+\/)+[a-zA-Z0-9\-_\/{}:]*)(?:['"`]|\)|\/)/g
  };

  const routes = {
    frontend: [],
    backend: [],
    generic: []
  };

  for (const record of result.points) {
    const content = record.payload.content || "";
    const filePath = record.payload.file_path || "";

    // Detect framework based on file patterns
    const isFrontend = /\.(jsx|tsx|vue)$/.test(filePath);
    const isBackend = /(server|route|controller)\.(js|ts|py)$/.test(filePath);

    // Check all patterns
    for (const [framework, pattern] of Object.entries(routePatterns)) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const [fullMatch, method, path] = match;
        const cleanPath = path ? path : fullMatch.replace(/['"`]/g, '');

        const routeEntry = {
          path: cleanPath,
          framework,
          file: filePath,
          line: getLineNumber(content, match.index),
          httpMethod: method || 'GET' // Default to GET
        };

        if (isFrontend) routes.frontend.push(routeEntry);
        else if (isBackend) routes.backend.push(routeEntry);
        else routes.generic.push(routeEntry);
      }
    }
  }
  console.log('Routes:', routes);
  return routes;
}

