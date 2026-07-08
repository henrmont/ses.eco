import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomecareLiteralData } from './homecare-literal-data';

describe('HomecareLiteralData', () => {
  let component: HomecareLiteralData;
  let fixture: ComponentFixture<HomecareLiteralData>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomecareLiteralData]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomecareLiteralData);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
