import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChicagoMarathonComponent } from './chicago-marathon.component';

describe('ChicagoMarathonComponent', () => {
  let component: ChicagoMarathonComponent;
  let fixture: ComponentFixture<ChicagoMarathonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChicagoMarathonComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChicagoMarathonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
