import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComparisonBarsComponent } from './comparison-bars.component';

describe('ComparisonBarsComponent', () => {
  let fixture: ComponentFixture<ComparisonBarsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComparisonBarsComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ComparisonBarsComponent);
  });

  it('should create', async () => {
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders a row per ratio', async () => {
    fixture.componentRef.setInput('ratios', [
      { id: 'a', primaryPercentage: 60, secondaryPercentage: 40, categoryLabel: 'A' },
    ]);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('.bar-row').length).toBe(1);
  });
});
