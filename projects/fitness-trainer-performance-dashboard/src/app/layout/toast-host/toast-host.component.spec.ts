import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastHostComponent } from './toast-host.component';

describe('ToastHostComponent', () => {
  let component: ToastHostComponent;
  let fixture: ComponentFixture<ToastHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastHostComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('toasts', [
      { id: 'n1', message: 'Saved', severity: 'success', createdAt: '2024-01-01T00:00:00Z' },
    ]);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits dismissed with id on click', () => {
    const spy = vi.fn();
    component.dismissed.subscribe(spy);
    fixture.nativeElement.querySelector('.toast').click();
    expect(spy).toHaveBeenCalledWith('n1');
  });
});
