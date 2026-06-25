import { environment } from '@env/environment';

/**
 * Resolve a media path returned by the API (`coverImg`, `filePath`, `portada`, …)
 * into a URL the browser can load.
 *
 * - Absolute URLs (`http(s)://…`) are returned untouched.
 * - Relative paths (e.g. `/uploads/images/cover.png`) get the API origin prepended.
 *   In dev `apiUrl` is empty, so the path stays relative and is served through the
 *   dev-server proxy; in prod it becomes an absolute URL to the deployed backend.
 */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base = environment.apiUrl.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}
