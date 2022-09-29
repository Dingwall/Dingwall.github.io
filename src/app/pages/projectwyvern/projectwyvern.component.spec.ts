import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectwyvernComponent } from './projectwyvern.component';

describe('ProjectwyvernComponent', () => {
  let component: ProjectwyvernComponent;
  let fixture: ComponentFixture<ProjectwyvernComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProjectwyvernComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectwyvernComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
