import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainer } from '@shared/ui/toast/toast-container';
import { PlaylistPicker } from '@shared/ui/playlist-picker/playlist-picker';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainer, PlaylistPicker],
  template: '<router-outlet /><app-playlist-picker /><app-toast-container />',
})
export class App {}
