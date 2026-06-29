import { describe, expect, it } from 'vitest';
import { toUserProfile } from './user-profile.mapper';
import { AVATAR } from '@core/data/tracks.data';
import { UserProfileResponseDTO } from './dto/user-profile.dto';

function dto(overrides: Partial<UserProfileResponseDTO> = {}): UserProfileResponseDTO {
  return {
    idProfile: 1,
    idUser: 'uuid-1',
    username: 'juanperez',
    email: 'juan@example.com',
    firstName: 'Juan',
    lastName: 'Perez',
    birthDate: '1990-05-20',
    imgProfile: '/uploads/images/juan.jpg',
    phone: '+51 987654321',
    country: 'Perú',
    city: 'Lima',
    ...overrides,
  };
}

describe('toUserProfile', () => {
  it('maps the fields and builds the full name', () => {
    const p = toUserProfile(dto());
    expect(p.idProfile).toBe(1);
    expect(p.userId).toBe('uuid-1');
    expect(p.fullName).toBe('Juan Perez');
    expect(p.city).toBe('Lima');
    expect(p.avatar).toBe('/uploads/images/juan.jpg');
  });

  it('falls back to the username when there is no name', () => {
    const p = toUserProfile(dto({ firstName: '', lastName: '' }));
    expect(p.fullName).toBe('juanperez');
  });

  it('uses the placeholder avatar when there is no profile image', () => {
    expect(toUserProfile(dto({ imgProfile: null })).avatar).toBe(AVATAR);
  });

  it('normalises missing optional fields to null', () => {
    const p = toUserProfile(dto({ birthDate: null, phone: null, country: null, city: null }));
    expect(p.birthDate).toBeNull();
    expect(p.phone).toBeNull();
    expect(p.country).toBeNull();
    expect(p.city).toBeNull();
  });
});
