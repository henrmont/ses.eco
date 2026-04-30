import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomecareLayout } from './homecare-layout';

describe('HomecareLayout', () => {
  let component: HomecareLayout;
  let fixture: ComponentFixture<HomecareLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomecareLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomecareLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
