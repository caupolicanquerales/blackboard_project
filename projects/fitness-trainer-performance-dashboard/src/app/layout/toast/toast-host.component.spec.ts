import { TestBed } from '@angular/core/testing';
import { ToastHostComponent } from './toast-host.component';
import { ToastStore } from '../../core/state/toast.store';

describe('ToastHostComponent', () => {
  it('renders toasts and closes them', () => {
    const fixture = TestBed.createComponent(ToastHostComponent);
    const store = TestBed.inject(ToastStore);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[aria-live="polite"]')?.getAttribute('data-state')).toBe('empty');
    store.show('Hello', 'info', 0);
    fixture.detectChanges();
    expect(el.textContent).toContain('Hello');
    (el.querySelector('button') as HTMLElement).click();
    fixture.detectChanges();
    expect(el.querySelectorAll('.toast').length).toBe(0);
  });
});
