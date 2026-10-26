import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PhaseProgress } from '../../../core/models/phase-progress.model';

type StepState = 'pending' | 'in-progress' | 'completed';

interface Step {
  id: string;
  label: string;
  state: StepState;
  percent: number;
}

const STATE_MAP: Record<PhaseProgress['status'], StepState> = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
};

@Component({
  selector: 'app-phase-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'phase-timeline', 'data-region': 'phase-timeline' },
  template: `
    <ol class="steps" aria-label="Workout phases">
      @for (step of steps(); track step.id; let i = $index) {
        <li
          class="step"
          [class.pending]="step.state === 'pending'"
          [class.in-progress]="step.state === 'in-progress'"
          [class.completed]="step.state === 'completed'"
          [attr.aria-current]="step.state === 'in-progress' ? 'step' : null"
        >
          <span class="num">STEP {{ i + 1 < 10 ? '0' + (i + 1) : i + 1 }}</span>
          <span class="name">{{ step.label }}</span>
          <span class="status">{{ step.state === 'in-progress' ? step.percent + '%' : step.state }}</span>
        </li>
      } @empty {
        <li class="state" role="status">No phases available.</li>
      }
    </ol>
  `,
  styles: `
    :host {
      --pt-surface: #1c1c1c;
      --pt-accent: #ff5a1f;
      --pt-text: #f5f5f5;
      --pt-muted: #c4c4c4;
      display: block;
      grid-area: timeline;
      min-width: 0;
      color: var(--pt-text);
    }
    .steps {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 4px;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .step {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
      padding: 14px 28px 14px 24px;
      background: var(--pt-surface);
      color: var(--pt-muted);
      clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 0 100%, 18px 50%);
      font-style: italic;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .step:first-child { clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 0 100%); }
    .num { font-size: 0.7rem; letter-spacing: 0.12em; }
    .step.pending .num, .step.pending .status { opacity: 1; color: #d9d9d9; }
    .name { overflow-wrap: anywhere; }
    .step { transition: background-color 0.2s ease, color 0.2s ease; }
    @media (prefers-reduced-motion: reduce) { .step { transition: none; } }
    .status { font-size: 0.75rem; font-weight: 600; }
    .completed { background: #3a2216; color: var(--pt-text); }
    .in-progress { background: var(--pt-accent); color: #121212; }
    .state { padding: 16px; color: var(--pt-muted); }
    @media (max-width: 768px) {
      .steps { grid-template-columns: 1fr; }
      .step, .step:first-child { clip-path: none; border-radius: 8px; }
    }
  `,
})
export class PhaseTimelineComponent {
  readonly phases = input<PhaseProgress[]>([]);

  protected readonly steps = computed<Step[]>(() =>
    this.phases()
      .slice(0, 4)
      .map((p) => ({
        id: p.id,
        label: p.phaseName,
        state: STATE_MAP[p.status],
        percent: p.completionPercentage,
      })),
  );
}
