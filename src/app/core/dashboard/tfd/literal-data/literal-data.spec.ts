import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiteralData } from './literal-data';

describe('LiteralData', () => {
  let component: LiteralData;
  let fixture: ComponentFixture<LiteralData>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiteralData]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LiteralData);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
