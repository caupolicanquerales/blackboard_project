import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExerciseStepCardsComponent } from './exercise-step-cards.component';

describe('ExerciseStepCardsComponent', () => {
  let component: ExerciseStepCardsComponent;
  let fixture: ComponentFixture<ExerciseStepCardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExerciseStepCardsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ExerciseStepCardsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('steps', []);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
