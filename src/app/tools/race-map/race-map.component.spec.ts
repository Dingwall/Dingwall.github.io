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

  it('should expose an explicit location request trigger', () => {
    const spy = spyOn<any>(component, 'enableUserLocation');

    component.requestLocationAccess();

    expect(spy).toHaveBeenCalled();
  });

  it('should prefer a device heading fallback when GPS heading is unavailable', () => {
    component['deviceHeadingDegrees'] = 135;

    expect(component['resolveHeadingDegrees']()).toBe(135);
    expect(component['resolveHeadingDegrees'](undefined)).toBe(135);
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

  it('should merge all active line colors for same-location stations without duplicates', () => {
    const stations = [
      {
        station_name: 'Washington/Wabash',
        stop_name: 'Washington/Wabash (Inner Loop)',
        location: { latitude: '41.88322', longitude: '-87.626189' },
        g: true,
        brn: false,
        p: true,
        y: false,
        pnk: true,
        o: true,
        red: false,
        blue: false
      },
      {
        station_name: 'Washington/Wabash',
        stop_name: 'Washington/Wabash (Outer Loop)',
        location: { latitude: '41.88322', longitude: '-87.626189' },
        g: true,
        brn: true,
        p: false,
        y: false,
        pnk: false,
        o: false,
        red: false,
        blue: false
      }
    ] as any;

    const lines = RaceMapComponent.getDistinctStationLineEntries(stations);

    expect(lines.map((line) => line.code).sort()).toEqual(['brn', 'g', 'o', 'p', 'pnk']);
    expect(RaceMapComponent.buildStationPopupHeader(stations)).toContain('Washington/Wabash');
    expect(RaceMapComponent.buildStationPopupHeader(stations).match(/Green Line/g)?.length).toBe(1);
  });

  it('should preserve loop-direction line sets when the same station has different inner/outer variants', () => {
    const stations = [
      {
        stop_id: '30141',
        station_name: 'Washington/Wells',
        stop_name: 'Washington/Wells (Inner Loop)',
        location: { latitude: '41.882695', longitude: '-87.63378' },
        brn: false,
        p: true,
        pnk: true,
        o: true,
        g: false,
        red: false,
        blue: false,
        y: false
      },
      {
        stop_id: '30142',
        station_name: 'Washington/Wells',
        stop_name: 'Washington/Wells (Outer Loop)',
        location: { latitude: '41.882695', longitude: '-87.63378' },
        brn: true,
        p: false,
        pnk: false,
        o: false,
        g: false,
        red: false,
        blue: false,
        y: false
      }
    ] as any;

    const grouped = RaceMapComponent.groupStationsByLocation(stations);
    const mergedStations = RaceMapComponent.deduplicateStationsByStopId(Array.from(grouped.values()).flat());
    const lines = RaceMapComponent.getDistinctStationLineEntries(mergedStations);

    expect(lines.map((line) => line.code).sort()).toEqual(['brn', 'o', 'p', 'pnk']);
    expect(RaceMapComponent.buildStationPopupHeader(mergedStations)).toContain('Brown Line');
  });

  it('should parse duration text in seconds, m:ss, and h:mm:ss formats', () => {
    expect((component as any).parseDurationInput('45')).toBe(0.75);
    expect((component as any).parseDurationInput('5:45')).toBe(5.75);
    expect((component as any).parseDurationInput('1:05:45')).toBe(65.75);
    expect((component as any).formatDurationMinutes(65.75)).toBe('01:05:45');
  });

  it('should widen the ETA window as runners go farther into the race', () => {
    component.runnerProfiles = [
      { id: 'steady', name: 'Steady', startTime: '07:00', paceMinutesPerMile: 6.0, totalMinutes: null, splits: [] }
    ];

    const earlyForecast = component.getRunnerForecastForDistance(component.runnerProfiles[0], 5);
    const halfwayForecast = component.getRunnerForecastForDistance(component.runnerProfiles[0], 13.1);
    const lateForecast = component.getRunnerForecastForDistance(component.runnerProfiles[0], 26.2);

    expect(earlyForecast).not.toBeNull();
    expect(halfwayForecast).not.toBeNull();
    expect(lateForecast).not.toBeNull();
    expect((halfwayForecast!.windowEnd.getTime() - halfwayForecast!.windowStart.getTime())
      > (earlyForecast!.windowEnd.getTime() - earlyForecast!.windowStart.getTime())).toBeTrue();
    expect((lateForecast!.windowEnd.getTime() - lateForecast!.windowStart.getTime())
      > (halfwayForecast!.windowEnd.getTime() - halfwayForecast!.windowStart.getTime())).toBeTrue();
  });

  it('should apply actual split data to shift the predicted ETA while preserving the pace model', () => {
    const profile = {
      id: 'split-runner',
      name: 'Split Runner',
      startTime: '07:00',
      paceMinutesPerMile: 6.0,
      totalMinutes: null,
      splits: [
        { id: 's-5k', distanceMiles: 3.1, elapsedMinutes: 21.0 },
        { id: 's-half', distanceMiles: 13.1, elapsedMinutes: 78.0 }
      ]
    };

    const fromModel = component.getRunnerForecastForDistance(profile, 20);
    const profileWithEarlierSplit = {
      ...profile,
      splits: [
        { id: 's-5k', distanceMiles: 3.1, elapsedMinutes: 18.0 },
        { id: 's-half', distanceMiles: 13.1, elapsedMinutes: 74.0 }
      ]
    };
    const adjustedForecast = component.getRunnerForecastForDistance(profileWithEarlierSplit, 20);

    expect(fromModel).not.toBeNull();
    expect(adjustedForecast).not.toBeNull();
    expect(adjustedForecast!.predictedDate.getTime()).toBeLessThan(fromModel!.predictedDate.getTime());
  });
});
