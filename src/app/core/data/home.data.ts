/** Static, presentation-only data for the Home dashboard.
 *  The only hardcoded value left is the tab set; the hero and the popular-artists
 *  row are now derived from real catalog data in `Home` (see its `featured` and
 *  `popularArtists` computeds). */

/** A featured card in the Home hero, built from real catalog content. */
export interface HeroFeature {
  /** What the card points at — drives the icon and copy. */
  kind: 'album' | 'artist';
  title: string;
  subtitle: string;
  /** Call-to-action label (e.g. "Ver álbum"). */
  cta: string;
  /** lucide icon shown inside the CTA, or null for none. */
  icon: string | null;
  /** Resolved artwork URL, or null to fall back to a neutral placeholder. */
  cover: string | null;
  /** Router commands the whole card links to. */
  link: (string | number)[];
  /** When true the card uses the highlighted (teal-tinted) treatment. */
  featured: boolean;
}

/** Tabs that switch the main content area (all five are wired to real data).
 *  The label is also the switch key, matching the Library tabs convention. */
export const contentTabs: string[] = ['Canciones', 'Artistas', 'Álbumes', 'Tendencias', 'Favoritos'];
