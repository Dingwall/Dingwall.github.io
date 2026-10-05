import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RaceMapComponent } from './race-map.component';

describe('RaceMapComponent', () => {
  let component: RaceMapComponent;
  let fixture: ComponentFixture<RaceMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RaceMapComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RaceMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate cumulative route miles', () => {
    const route = [
      [41.8800, -87.6200],
      [41.8810, -87.6200],
      [41.8820, -87.6200],
      [41.8830, -87.6200]
    ] as [number, number][];

    const cumulativeMiles = RaceMapComponent.calculateCumulativeRouteMiles(route);

    expect(cumulativeMiles.length).toBe(4);
    expect(cumulativeMiles[0]).toBe(0);
    expect(cumulativeMiles[3]).toBeGreaterThan(0);
  });

  it("should report a station's closest race mile or miles", () => {
    const route = [
      [41.8800, -87.6200],
      [41.8810, -87.6200],
      [41.8820, -87.6200],
      [41.8830, -87.6200],
      [41.8840, -87.6200],
      [41.8850, -87.6200],
      [41.8845, -87.6210],
      [41.8835, -87.6210],
      [41.8825, -87.6210],
      [41.8815, -87.6210],
      [41.8805, -87.6210]
    ] as [number, number][];

    const station = {
      station_name: 'Test station',
      location: {
        latitude: '41.8837',
        longitude: '-87.6203'
      }
    } as any;

    const nearest = RaceMapComponent.getStationCourseProximity(station, route);

    expect(nearest.closestDistanceMiles).toBeLessThan(1);
    expect(nearest.accessPoints.length).toBeLessThanOrEqual(2);
    expect(nearest.raceMiles.length).toBeGreaterThan(0);
  });

  it('should collapse nearby candidate access points into a small set', () => {
    const accessPoints = [
      { routeMile: 6.7, walkDistanceMiles: 0.40, straightDistanceMiles: 0.35, point: [41.0, -87.0] as [number, number] },
      { routeMile: 6.72, walkDistanceMiles: 0.41, straightDistanceMiles: 0.36, point: [41.01, -87.0] as [number, number] },
      { routeMile: 6.74, walkDistanceMiles: 0.42, straightDistanceMiles: 0.37, point: [41.02, -87.0] as [number, number] },
      { routeMile: 12.1, walkDistanceMiles: 0.60, straightDistanceMiles: 0.55, point: [42.0, -87.0] as [number, number] }
    ];

    const reduced = RaceMapComponent.deduplicateAccessPoints(accessPoints);

    expect(reduced.length).toBeLessThanOrEqual(2);
    expect(reduced.some((entry) => entry.routeMile >= 12)).toBeTrue();
  });

  it('should build course popup content for mile marker clicks', () => {
    const html = (component as any).getCoursePopupContent([41.8835, -87.6200], 13.5);

    expect(html).toContain('Course point');
    expect(html).toContain('Race mile:');
    expect(html).toContain('Open in Apple Maps');
  });
});
