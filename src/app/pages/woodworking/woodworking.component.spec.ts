import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WoodworkingComponent } from './woodworking.component';

describe('WoodworkingComponent', () => {
  let component: WoodworkingComponent;
  let fixture: ComponentFixture<WoodworkingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WoodworkingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WoodworkingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
