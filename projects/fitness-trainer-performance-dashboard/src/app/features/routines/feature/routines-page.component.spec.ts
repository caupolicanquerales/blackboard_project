import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RoutinesPageComponent } from './routines-page.component';

describe('RoutinesPageComponent', () => {
  let component: RoutinesPageComponent;
  let fixture: ComponentFixture<RoutinesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoutinesPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(RoutinesPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
