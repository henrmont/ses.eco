import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoreLayout } from './core-layout';

describe('CoreLayout', () => {
  let component: CoreLayout;
  let fixture: ComponentFixture<CoreLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoreLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CoreLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
