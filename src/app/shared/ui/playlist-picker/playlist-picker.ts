import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { Modal } from '@shared/ui/modal/modal';
import { PlaylistPickerService } from './playlist-picker.service';
import { PlaylistsStore } from '@core/state/playlists.store';
import { PlaylistsService } from '@core/api/playlists.service';
import { ToastService } from '@shared/ui/toast/toast.service';

/** Global "add to playlist" modal. Mounted once in the root component. */
@Component({
  selector: 'app-playlist-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Modal, LucideAngularModule],
  template: `
    <app-modal [open]="!!picker.track()" title="Añadir a playlist" (close)="picker.close()">
      @if (playlists.loading()) {
        <p class="text-sm text-soft">Cargando playlists…</p>
      } @else if (playlists.isEmpty()) {
        <p class="text-sm text-soft">
          No tienes playlists todavía. Créala desde el panel lateral con el botón
          <span class="font-semibold text-foreground">+</span>.
        </p>
      } @else {
        <ul class="max-h-[320px] space-y-1 overflow-y-auto">
          @for (p of playlists.playlists(); track p.playlistId) {
            <li>
              <button
                type="button"
                (click)="add(p.playlistId)"
                class="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-base hover:bg-surface-3"
              >
                <span
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-3 text-soft"
                >
                  <lucide-icon name="list-music" class="h-5 w-5"></lucide-icon>
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-[14px] font-medium text-foreground">{{
                    p.name
                  }}</span>
                  <span class="block text-[12px] text-soft">{{ p.songCount }} canción(es)</span>
                </span>
                <lucide-icon
                  name="plus"
                  class="h-4 w-4 shrink-0 text-soft transition-base group-hover:text-primary"
                ></lucide-icon>
              </button>
            </li>
          }
        </ul>
      }
    </app-modal>
  `,
})
export class PlaylistPicker {
  protected readonly picker = inject(PlaylistPickerService);
  protected readonly playlists = inject(PlaylistsStore);
  private readonly api = inject(PlaylistsService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  add(playlistId: number): void {
    const track = this.picker.track();
    if (!track) return;
    const songId = Number(track.id);
    if (!Number.isInteger(songId) || songId <= 0) {
      this.picker.close();
      return;
    }
    this.api
      .addSong(playlistId, songId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Añadida a la playlist.');
          this.playlists.refresh();
          this.picker.close();
        },
        error: () => {
          this.toast.error('No se pudo añadir a la playlist.');
          this.picker.close();
        },
      });
  }
}
