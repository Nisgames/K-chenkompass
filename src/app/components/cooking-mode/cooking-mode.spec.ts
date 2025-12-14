import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CookingMode } from './cooking-mode';

describe('CookingMode', () => {
  let component: CookingMode;
  let fixture: ComponentFixture<CookingMode>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CookingMode]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CookingMode);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
