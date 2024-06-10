import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WoodProjectCardComponent } from './wood-project-card.component';

describe('WoodProjectCardComponent', () => {
  let component: WoodProjectCardComponent;
  let fixture: ComponentFixture<WoodProjectCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WoodProjectCardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WoodProjectCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
