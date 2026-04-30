import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteHospitalUnityComponent } from './delete-hospital-unity-component';

describe('DeleteHospitalUnityComponent', () => {
  let component: DeleteHospitalUnityComponent;
  let fixture: ComponentFixture<DeleteHospitalUnityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteHospitalUnityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteHospitalUnityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
