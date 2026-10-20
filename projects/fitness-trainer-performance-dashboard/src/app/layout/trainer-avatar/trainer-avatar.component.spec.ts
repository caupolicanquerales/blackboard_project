import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrainerAvatarComponent } from './trainer-avatar.component';

describe('TrainerAvatarComponent', () => {
  let component: TrainerAvatarComponent;
  let fixture: ComponentFixture<TrainerAvatarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrainerAvatarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TrainerAvatarComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('avatar', null);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
