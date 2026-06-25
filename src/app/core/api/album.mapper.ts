import { AlbumTile } from '@core/models/catalog.model';
import { AlbumResponseDTO } from './dto/album.dto';
import { mediaUrl } from './media';

/** Map a backend `AlbumResponseDTO` into the `AlbumTile` shown in the Browse grid. */
export function toAlbumTile(dto: AlbumResponseDTO): AlbumTile {
  return {
    id: dto.idAlbum,
    title: dto.titulo,
    artist: dto.artista?.name ?? '—',
    cover: mediaUrl(dto.portada),
    year: dto.fechaLanzamiento ? dto.fechaLanzamiento.slice(0, 4) : null,
  };
}
