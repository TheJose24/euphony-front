/**
 * DTOs for the User Profile module (`/api/v1/users/profile`, see API_ENDPOINTS.md §6.2).
 * The profile is a separate entity from the user account: only the fields below are
 * editable here (username/email/name live on the user and come back denormalised).
 */

/** Editable profile fields sent with PUT `/update/{userId}`. */
export interface UserProfileRequestDTO {
  birthDate: string | null; // "yyyy-MM-dd"
  country: string | null;
  imgProfile: string | null; // stored path/URL of the avatar
  phone: string | null;
  city: string | null;
}

/** Response body for GET `/search/{userId}` and GET `/all`. */
export interface UserProfileResponseDTO {
  idProfile: number;
  idUser: string; // user UUID
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  imgProfile: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
}
