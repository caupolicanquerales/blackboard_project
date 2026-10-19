import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RadialGaugesComponent } from './radial-gauges.component';

describe('RadialGaugesComponent', () => {
  let component: RadialGaugesComponent;
  let fixture: ComponentFixture<RadialGaugesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RadialGaugesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RadialGaugesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
