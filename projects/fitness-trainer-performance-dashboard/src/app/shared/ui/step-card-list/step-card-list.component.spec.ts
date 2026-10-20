import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StepCardListComponent } from './step-card-list.component';

describe('StepCardListComponent', () => {
  let component: StepCardListComponent;
  let fixture: ComponentFixture<StepCardListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepCardListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StepCardListComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('steps', []);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
