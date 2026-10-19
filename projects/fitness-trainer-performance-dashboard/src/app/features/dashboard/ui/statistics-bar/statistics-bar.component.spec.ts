import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatisticsBarComponent } from './statistics-bar.component';

describe('StatisticsBarComponent', () => {
  let component: StatisticsBarComponent;
  let fixture: ComponentFixture<StatisticsBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatisticsBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatisticsBarComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('intensity', 50);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
