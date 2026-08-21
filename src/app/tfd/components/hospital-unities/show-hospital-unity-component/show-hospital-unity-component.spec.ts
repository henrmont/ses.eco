import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowHospitalUnityComponent } from './show-hospital-unity-component';

describe('ShowHospitalUnityComponent', () => {
  let component: ShowHospitalUnityComponent;
  let fixture: ComponentFixture<ShowHospitalUnityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowHospitalUnityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowHospitalUnityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
