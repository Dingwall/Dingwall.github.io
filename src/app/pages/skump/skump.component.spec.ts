import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SkumpComponent } from './skump.component';

describe('SkumpComponent', () => {
  let component: SkumpComponent;
  let fixture: ComponentFixture<SkumpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SkumpComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SkumpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
