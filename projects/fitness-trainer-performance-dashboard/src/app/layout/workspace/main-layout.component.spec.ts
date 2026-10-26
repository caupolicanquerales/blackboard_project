import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MainLayoutComponent } from './main-layout.component';

describe('MainLayoutComponent', () => {
  it('renders header, main and toast host', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(MainLayoutComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-trainer-header')).toBeTruthy();
    expect(el.querySelector('main router-outlet')).toBeTruthy();
    expect(el.querySelector('app-toast-host')).toBeTruthy();
  });
});
