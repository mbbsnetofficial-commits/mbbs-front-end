import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { DynamicLayouts } from './dynamic-layouts';

describe('DynamicLayouts', () => {
  let component: DynamicLayouts;
  let fixture: ComponentFixture<DynamicLayouts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicLayouts],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(DynamicLayouts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
