import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransplanteLayout } from './transplante-layout';

describe('TransplanteLayout', () => {
  let component: TransplanteLayout;
  let fixture: ComponentFixture<TransplanteLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransplanteLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransplanteLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
