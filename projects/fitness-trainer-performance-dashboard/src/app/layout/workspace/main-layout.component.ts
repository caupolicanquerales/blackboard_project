import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TrainerHeaderComponent } from '../header/trainer-header.component';
import { ToastHostComponent } from '../toast/toast-host.component';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, TrainerHeaderComponent, ToastHostComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {}
