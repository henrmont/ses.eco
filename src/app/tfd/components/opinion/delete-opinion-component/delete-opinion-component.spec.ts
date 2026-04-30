import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteOpinionComponent } from './delete-opinion-component';

describe('DeleteOpinionComponent', () => {
  let component: DeleteOpinionComponent;
  let fixture: ComponentFixture<DeleteOpinionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteOpinionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteOpinionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
