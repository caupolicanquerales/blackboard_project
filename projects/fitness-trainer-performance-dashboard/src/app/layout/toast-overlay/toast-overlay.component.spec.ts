import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastOverlayComponent } from './toast-overlay.component';

describe('ToastOverlayComponent', () => {
  let component: ToastOverlayComponent;
  let fixture: ComponentFixture<ToastOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastOverlayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastOverlayComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit the toast id on dismiss', () => {
    const ids: string[] = [];
    component.dismissed.subscribe((id) => ids.push(id));
    component.dismiss('t1');
    expect(ids).toEqual(['t1']);
  });
});
