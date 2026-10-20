import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComparisonSplitBarsComponent } from './comparison-split-bars.component';

describe('ComparisonSplitBarsComponent', () => {
  let component: ComparisonSplitBarsComponent;
  let fixture: ComponentFixture<ComparisonSplitBarsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComparisonSplitBarsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ComparisonSplitBarsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('ratios', []);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
