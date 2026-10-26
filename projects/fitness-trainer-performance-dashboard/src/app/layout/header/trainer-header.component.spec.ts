import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { TrainerHeaderComponent } from './trainer-header.component';
import { TrainerProfileStore } from '../../core/state/trainer-profile.store';

describe('TrainerHeaderComponent', () => {
  it('renders profile and navigates', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    TestBed.inject(TrainerProfileStore).setProfile({
      id: '1', displayName: 'A', headline: 'h', websiteUrl: 'https://x.com', avatarUrl: 'a.png', avatarAlt: 'Avatar',
    });
    const fixture = TestBed.createComponent(TrainerHeaderComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('img')?.getAttribute('alt')).toBe('Avatar');
    expect(el.textContent).toContain('PERSONAL TRAINER');
    const spy = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    (el.querySelector('[aria-label="Next section"]') as HTMLElement).click();
    expect(spy).toHaveBeenCalledWith('/routines');
  });
});
