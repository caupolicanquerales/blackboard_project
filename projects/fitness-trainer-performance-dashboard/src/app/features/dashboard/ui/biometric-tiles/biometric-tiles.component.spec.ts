import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BiometricTilesComponent } from './biometric-tiles.component';

describe('BiometricTilesComponent', () => {
  let component: BiometricTilesComponent;
  let fixture: ComponentFixture<BiometricTilesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BiometricTilesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BiometricTilesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
