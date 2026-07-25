import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { NeetComponent } from './neet';

describe('Neet', () => {
  let component: NeetComponent;
  let fixture: ComponentFixture<NeetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeetComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(NeetComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
