import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TfdLayout } from './tfd-layout';

describe('TfdLayout', () => {
  let component: TfdLayout;
  let fixture: ComponentFixture<TfdLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TfdLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TfdLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
