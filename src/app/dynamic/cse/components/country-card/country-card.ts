import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { Country, enrichCountry } from '../../models/country.model';

const UNIQUE_COUNTRY_HEROES: Record<string, string> = {
  'georgia': 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=800&q=80',
  'kazakhstan': 'https://images.unsplash.com/photo-1558588942-930faae5a389?auto=format&fit=crop&w=800&q=80',
  'united kingdom': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
  'uk': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
  'great britain': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
  'russia': 'https://images.unsplash.com/photo-1513326718677-b964603b136d?auto=format&fit=crop&w=800&q=80',
  'russian federation': 'https://images.unsplash.com/photo-1513326718677-b964603b136d?auto=format&fit=crop&w=800&q=80',
  'philippines': 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  'uzbekistan': 'https://images.unsplash.com/photo-1528642474498-1af0c17fd8c3?auto=format&fit=crop&w=800&q=80',
  'egypt': 'https://images.unsplash.com/photo-1572252821143-0259e2b10168?auto=format&fit=crop&w=800&q=80',
  'armenia': 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80',
  'kyrgyzstan': 'https://images.unsplash.com/photo-1569420038-04f8b0fa3129?auto=format&fit=crop&w=800&q=80',
  'poland': 'https://images.unsplash.com/photo-1519197924294-4ac991a135fe?auto=format&fit=crop&w=800&q=80',
  'hungary': 'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=800&q=80',
  'czech republic': 'https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=800&q=80',
  'czechia': 'https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=800&q=80',
  'germany': 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=800&q=80',
  'australia': 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&w=800&q=80',
  'austria': 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&w=800&q=80',
  'belgium': 'https://images.unsplash.com/photo-1559140022-7935f8d07cfc?auto=format&fit=crop&w=800&q=80',
  'bosnia and herzegovina': 'https://images.unsplash.com/photo-1563282270-f925f44840ec?auto=format&fit=crop&w=800&q=80',
  'bosnia': 'https://images.unsplash.com/photo-1563282270-f925f44840ec?auto=format&fit=crop&w=800&q=80',
  'bulgaria': 'https://images.unsplash.com/photo-1584646098378-0874589d76b1?auto=format&fit=crop&w=800&q=80',
  'croatia': 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80',
  'india': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80',
  'china': 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=800&q=80',
  'nepal': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
  'malaysia': 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=800&q=80',
  'italy': 'https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=800&q=80',
  'spain': 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
  'france': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
  'canada': 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?auto=format&fit=crop&w=800&q=80',
  'usa': 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?auto=format&fit=crop&w=800&q=80',
  'united states': 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?auto=format&fit=crop&w=800&q=80',
  'ireland': 'https://images.unsplash.com/photo-1590089415225-401ed6b9db8e?auto=format&fit=crop&w=800&q=80',
  'sweden': 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=800&q=80',
  'netherlands': 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=800&q=80',
  'switzerland': 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80',
  'romania': 'https://images.unsplash.com/photo-1584646098378-0874589d76b1?auto=format&fit=crop&w=800&q=80',
  'turkey': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80',
  'singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80',
  'new zealand': 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=800&q=80'
};

const UNIQUE_FALLBACK_POOL: string[] = [
  'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1581093458791-9f3c3250ac34?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80'
];

@Component({
  selector: 'app-cse-country-card',
  standalone: true,
  imports: [],
  templateUrl: './country-card.html',
  styleUrl: './country-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CountryCard {
  readonly country = input.required<Country>();
  readonly selected = input<boolean>(false);
  readonly selectCard = output<Country>();
  readonly actionClick = output<Country>();

  // Fallback state signals for robust image rendering
  readonly flagFailed = signal<boolean>(false);
  readonly heroFailed = signal<boolean>(false);

  readonly displayCountry = computed(() => {
    return enrichCountry(this.country());
  });

  readonly heroImageUrl = computed(() => {
    if (this.heroFailed()) {

      return this.getFallbackImage();
    }

    const c = this.displayCountry();
    const nameKey = (c.name || '').toLowerCase().trim();

    // 1. Unique landmark image from component dictionary
    if (UNIQUE_COUNTRY_HEROES[nameKey]) {
      return UNIQUE_COUNTRY_HEROES[nameKey];
    }

    // 2. Custom valid hero image (if not default generic)
    if (c.heroImage && !c.heroImage.includes('photo-1562774053-701939374585')) {
      return c.heroImage;
    }

    // 3. Deterministic unique image selection based on country name/id seed
    return this.getFallbackImage();
  });

  readonly flagImageUrl = computed(() => {
    const c = this.displayCountry();
    const code = (c.code || c.country_code || 'ge').toLowerCase().trim();
    if (this.flagFailed()) {
      return `https://flagcdn.com/w160/${code.length === 2 ? code : 'ge'}.png`;
    }
    return c.flagUrl || `https://flagcdn.com/w160/${code.length === 2 ? code : 'ge'}.png`;
  });

  protected onCardClick(): void {
    this.selectCard.emit(this.displayCountry());
  }

  protected onActionBtnClick(event: MouseEvent): void {
    event.stopPropagation();
    this.selectCard.emit(this.displayCountry());
    this.actionClick.emit(this.displayCountry());
  }

  protected onFlagError(event: Event): void {
    this.flagFailed.set(true);
    const img = event.target as HTMLImageElement;
    if (img) {
      const code = (this.displayCountry().code || 'ge').toLowerCase();
      img.src = `https://flagcdn.com/w160/${code.length === 2 ? code : 'ge'}.png`;
    }
  }

  protected onHeroError(): void {
    this.heroFailed.set(true);
  }

  private getFallbackImage(): string {
    const c = this.displayCountry();
    const seed = (c.name || c.id || c.code || 'country').toLowerCase();
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % UNIQUE_FALLBACK_POOL.length;
    return UNIQUE_FALLBACK_POOL[index];
  }
}
