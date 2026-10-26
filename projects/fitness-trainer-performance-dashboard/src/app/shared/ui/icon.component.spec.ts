import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconComponent } from './icon.component';

describe('IconComponent', () => {
  let fixture: ComponentFixture<IconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [IconComponent] }).compileComponents();
    fixture = TestBed.createComponent(IconComponent);
  });

  it('renders an aria-hidden svg with a path', async () => {
    fixture.componentRef.setInput('name', 'heart');
    await fixture.whenStable();
    const svg: SVGElement = fixture.nativeElement.querySelector('svg');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.querySelector('path')).toBeTruthy();
  });

  it('applies size', async () => {
    fixture.componentRef.setInput('name', 'check');
    fixture.componentRef.setInput('size', 32);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('svg').getAttribute('width')).toBe('32');
  });
});
