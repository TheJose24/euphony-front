/** Static, presentation-only data for the Home dashboard sections.
 *  These are placeholders for the discovery UI; the Playlist tab is wired to
 *  the real Songs API. The rest will be connected to the backend later. */

export interface HeroBanner {
  title: string;
  subtitle: string;
  cta: string;
  /** lucide icon name shown inside the CTA button, or null for none. */
  icon: string | null;
  /** When true the card uses the highlighted (teal-tinted) treatment. */
  featured: boolean;
}

export interface PopularArtist {
  name: string;
  /** Cover/photo URL used as the artist tile image. */
  photo: string;
}

/** Tabs that switch the main content area. Only "Playlist" is wired for now. */
export const contentTabs: string[] = ['Playlist', 'Artists', 'Albums', 'Streams', 'Favorites'];

export const heroBanners: HeroBanner[] = [
  {
    title: 'Your Personalized Musical Journey',
    subtitle: 'Unlock the Realm of Sonic Bliss with Our Streaming App',
    cta: 'Upgrade now',
    icon: 'crown',
    featured: true,
  },
  {
    title: 'Where Everyone Finds a Home',
    subtitle: 'Elevate Your Life with Music Streaming for Everyone',
    cta: 'Learn more',
    icon: null,
    featured: false,
  },
];

export const popularArtists: PopularArtist[] = [
  { name: 'Lily Moonshadow', photo: 'assets/album1.jpg' },
  { name: 'Max Silverlake', photo: 'assets/album2.jpg' },
  { name: 'Ruby Riversong', photo: 'assets/album3.jpg' },
  { name: 'Finn Oceanwood', photo: 'assets/album4.jpg' },
  { name: 'Neon Vega', photo: 'assets/album5.jpg' },
];
