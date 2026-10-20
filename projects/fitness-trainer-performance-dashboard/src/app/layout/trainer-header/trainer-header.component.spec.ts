import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrainerHeaderComponent } from './trainer-header.component';

describe('TrainerHeaderComponent', () => {
  let fixture: ComponentFixture<TrainerHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TrainerHeaderComponent] }).compileComponents();
    fixture = TestBed.createComponent(TrainerHeaderComponent);
    fixture.componentRef.setInput('profile', null);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
