import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-statistics-bar',
  styleUrl: './statistics-bar.component.scss',
  templateUrl: './statistics-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatisticsBarComponent {
  readonly intensity = input<number>(0);

  protected readonly clamped = computed(() => {
    const value = Number(this.intensity());
    return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  });
}
