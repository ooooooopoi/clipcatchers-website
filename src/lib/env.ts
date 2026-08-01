/**
 * Normalises AUTH_URL before anything reads it. Auth.js parses AUTH_URL as a
 * full URL, so a host pasted without a scheme (a very easy mistake in a
 * hosting dashboard) throws and can take the server down. Imported for its
 * side effect at the top of the auth setup.
 */
const raw = process.env.AUTH_URL?.trim();

if (raw && !/^https?:\/\//i.test(raw)) {
  const fixed = `https://${raw.replace(/\/+$/, "")}`;
  console.warn(`[env] AUTH_URL was missing a scheme — using ${fixed}`);
  process.env.AUTH_URL = fixed;
}

if (raw && /^https?:\/\//i.test(raw)) {
  process.env.AUTH_URL = raw.replace(/\/+$/, "");
}

export {};
