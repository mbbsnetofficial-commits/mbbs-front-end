import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { StaticLayout } from './static-layout';

describe('StaticLayout', () => {
  let component: StaticLayout;
  let fixture: ComponentFixture<StaticLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaticLayout],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(StaticLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
