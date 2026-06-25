import { ArtistTile } from '@core/models/catalog.model';
import { ArtistResponseDTO } from './dto/artist.dto';

/** Map a backend `ArtistResponseDTO` into the `ArtistTile` shown in the Browse grid. */
export function toArtistTile(dto: ArtistResponseDTO): ArtistTile {
  return {
    id: dto.idArtist,
    name: dto.name,
    country: dto.country,
    verified: dto.isVerified,
    initial: (dto.name?.trim().charAt(0) || '?').toUpperCase(),
  };
}
