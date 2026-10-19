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
    fixture.componentRef.setInput('phases', []);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
