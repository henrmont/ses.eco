import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteRouteComponent } from './delete-route-component';

describe('DeleteRouteComponent', () => {
  let component: DeleteRouteComponent;
  let fixture: ComponentFixture<DeleteRouteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteRouteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteRouteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
