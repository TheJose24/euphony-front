/**
 * Development environment.
 *
 * `apiUrl` is intentionally empty: requests stay relative (e.g. `/api/v1/songs/all`)
 * and the Angular dev-server forwards them to the backend via `proxy.conf.json`,
 * which sidesteps CORS during local development.
 */
export const environment = {
  production: false,
  apiUrl: '',
};
