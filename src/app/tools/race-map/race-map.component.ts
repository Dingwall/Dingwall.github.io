import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-gpx';

type RacePoint = [number, number];

interface StationRecord {
  stop_id?: string;
  station_name?: string;
  station_descriptive_name?: string;
  stop_name?: string;
  location: {
    latitude: string;
    longitude: string;
  };
  red?: boolean;
  blue?: boolean;
  g?: boolean;
  brn?: boolean;
  p?: boolean;
  y?: boolean;
  pnk?: boolean;
  o?: boolean;
}

interface StationAccessPoint {
  routeMile: number;
  walkDistanceMiles: number;
  straightDistanceMiles: number;
  point: RacePoint;
}

interface StationProximitySummary {
  station: StationRecord;
  closestDistanceMiles: number;
  raceMiles: number[];
  nearestPoint: RacePoint;
  accessPoints: StationAccessPoint[];
}

@Component({
  selector: 'app-race-map',
  templateUrl: './race-map.component.html',
  styleUrls: ['./race-map.component.scss']
})
export class RaceMapComponent implements AfterViewInit {

  @ViewChild('mapContainer') mapContainer!: ElementRef;
  private map!: L.Map;
  private routePoints: RacePoint[] = [];
  private routeDistances: number[] = [];
  private readonly stationDistanceLimitMiles = 1;
  private userMarker: L.CircleMarker | null = null;
  private userAccuracyCircle: L.Circle | null = null;
  private userHeadingMarker: L.Marker | null = null;
  private userLocation: L.LatLng | null = null;
  public geolocationStatus: 'unknown' | 'ready' | 'denied' | 'timeout' | 'unsupported' = 'unknown';
  private hasRequestedLocation = false;
  private geolocationWatchId: number | null = null;

  ngAfterViewInit(): void {
    this.initMap();
  }

  private async initMap(): Promise<void> {
    this.map = L.map(this.mapContainer.nativeElement).setView([41.877, -87.62], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    try {
      const gpxResponse = await fetch('/assets/gpx/chicago2026.gpx');
      const gpxXml = await gpxResponse.text();
      this.routePoints = RaceMapComponent.parseGpxTrack(gpxXml);
      this.routeDistances = RaceMapComponent.calculateCumulativeRouteMiles(this.routePoints);

      const routeLine = L.polyline(
        this.routePoints.map(([lat, lng]) => [lat, lng] as [number, number]),
        {
          color: '#154c9d',
          weight: 5,
          opacity: 0.85
        }
      ).addTo(this.map);

      this.map.fitBounds(routeLine.getBounds(), { padding: [20, 20] });
      this.placeMileMarkers();
      this.addCourseClickHandler(routeLine);
      await this.loadStationsWithinOneMile();
      setTimeout(() => this.requestLocationAccess(), 250);
    } catch (error) {
      console.error('Unable to initialize the Chicago Marathon map.', error);
    }
  }

  public requestLocationAccess(): void {
    this.hasRequestedLocation = false;
    this.enableUserLocation();
  }

  private canUseGeolocation(): boolean {
    if (!('geolocation' in navigator)) {
      this.geolocationStatus = 'unsupported';
      console.warn('Geolocation is not supported on this browser.');
      return false;
    }

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      this.geolocationStatus = 'unsupported';
      console.warn('Geolocation requires a secure context (HTTPS). This site must be served over HTTPS on iPhone/Safari.');
      return false;
    }

    return true;
  }

  private enableUserLocation(): void {
    if (!this.canUseGeolocation()) {
      return;
    }

    if (this.hasRequestedLocation && this.userLocation) {
      return;
    }

    this.hasRequestedLocation = true;

    const geolocationOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000
    };

    const handleLocationError = (error: GeolocationPositionError, label: string): void => {
      this.userLocation = null;
      this.hasRequestedLocation = false;

      if (error.code === 1) {
        this.geolocationStatus = 'denied';
      } else if (error.code === 3) {
        this.geolocationStatus = 'timeout';
      } else {
        this.geolocationStatus = 'unknown';
      }

      console.warn(`User location ${label} failed (${error.code}): ${error.message}`);
    };

    const updateUserLocation = (latitude: number, longitude: number, accuracy: number, heading?: number): void => {
      const latLng = L.latLng(latitude, longitude);
      this.userLocation = latLng;
      this.geolocationStatus = 'ready';

      if (!this.userMarker) {
        this.userMarker = L.circleMarker(latLng, {
          radius: 8,
          color: '#2563eb',
          weight: 3,
          fillColor: '#60a5fa',
          fillOpacity: 0.9
        }).addTo(this.map);

        this.userAccuracyCircle = L.circle(latLng, {
          radius: accuracy,
          color: '#93c5fd',
          fillColor: '#93c5fd',
          fillOpacity: 0.2,
          weight: 1
        }).addTo(this.map);
      } else {
        this.userMarker.setLatLng(latLng);
        this.userAccuracyCircle?.setLatLng(latLng);
      }

      if (this.userAccuracyCircle) {
        this.userAccuracyCircle.setRadius(Math.max(accuracy, 25));
      }

      const headingDegrees = Number.isFinite(heading) ? heading! : undefined;
      if (headingDegrees !== undefined) {
        const headingPoint = this.getHeadingPoint(latLng, headingDegrees);
        if (!this.userHeadingMarker) {
          this.userHeadingMarker = L.marker(headingPoint, {
            icon: L.divIcon({
              className: 'user-heading-marker',
              html: '<div style="width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 18px solid #0f172a; transform: rotate(0deg);"></div>',
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            })
          }).addTo(this.map);
        } else {
          this.userHeadingMarker.setLatLng(headingPoint);
          const icon = this.userHeadingMarker.getIcon() as L.DivIcon;
          const arrow = icon?.options?.html as string | undefined;
          if (arrow) {
            const rotation = `rotate(${headingDegrees}deg)`;
            const updatedHtml = arrow.replace('transform: rotate(0deg)', `transform: ${rotation}`);
            this.userHeadingMarker.setIcon(L.divIcon({
              className: 'user-heading-marker',
              html: updatedHtml,
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            }));
          }
        }
      } else if (this.userHeadingMarker) {
        this.map.removeLayer(this.userHeadingMarker);
        this.userHeadingMarker = null;
      }
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateUserLocation(
          position.coords.latitude,
          position.coords.longitude,
          position.coords.accuracy || 25,
          position.coords.heading ?? undefined
        );
        this.map.setView([position.coords.latitude, position.coords.longitude], 13);
      },
      (error) => {
        handleLocationError(error, 'lookup');
      },
      geolocationOptions
    );

    if (this.geolocationWatchId !== null) {
      navigator.geolocation.clearWatch(this.geolocationWatchId);
    }

    this.geolocationWatchId = navigator.geolocation.watchPosition(
      (position) => {
        updateUserLocation(
          position.coords.latitude,
          position.coords.longitude,
          position.coords.accuracy || 25,
          position.coords.heading ?? undefined
        );
      },
      (error) => {
        handleLocationError(error, 'watch');
      },
      geolocationOptions
    );
  }

  private getDistanceFromUserText(targetPoint: RacePoint): string {
    if (!this.userLocation) {
      if (this.geolocationStatus === 'denied') {
        return 'Location denied';
      }

      if (this.geolocationStatus === 'unsupported') {
        return 'Location unavailable on this device';
      }

      return 'Location unavailable';
    }

    const userLatLng = L.latLng(this.userLocation.lat, this.userLocation.lng);
    const targetLatLng = L.latLng(targetPoint[0], targetPoint[1]);
    const distanceMiles = userLatLng.distanceTo(targetLatLng) / 1609.344;
    return `${distanceMiles.toFixed(2)} mi`;
  }

  private getMapActionButtons(targetPoint: RacePoint, label: string): string {
    const lat = targetPoint[0];
    const lng = targetPoint[1];
    const appleUrl = `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=w`;
    const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;

    return `
      <div style="margin-top: 10px; display:flex; flex-wrap:wrap; gap:6px;">
        <a href="${appleUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block; background:#0f172a; color:white; padding:6px 10px; border-radius:999px; text-decoration:none; font-size:0.75rem; font-weight:700;">Apple Maps</a>
        <a href="${googleUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block; background:#2563eb; color:white; padding:6px 10px; border-radius:999px; text-decoration:none; font-size:0.75rem; font-weight:700;">Google Maps</a>
      </div>
    `;
  }

  private getCoursePopupContent(point: RacePoint, routeMile: number): string {
    const distanceText = this.getDistanceFromUserText(point);

    return `
      <div style="min-width: 220px; font-family: Arial, sans-serif;">
        <div><strong>Course point</strong></div>
        <div style="margin-top: 6px;"><strong>Race mile:</strong> ${routeMile.toFixed(1)} mi</div>
        <div style="margin-top: 4px;"><strong>Distance from you:</strong> ${distanceText}</div>
        ${this.getMapActionButtons(point, 'Course point')}
      </div>
    `;
  }

  private openCoursePopupForPoint(point: RacePoint, routeMile: number): void {
    const popup = L.popup()
      .setLatLng(point)
      .setContent(this.getCoursePopupContent(point, routeMile));

    this.map.openPopup(popup);
  }

  private addCourseClickHandler(routeLine: L.Polyline): void {
    routeLine.on('click', (event: L.LeafletMouseEvent) => {
      const clickedPoint: RacePoint = [event.latlng.lat, event.latlng.lng];
      const nearest = this.getNearestCoursePoint(clickedPoint);

      if (!nearest) {
        return;
      }

      this.openCoursePopupForPoint(nearest.point, nearest.routeMile);
    });
  }

  private getNearestCoursePoint(clickedPoint: RacePoint): { point: RacePoint; routeMile: number } | null {
    let nearest: { point: RacePoint; routeMile: number; distanceMiles: number } | null = null;

    for (let index = 0; index < this.routePoints.length - 1; index += 1) {
      const start = this.routePoints[index];
      const end = this.routePoints[index + 1];
      const projection = RaceMapComponent.projectPointToSegment(clickedPoint, start, end);
      const routeMile = (this.routeDistances[index] ?? 0) + projection.distanceAlongSegmentMiles;

      if (!nearest || projection.distanceMiles < nearest.distanceMiles) {
        nearest = {
          point: projection.projectedPoint,
          routeMile,
          distanceMiles: projection.distanceMiles
        };
      }
    }

    if (!nearest || nearest.distanceMiles > 0.05) {
      return null;
    }

    return {
      point: nearest.point,
      routeMile: nearest.routeMile
    };
  }

  private placeMileMarkers(): void {
    const maxMileage = this.routeDistances[this.routeDistances.length - 1] ?? 26.2;
    const lastMile = Math.ceil(maxMileage);

    for (let mile = 1; mile <= lastMile; mile += 1) {
      const point = RaceMapComponent.getPointAtDistanceMiles(mile, this.routePoints, this.routeDistances);
      if (!point) {
        continue;
      }

      const marker = L.marker(point, {
        icon: L.divIcon({
          className: 'mile-marker',
          html: `<span>${mile}</span>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      });

      marker.on('click', () => {
        const nearest = this.getNearestCoursePoint(point);
        if (!nearest) {
          return;
        }

        this.openCoursePopupForPoint(nearest.point, nearest.routeMile);
      });

      marker.addTo(this.map);
    }
  }

  private async loadStationsWithinOneMile(): Promise<void> {
    try {
      const response = await fetch('/assets/gpx/LStations.json');
      const stations: StationRecord[] = await response.json();

      const results = stations
        .map((station) => RaceMapComponent.getStationCourseProximity(station, this.routePoints, this.routeDistances))
        .filter((station) => station.closestDistanceMiles <= this.stationDistanceLimitMiles)
        .sort((a, b) => a.closestDistanceMiles - b.closestDistanceMiles);

      results.forEach(({ station, closestDistanceMiles, raceMiles, accessPoints }) => {
        const lineColor = RaceMapComponent.getStationColor(station);
        const lineName = RaceMapComponent.getStationLineName(station);
        const location: RacePoint = [Number(station.location.latitude), Number(station.location.longitude)];

        const stationMarker = L.circleMarker(location, {
          radius: 7,
          color: lineColor,
          weight: 2,
          fillColor: lineColor,
          fillOpacity: 0.9
        });

        const accessPointHtml = accessPoints.length > 0
          ? accessPoints
              .map((entry) => `<li><strong>${entry.routeMile.toFixed(1)} mi</strong> — ${entry.walkDistanceMiles.toFixed(2)} mi</li>`)
              .join('')
          : `<li><strong>${raceMiles[0]?.toFixed(1) ?? '0.0'} mi</strong> — ${closestDistanceMiles.toFixed(2)} mi</li>`;

        const getStationPopupHtml = (): string => {
          const currentUserDistanceText = this.getDistanceFromUserText(location);
          const currentMapButtons = this.getMapActionButtons(location, `${station.station_name || station.stop_name || 'L Station'} (${lineName})`);

          return `
            <div style="min-width: 240px; font-family: Arial, sans-serif;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
                <strong style="font-size: 1.1rem;">${station.station_name || station.stop_name || 'L Station'}</strong>
                <span style="display:inline-block; background:${lineColor}; color:white; border-radius: 999px; padding: 2px 8px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.04em;">${lineName}</span>
              </div>
              <div>
                <div><strong>Distance from you:</strong> ${currentUserDistanceText}</div>
                <div><strong>Distance to course locations:</strong></div>
                <ul style="margin: 8px 0 0 18px; padding: 0;">
                  ${accessPointHtml}
                </ul>
                ${currentMapButtons}
              </div>
            </div>
          `;
        };

        stationMarker.bindPopup(getStationPopupHtml());
        stationMarker.on('click', () => {
          stationMarker.bindPopup(getStationPopupHtml()).openPopup();
        });

        stationMarker.addTo(this.map);
      });
    } catch (error) {
      console.error('Unable to load nearby L stations.', error);
    }
  }

  static parseGpxTrack(gpxXml: string): RacePoint[] {
    const parser = new DOMParser();
    const xml = parser.parseFromString(gpxXml, 'application/xml');
    const trackPoints = Array.from(xml.querySelectorAll('trkpt'));

    return trackPoints
      .map((trackPoint) => {
        const lat = Number(trackPoint.getAttribute('lat'));
        const lng = Number(trackPoint.getAttribute('lon'));

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return null;
        }

        return [lat, lng] as RacePoint;
      })
      .filter((point): point is RacePoint => point !== null);
  }

  static calculateCumulativeRouteMiles(routePoints: RacePoint[]): number[] {
    if (routePoints.length === 0) {
      return [];
    }

    const distances = [0];

    for (let index = 1; index < routePoints.length; index += 1) {
      const previousPoint = routePoints[index - 1];
      const currentPoint = routePoints[index];
      distances[index] = distances[index - 1] + RaceMapComponent.haversineMiles(previousPoint, currentPoint);
    }

    return distances;
  }

  static getPointAtDistanceMiles(targetMiles: number, routePoints: RacePoint[], routeDistances: number[]): RacePoint | null {
    if (!routePoints.length || targetMiles < 0) {
      return null;
    }

    for (let index = 0; index < routePoints.length - 1; index += 1) {
      const start = routePoints[index];
      const end = routePoints[index + 1];
      const startDistance = routeDistances[index];
      const endDistance = routeDistances[index + 1];

      if (targetMiles >= startDistance && targetMiles <= endDistance) {
        const segmentLength = endDistance - startDistance || 1;
        const ratio = (targetMiles - startDistance) / segmentLength;
        return [
          start[0] + (end[0] - start[0]) * ratio,
          start[1] + (end[1] - start[1]) * ratio
        ] as RacePoint;
      }
    }

    return null;
  }

  static getStationCourseProximity(
    station: StationRecord,
    routePoints: RacePoint[],
    routeDistances: number[] = RaceMapComponent.calculateCumulativeRouteMiles(routePoints)
  ): StationProximitySummary {
    const stationPoint: RacePoint = [
      Number(station.location.latitude),
      Number(station.location.longitude)
    ];

    let closestDistanceMiles = Number.POSITIVE_INFINITY;
    let nearestPoint: RacePoint = routePoints[0] ?? stationPoint;
    const accessPoints: StationAccessPoint[] = [];

    for (let index = 0; index < routePoints.length - 1; index += 1) {
      const start = routePoints[index];
      const end = routePoints[index + 1];
      const startDistance = routeDistances[index] ?? 0;
      const endDistance = routeDistances[index + 1] ?? startDistance;

      const projection = RaceMapComponent.projectPointToSegment(stationPoint, start, end);
      const routeDistance = startDistance + projection.distanceAlongSegmentMiles;
      const walkDistance = RaceMapComponent.estimateWalkDistanceMiles(stationPoint, projection.projectedPoint);

      if (walkDistance <= closestDistanceMiles) {
        closestDistanceMiles = walkDistance;
        nearestPoint = projection.projectedPoint;
      }

      if (walkDistance <= 1.0) {
        accessPoints.push({
          routeMile: routeDistance,
          walkDistanceMiles: walkDistance,
          straightDistanceMiles: projection.distanceMiles,
          point: projection.projectedPoint
        });
      }
    }

    const deduped = RaceMapComponent.deduplicateAccessPoints(accessPoints);
    const raceMiles = deduped.map((entry) => entry.routeMile).sort((a, b) => a - b);

    return {
      station,
      closestDistanceMiles: deduped.length > 0 ? deduped[0].walkDistanceMiles : closestDistanceMiles,
      raceMiles: raceMiles.length > 0 ? raceMiles : [RaceMapComponent.getNearestRaceMile(stationPoint, routePoints, routeDistances)],
      nearestPoint: deduped.length > 0 ? deduped[0].point : nearestPoint,
      accessPoints: deduped.length > 0 ? deduped : [{
        routeMile: RaceMapComponent.getNearestRaceMile(stationPoint, routePoints, routeDistances),
        walkDistanceMiles: closestDistanceMiles,
        straightDistanceMiles: closestDistanceMiles,
        point: nearestPoint
      }]
    };
  }

  static deduplicateAccessPoints(accessPoints: StationAccessPoint[]): StationAccessPoint[] {
    if (accessPoints.length === 0) {
      return [];
    }

    const sorted = [...accessPoints].sort((a, b) => a.walkDistanceMiles - b.walkDistanceMiles || a.routeMile - b.routeMile);
    const selected: StationAccessPoint[] = [];

    sorted.forEach((candidate) => {
      const latest = selected[selected.length - 1];
      if (!latest) {
        selected.push(candidate);
        return;
      }

      const routeGap = Math.abs(candidate.routeMile - latest.routeMile);
      const sameCluster = routeGap < 0.3;
      if (!sameCluster) {
        selected.push(candidate);
        return;
      }

      if (candidate.walkDistanceMiles < latest.walkDistanceMiles) {
        selected[selected.length - 1] = candidate;
      }
    });

    return selected.slice(0, 2);
  }

  private getHeadingPoint(latLng: L.LatLng, headingDegrees: number): L.LatLng {
    const distanceMeters = 30;
    const radians = RaceMapComponent.toRadians(headingDegrees);
    const earthCircumferenceMeters = 6371000;
    const metersPerDegreeLat = earthCircumferenceMeters / 360;
    const deltaLat = (distanceMeters * Math.cos(radians)) / metersPerDegreeLat;
    const deltaLng = (distanceMeters * Math.sin(radians)) / (metersPerDegreeLat * Math.cos(RaceMapComponent.toRadians(latLng.lat)));

    return L.latLng(latLng.lat + (deltaLat * 180 / Math.PI), latLng.lng + (deltaLng * 180 / Math.PI));
  }

  static estimateWalkDistanceMiles(pointA: RacePoint, pointB: RacePoint): number {
    const latDiff = Math.abs(pointB[0] - pointA[0]);
    const lngDiff = Math.abs(pointB[1] - pointA[1]);
    const averageLat = (pointA[0] + pointB[0]) / 2;
    const latMiles = latDiff * 69;
    const lonMiles = lngDiff * 54.6 * Math.cos(RaceMapComponent.toRadians(averageLat));
    return latMiles + lonMiles;
  }

  static projectPointToSegment(point: RacePoint, start: RacePoint, end: RacePoint): {
    projectedPoint: RacePoint;
    distanceMiles: number;
    distanceAlongSegmentMiles: number;
  } {
    const dx = end[1] - start[1];
    const dy = end[0] - start[0];
    const px = point[1] - start[1];
    const py = point[0] - start[0];
    const segmentLengthSquared = dx * dx + dy * dy;

    if (segmentLengthSquared === 0) {
      const pointDistance = RaceMapComponent.haversineMiles(point, start);
      return {
        projectedPoint: start,
        distanceMiles: pointDistance,
        distanceAlongSegmentMiles: 0
      };
    }

    const projectionRatio = Math.max(0, Math.min(1, ((px * dx) + (py * dy)) / segmentLengthSquared));
    const projectedPoint: RacePoint = [
      start[0] + (end[0] - start[0]) * projectionRatio,
      start[1] + (end[1] - start[1]) * projectionRatio
    ];

    const distanceMiles = RaceMapComponent.haversineMiles(point, projectedPoint);
    const distanceAlongSegmentMiles = projectionRatio * RaceMapComponent.haversineMiles(start, end);

    return {
      projectedPoint,
      distanceMiles,
      distanceAlongSegmentMiles
    };
  }

  static getNearestRaceMile(stationPoint: RacePoint, routePoints: RacePoint[], routeDistances: number[]): number {
    let nearestRaceMile = 0;
    let nearestDistanceMiles = Number.POSITIVE_INFINITY;

    for (let index = 0; index < routePoints.length - 1; index += 1) {
      const start = routePoints[index];
      const end = routePoints[index + 1];
      const projection = RaceMapComponent.projectPointToSegment(stationPoint, start, end);

      if (projection.distanceMiles < nearestDistanceMiles) {
        nearestDistanceMiles = projection.distanceMiles;
        nearestRaceMile = (routeDistances[index] ?? 0) + projection.distanceAlongSegmentMiles;
      }
    }

    return nearestRaceMile;
  }

  static haversineMiles(pointA: RacePoint, pointB: RacePoint): number {
    const earthRadiusMiles = 3958.8;
    const latOne = RaceMapComponent.toRadians(pointA[0]);
    const latTwo = RaceMapComponent.toRadians(pointB[0]);
    const deltaLat = RaceMapComponent.toRadians(pointB[0] - pointA[0]);
    const deltaLng = RaceMapComponent.toRadians(pointB[1] - pointA[1]);

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(latOne) * Math.cos(latTwo) *
      Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

    return 2 * earthRadiusMiles * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  static toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  static getStationLineName(station: StationRecord): string {
    const lineName = Object.entries({
      red: station.red,
      blue: station.blue,
      g: station.g,
      brn: station.brn,
      p: station.p,
      y: station.y,
      pnk: station.pnk,
      o: station.o
    }).find(([, enabled]) => Boolean(enabled))?.[0];

    const lineLabels: Record<string, string> = {
      red: 'Red Line',
      blue: 'Blue Line',
      g: 'Green Line',
      brn: 'Brown Line',
      p: 'Purple Line',
      y: 'Yellow Line',
      pnk: 'Pink Line',
      o: 'Orange Line'
    };

    return lineLabels[lineName ?? 'red'];
  }

  static getStationColor(station: StationRecord): string {
    const lineName = Object.entries({
      red: station.red,
      blue: station.blue,
      g: station.g,
      brn: station.brn,
      p: station.p,
      y: station.y,
      pnk: station.pnk,
      o: station.o
    }).find(([, enabled]) => Boolean(enabled))?.[0];

    const colors: Record<string, string> = {
      red: '#d62828',
      blue: '#1d4ed8',
      g: '#2e7d32',
      brn: '#8d6e63',
      p: '#8e24aa',
      y: '#f9a825',
      pnk: '#ec4899',
      o: '#f97316'
    };

    return colors[lineName ?? 'red'];
  }
}
