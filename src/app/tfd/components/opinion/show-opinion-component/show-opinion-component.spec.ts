import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowOpinionComponent } from './show-opinion-component';

describe('ShowOpinionComponent', () => {
  let component: ShowOpinionComponent;
  let fixture: ComponentFixture<ShowOpinionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowOpinionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowOpinionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
