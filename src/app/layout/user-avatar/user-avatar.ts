import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AVATAR } from '@core/data/tracks.data';

@Component({
  selector: 'app-user-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-avatar.html',
})
export class UserAvatar {
  protected readonly avatar = AVATAR;
}
