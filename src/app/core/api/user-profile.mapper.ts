import { UserProfile } from '@core/models/user.model';
import { AVATAR } from '@core/data/tracks.data';
import { UserProfileResponseDTO } from './dto/user-profile.dto';
import { mediaUrl } from './media';

/** Map a backend `UserProfileResponseDTO` into the UI `UserProfile` model. */
export function toUserProfile(dto: UserProfileResponseDTO): UserProfile {
  const fullName = `${dto.firstName ?? ''} ${dto.lastName ?? ''}`.trim();
  return {
    idProfile: dto.idProfile,
    userId: dto.idUser,
    username: dto.username,
    email: dto.email,
    firstName: dto.firstName ?? '',
    lastName: dto.lastName ?? '',
    fullName: fullName || dto.username,
    birthDate: dto.birthDate ?? null,
    phone: dto.phone ?? null,
    country: dto.country ?? null,
    city: dto.city ?? null,
    imgProfile: dto.imgProfile ?? null,
    avatar: mediaUrl(dto.imgProfile) ?? AVATAR,
  };
}
