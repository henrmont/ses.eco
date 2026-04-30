import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateHospitalUnityComponent } from './create-hospital-unity-component';

describe('CreateHospitalUnityComponent', () => {
  let component: CreateHospitalUnityComponent;
  let fixture: ComponentFixture<CreateHospitalUnityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateHospitalUnityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateHospitalUnityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
