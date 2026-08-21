import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateHospitalUnityComponent } from './update-hospital-unity-component';

describe('UpdateHospitalUnityComponent', () => {
  let component: UpdateHospitalUnityComponent;
  let fixture: ComponentFixture<UpdateHospitalUnityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateHospitalUnityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateHospitalUnityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
