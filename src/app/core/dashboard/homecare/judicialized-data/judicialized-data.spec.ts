import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JudicializedData } from './judicialized-data';

describe('JudicializedData', () => {
  let component: JudicializedData;
  let fixture: ComponentFixture<JudicializedData>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JudicializedData]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JudicializedData);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
