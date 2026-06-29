/** Presentation model for the signed-in user's profile. */
export interface UserProfile {
  /** Profile row id, or null when the profile hasn't been created yet. */
  idProfile: number | null;
  userId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  /** "firstName lastName", trimmed; falls back to the username when empty. */
  fullName: string;
  birthDate: string | null; // "yyyy-MM-dd"
  phone: string | null;
  country: string | null;
  city: string | null;
  /** Raw stored avatar path, kept so an unchanged profile re-saves the same value. */
  imgProfile: string | null;
  /** Resolved avatar URL, with a placeholder fallback. */
  avatar: string;
}
