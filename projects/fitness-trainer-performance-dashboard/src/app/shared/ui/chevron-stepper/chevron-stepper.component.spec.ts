import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChevronStepperComponent } from './chevron-stepper.component';

describe('ChevronStepperComponent', () => {
  let component: ChevronStepperComponent;
  let fixture: ComponentFixture<ChevronStepperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChevronStepperComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ChevronStepperComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('phases', [
      { id: 'p1', phaseName: 'Base', completionPercentage: 100, status: 'COMPLETED' },
      { id: 'p2', phaseName: 'Build', completionPercentage: 40, status: 'IN_PROGRESS' },
    ]);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('marks the in-progress phase active', () => {
    const active = fixture.nativeElement.querySelector('.chevron--active');
    expect(active.textContent).toContain('Build');
  });
});
