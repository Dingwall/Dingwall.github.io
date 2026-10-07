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

interface StationLineInfo {
  code: string;
  label: string;
  color: string;
}

interface StationProximitySummary {
  station: StationRecord;
  closestDistanceMiles: number;
  raceMiles: number[];
  nearestPoint: RacePoint;
  accessPoints: StationAccessPoint[];
}

interface RunnerSplit {
  id: string;
  distanceMiles: number;
  elapsedMinutes: number;
}

interface RunnerProfile {
  id: string;
  name: string;
  startTime: string;
  paceMinutesPerMile?: number | null;
  totalMinutes?: number | null;
  splits?: RunnerSplit[];
}

interface RunnerForecast {
  runner: RunnerProfile;
  predictedDate: Date;
  windowStart: Date;
  windowEnd: Date;
  toleranceMinutes: number;
}

@Component({
  selector: 'app-race-map',
  templateUrl: './race-map.component.html',
  styleUrls: ['./race-map.component.scss']
})
export class RaceMapComponent implements AfterViewInit {

  @ViewChild('mapContainer') mapContainer!: ElementRef;
  private readonly defaultTopNavHeight = 56;
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
  private deviceHeadingDegrees: number | null = null;
  private deviceOrientationListenerAttached = false;
  private static readonly RUNNER_STORAGE_KEY = 'race-map-runner-profiles';
  private static readonly MAX_RUNNERS = 5;

  public runnerProfiles: RunnerProfile[] = [];
  public runnerModalOpen = false;
  public runnerForm: RunnerProfile = this.createEmptyRunnerForm();
  public runnerFormExpanded = false;
  public runnerTotalInput = '';
  public runnerPaceInput = '';
  public runnerSplitDraft = {
    distanceMiles: null as number | null,
    elapsedMinutes: null as number | null,
    elapsedInput: ''
  };
  public editingRunnerId: string | null = null;
  public runnerFormError = '';

  ngAfterViewInit(): void {
    this.syncMapViewport();
    this.initMap();
    this.loadRunnerProfiles();
    window.addEventListener('resize', () => this.syncMapViewport());
  }

  private syncMapViewport(): void {
    if (!this.mapContainer?.nativeElement) {
      return;
    }

    const nav = document.querySelector('.navbar') as HTMLElement | null;
    const navHeight = nav ? nav.getBoundingClientRect().height : this.defaultTopNavHeight;
    const heightPx = Math.max(window.innerHeight - navHeight, 320);

    this.mapContainer.nativeElement.style.height = `${heightPx}px`;
    this.mapContainer.nativeElement.style.maxHeight = `${heightPx}px`;

    if (this.map) {
      this.map.invalidateSize();
    }
  }

  private setBodyScrollLock(locked: boolean): void {
    if (typeof document === 'undefined') {
      return;
    }

    document.body.style.overflow = locked ? 'hidden' : '';
    document.documentElement.style.overflow = locked ? 'hidden' : '';
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

  public focusOnUserLocation(): void {
    if (this.userLocation) {
      this.map.setView(this.userLocation, 13);
      return;
    }

    this.requestLocationAccess();
  }

  public toggleRunnerModal(): void {
    this.runnerModalOpen = !this.runnerModalOpen;
    this.setBodyScrollLock(this.runnerModalOpen);
    if (!this.runnerModalOpen) {
      this.cancelRunnerEdit();
    }
  }

  public openRunnerModal(): void {
    this.runnerModalOpen = true;
    this.setBodyScrollLock(true);
  }

  public closeRunnerModal(): void {
    this.runnerModalOpen = false;
    this.setBodyScrollLock(false);
    this.cancelRunnerEdit();
  }

  public createEmptyRunnerForm(): RunnerProfile {
    return {
      id: '',
      name: '',
      startTime: '',
      paceMinutesPerMile: null,
      totalMinutes: null,
      splits: []
    };
  }

  private loadRunnerProfiles(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const rawProfiles = localStorage.getItem(RaceMapComponent.RUNNER_STORAGE_KEY);
      this.runnerProfiles = rawProfiles ? JSON.parse(rawProfiles) : [];
    } catch (error) {
      this.runnerProfiles = [];
    }
  }

  private persistRunnerProfiles(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(RaceMapComponent.RUNNER_STORAGE_KEY, JSON.stringify(this.runnerProfiles));
  }

  public canSaveRunnerForm(): boolean {
    return this.isRunnerProfileValid(this.runnerForm);
  }

  public saveRunnerProfile(): void {
    this.runnerFormError = '';

    if (!this.canSaveRunnerForm()) {
      this.runnerFormError = 'Please complete the runner name, start time, and either pace or total time.';
      return;
    }

    if (this.runnerProfiles.length >= RaceMapComponent.MAX_RUNNERS && !this.editingRunnerId) {
      this.runnerFormError = `You can save up to ${RaceMapComponent.MAX_RUNNERS} runners.`;
      return;
    }

    this.syncRunnerFormDerivedValues();

    const normalized = {
      ...this.runnerForm,
      name: this.runnerForm.name.trim(),
      startTime: this.runnerForm.startTime,
      paceMinutesPerMile: this.runnerForm.paceMinutesPerMile !== null && this.runnerForm.paceMinutesPerMile !== undefined
        ? Number(this.runnerForm.paceMinutesPerMile)
        : null,
      totalMinutes: this.runnerForm.totalMinutes !== null && this.runnerForm.totalMinutes !== undefined
        ? Number(this.runnerForm.totalMinutes)
        : null,
      splits: (this.runnerForm.splits ?? []).map((split) => ({
        ...split,
        distanceMiles: Number(split.distanceMiles),
        elapsedMinutes: Number(split.elapsedMinutes)
      })).sort((a, b) => a.distanceMiles - b.distanceMiles)
    };

    if (this.editingRunnerId) {
      this.runnerProfiles = this.runnerProfiles.map((runner) => runner.id === this.editingRunnerId ? { ...normalized, id: this.editingRunnerId } : runner);
    } else {
      this.runnerProfiles = [
        ...this.runnerProfiles,
        { ...normalized, id: `runner-${Date.now()}` }
      ];
    }

    this.persistRunnerProfiles();
    this.cancelRunnerEdit();
  }

  public editRunner(runner: RunnerProfile): void {
    this.editingRunnerId = runner.id;
    this.runnerForm = {
      ...runner,
      name: runner.name || '',
      startTime: runner.startTime || '',
      paceMinutesPerMile: runner.paceMinutesPerMile ?? null,
      totalMinutes: runner.totalMinutes ?? null,
      splits: Array.isArray(runner.splits) ? [...runner.splits].sort((a, b) => a.distanceMiles - b.distanceMiles) : []
    };
    this.runnerFormExpanded = true;
    this.runnerPaceInput = this.formatPaceMinutesPerMile(this.runnerForm.paceMinutesPerMile);
    this.runnerTotalInput = this.runnerForm.totalMinutes === null ? '' : this.formatDurationMinutes(this.runnerForm.totalMinutes);
    this.runnerFormError = '';
    this.runnerSplitDraft = { distanceMiles: null, elapsedMinutes: null, elapsedInput: '' };
  }

  public deleteRunner(runnerId: string): void {
    const target = this.runnerProfiles.find((runner) => runner.id === runnerId);
    const runnerName = target?.name?.trim() || 'this runner';

    const confirmed = typeof window !== 'undefined'
      ? window.confirm(`Are you sure you want to delete ${runnerName}?`)
      : true;

    if (!confirmed) {
      return;
    }

    this.runnerProfiles = this.runnerProfiles.filter((runner) => runner.id !== runnerId);
    if (this.editingRunnerId === runnerId) {
      this.cancelRunnerEdit();
    }
    this.persistRunnerProfiles();
  }

  public cancelRunnerEdit(): void {
    this.editingRunnerId = null;
    this.runnerForm = this.createEmptyRunnerForm();
    this.runnerFormExpanded = false;
    this.runnerTotalInput = '';
    this.runnerPaceInput = '';
    this.runnerSplitDraft = { distanceMiles: null, elapsedMinutes: null, elapsedInput: '' };
    this.runnerFormError = '';
  }

  public openRunnerForm(): void {
    this.runnerFormExpanded = true;
    this.runnerFormError = '';
    if (!this.editingRunnerId) {
      this.runnerForm = this.createEmptyRunnerForm();
      this.runnerTotalInput = '';
      this.runnerPaceInput = '';
    }
  }

  public computePaceFromTotalMinutes(totalMinutes: number | null | undefined): number | null {
    if (totalMinutes === null || totalMinutes === undefined || !Number.isFinite(totalMinutes) || totalMinutes <= 0) {
      return null;
    }

    return totalMinutes / 26.2;
  }

  public computeTotalMinutesFromPace(paceMinutesPerMile: number | null | undefined): number | null {
    if (paceMinutesPerMile === null || paceMinutesPerMile === undefined || !Number.isFinite(paceMinutesPerMile) || paceMinutesPerMile <= 0) {
      return null;
    }

    return paceMinutesPerMile * 26.2;
  }

  public formatPaceMinutesPerMile(paceMinutesPerMile: number | null | undefined): string {
    if (paceMinutesPerMile === null || paceMinutesPerMile === undefined || !Number.isFinite(paceMinutesPerMile) || paceMinutesPerMile <= 0) {
      return '';
    }

    const totalSeconds = Math.round(paceMinutesPerMile * 60);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  public formatDurationMinutes(totalMinutes: number | null | undefined): string {
    if (totalMinutes === null || totalMinutes === undefined || !Number.isFinite(totalMinutes)) {
      return '';
    }

    const totalSeconds = Math.max(0, Math.round(totalMinutes * 60));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  public parseDurationInput(input: string | number | null | undefined): number | null {
    if (input === null || input === undefined || input === '') {
      return null;
    }

    const normalized = String(input).trim();
    if (!normalized) {
      return null;
    }

    if (/^\d+$/.test(normalized)) {
      const seconds = Number(normalized);
      return Number.isFinite(seconds) && seconds >= 0 ? seconds / 60 : null;
    }

    const parts = normalized.split(':').map((part) => part.trim());
    if (parts.length === 2 && parts.every((part) => /^\d+$/.test(part))) {
      const minutes = Number(parts[0]);
      const seconds = Number(parts[1]);
      if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || seconds >= 60) {
        return null;
      }
      return minutes + (seconds / 60);
    }

    if (parts.length === 3 && parts.every((part) => /^\d+$/.test(part))) {
      const hours = Number(parts[0]);
      const minutes = Number(parts[1]);
      const seconds = Number(parts[2]);
      if (!Number.isFinite(hours) || !Number.isFinite(minutes) || !Number.isFinite(seconds) || minutes >= 60 || seconds >= 60) {
        return null;
      }
      return (hours * 60) + minutes + (seconds / 60);
    }

    return null;
  }

  public parsePaceInput(input: string | number | null | undefined): number | null {
    if (input === null || input === undefined || input === '') {
      return null;
    }

    const normalized = String(input).trim();
    if (!normalized) {
      return null;
    }

    const parts = normalized.split(':').map((part) => part.trim());
    if (parts.length === 2 && parts.every((part) => /^\d+$/.test(part))) {
      const minutes = Number(parts[0]);
      const seconds = Number(parts[1]);
      if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || seconds >= 60) {
        return null;
      }
      return minutes + (seconds / 60);
    }

    if (/^\d+(?:\.\d+)?$/.test(normalized)) {
      const minutes = Number(normalized);
      return Number.isFinite(minutes) && minutes > 0 ? minutes : null;
    }

    return null;
  }

  public syncRunnerFormDerivedValues(): void {
    const hasPace = this.runnerForm.paceMinutesPerMile !== null && this.runnerForm.paceMinutesPerMile !== undefined && Number.isFinite(this.runnerForm.paceMinutesPerMile);
    const hasTotal = this.runnerForm.totalMinutes !== null && this.runnerForm.totalMinutes !== undefined && Number.isFinite(this.runnerForm.totalMinutes);

    if (hasPace && !hasTotal) {
      this.runnerForm.totalMinutes = this.computeTotalMinutesFromPace(this.runnerForm.paceMinutesPerMile) ?? null;
      this.runnerTotalInput = this.runnerForm.totalMinutes === null ? '' : this.formatDurationMinutes(this.runnerForm.totalMinutes);
    }

    if (hasTotal && !hasPace) {
      this.runnerForm.paceMinutesPerMile = this.computePaceFromTotalMinutes(this.runnerForm.totalMinutes) ?? null;
      this.runnerPaceInput = this.runnerForm.paceMinutesPerMile === null ? '' : this.formatPaceMinutesPerMile(this.runnerForm.paceMinutesPerMile);
    }

    if (!hasTotal && !hasPace) {
      this.runnerTotalInput = '';
      this.runnerPaceInput = '';
    }
  }

  public onRunnerStartTimeChange(value: string): void {
    this.runnerForm.startTime = value && /^\d{2}:\d{2}$/.test(value) ? value : '';
  }

  public onRunnerPaceInputChange(value: string): void {
    this.runnerPaceInput = value;
    const parsed = this.parsePaceInput(value);
    this.runnerForm.paceMinutesPerMile = parsed;

    if (parsed !== null) {
      this.runnerForm.totalMinutes = this.computeTotalMinutesFromPace(parsed) ?? null;
      this.runnerTotalInput = this.runnerForm.totalMinutes === null ? '' : this.formatDurationMinutes(this.runnerForm.totalMinutes);
      return;
    }

    this.runnerForm.totalMinutes = null;
    this.runnerTotalInput = '';
  }

  public onRunnerTotalInputChange(value: string): void {
    this.runnerTotalInput = value;
    const parsed = this.parseDurationInput(value);
    this.runnerForm.totalMinutes = parsed;

    if (parsed !== null) {
      this.runnerForm.paceMinutesPerMile = this.computePaceFromTotalMinutes(parsed) ?? null;
      this.runnerPaceInput = this.runnerForm.paceMinutesPerMile === null ? '' : this.formatPaceMinutesPerMile(this.runnerForm.paceMinutesPerMile);
      return;
    }

    this.runnerForm.paceMinutesPerMile = null;
    this.runnerPaceInput = '';
  }

  public addRunnerSplitDraft(): void {
    if (this.runnerSplitDraft.distanceMiles === null || this.runnerSplitDraft.elapsedMinutes === null) {
      this.runnerFormError = 'Please enter both a split distance and split time.';
      return;
    }

    const distanceMiles = Number(this.runnerSplitDraft.distanceMiles);
    const elapsedMinutes = Number(this.runnerSplitDraft.elapsedMinutes);

    if (!Number.isFinite(distanceMiles) || distanceMiles <= 0 || !Number.isFinite(elapsedMinutes) || elapsedMinutes <= 0) {
      this.runnerFormError = 'Use a valid split distance and elapsed time.';
      return;
    }

    const nextSplit: RunnerSplit = {
      id: `split-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      distanceMiles,
      elapsedMinutes
    };

    const existingSplits = this.runnerForm.splits ?? [];
    this.runnerForm = {
      ...this.runnerForm,
      splits: [...existingSplits, nextSplit].sort((a, b) => a.distanceMiles - b.distanceMiles)
    };
    this.runnerSplitDraft = { distanceMiles: null, elapsedMinutes: null, elapsedInput: '' };
    this.runnerFormError = '';
  }

  public removeRunnerSplit(splitId: string): void {
    this.runnerForm = {
      ...this.runnerForm,
      splits: (this.runnerForm.splits ?? []).filter((split) => split.id !== splitId)
    };
  }

  private isRunnerProfileValid(profile: RunnerProfile): boolean {
    if (!profile.name || !profile.name.trim()) {
      return false;
    }

    if (!profile.startTime || !/^\d{2}:\d{2}$/.test(profile.startTime)) {
      return false;
    }

    const paceValid = typeof profile.paceMinutesPerMile === 'number' && Number.isFinite(profile.paceMinutesPerMile) && profile.paceMinutesPerMile > 0;
    const totalValid = typeof profile.totalMinutes === 'number' && Number.isFinite(profile.totalMinutes) && profile.totalMinutes > 0;

    return paceValid || totalValid;
  }

  private getRunnerDurationMinutes(profile: RunnerProfile): number | null {
    if (typeof profile.paceMinutesPerMile === 'number' && Number.isFinite(profile.paceMinutesPerMile) && profile.paceMinutesPerMile > 0) {
      return profile.paceMinutesPerMile * 26.2;
    }

    if (typeof profile.totalMinutes === 'number' && Number.isFinite(profile.totalMinutes) && profile.totalMinutes > 0) {
      return profile.totalMinutes;
    }

    return null;
  }

  private getRunnerGoalMinutes(profile: RunnerProfile): number | null {
    return this.getRunnerDurationMinutes(profile);
  }

  private getSmoothStepFactor(distanceMiles: number): number {
    if (distanceMiles <= 18) {
      return 0;
    }

    const clamped = Math.min(1, Math.max(0, (distanceMiles - 18) / 8.2));
    return (3 * clamped * clamped) - (2 * clamped * clamped * clamped);
  }

  private getCourseElapsedMinutesForGoal(goalMinutes: number, routeMile: number): number {
    const courseLength = 26.2188;
    const clampedMile = Math.min(courseLength, Math.max(0, routeMile));
    const sampleCount = 1000;
    const stepMiles = courseLength / sampleCount;
    let rawElapsedMinutes = 0;
    let rawElapsedAtTarget = 0;

    for (let step = 0; step <= sampleCount; step += 1) {
      const distance = Math.min(courseLength, step * stepMiles);
      const slowdownFactor = 1 + (0.04 * Math.exp(-distance / 2.5)) + (0.07 * this.getSmoothStepFactor(distance));
      rawElapsedMinutes += slowdownFactor * (stepMiles / 26.2188);

      if (distance <= clampedMile) {
        rawElapsedAtTarget += slowdownFactor * (stepMiles / 26.2188);
      }
    }

    const totalRawTime = rawElapsedMinutes * goalMinutes;
    return rawElapsedAtTarget * goalMinutes * (1 / Math.max(rawElapsedMinutes, 0.0001));
  }

  private getRunnerSplitAdjustment(profile: RunnerProfile, goalMinutes: number, routeMile: number): number {
    const splits = (profile.splits ?? []).filter((split) => split.distanceMiles > 0).sort((a, b) => a.distanceMiles - b.distanceMiles);
    if (!splits.length) {
      return 0;
    }

    const relevantSplits = splits.filter((split) => split.distanceMiles <= routeMile);
    if (!relevantSplits.length) {
      return 0;
    }

    let totalWeight = 0;
    let weightedAdjustment = 0;

    relevantSplits.forEach((split, index) => {
      const expectedMinutes = this.getCourseElapsedMinutesForGoal(goalMinutes, split.distanceMiles);
      const deltaMinutes = split.elapsedMinutes - expectedMinutes;
      const weight = 1 + (index * 0.5) + (split.distanceMiles / 26.2188);
      weightedAdjustment += deltaMinutes * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? weightedAdjustment / totalWeight : 0;
  }

  private parseRunnerStartTime(startTime: string): Date | null {
    if (!startTime || !/^\d{2}:\d{2}$/.test(startTime)) {
      return null;
    }

    const [hours, minutes] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  private calculateRunnerWindowFraction(routeMile: number): number {
    return 0.025 + (0.025 * (Math.min(26.2188, Math.max(0, routeMile)) / 26.2188));
  }

  public getRunnerForecastsForDistance(routeMile: number): RunnerForecast[] {
    return this.runnerProfiles
      .map((profile) => this.getRunnerForecastForDistance(profile, routeMile))
      .filter((forecast): forecast is RunnerForecast => forecast !== null)
      .sort((a, b) => a.predictedDate.getTime() - b.predictedDate.getTime());
  }

  public getRunnerForecastForDistance(profile: RunnerProfile, routeMile: number): RunnerForecast | null {
    if (!this.isRunnerProfileValid(profile)) {
      return null;
    }

    const goalMinutes = this.getRunnerGoalMinutes(profile);
    const startTimeDate = this.parseRunnerStartTime(profile.startTime);

    if (goalMinutes === null || startTimeDate === null) {
      return null;
    }

    const elapsedMinutes = this.getCourseElapsedMinutesForGoal(goalMinutes, routeMile) + this.getRunnerSplitAdjustment(profile, goalMinutes, routeMile);
    const raceFraction = Math.min(1, Math.max(0, routeMile / 26.2));
    const predictedDate = new Date(startTimeDate.getTime() + (elapsedMinutes * 60 * 1000));
    const windowFraction = this.calculateRunnerWindowFraction(routeMile);
    const windowStart = new Date(startTimeDate.getTime() + ((elapsedMinutes * (1 - windowFraction)) * 60 * 1000));
    const windowEnd = new Date(startTimeDate.getTime() + ((elapsedMinutes * (1 + windowFraction)) * 60 * 1000));

    return {
      runner: profile,
      predictedDate,
      windowStart,
      windowEnd,
      toleranceMinutes: (windowEnd.getTime() - windowStart.getTime()) / 60000 / 2
    };
  }

  private formatClockValue(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  }

  private getSplitElapsedDisplay(split: RunnerSplit): string {
    return this.formatDurationMinutes(split.elapsedMinutes);
  }

  private formatRunnerForecastHtml(routeMile: number): string {
    const forecasts = this.getRunnerForecastsForDistance(routeMile);
    if (!forecasts.length) {
      return '';
    }

    const rows = forecasts.map((forecast) => {
      const runnerLabel = forecast.runner.name || 'Runner';
      const predictedTime = this.formatClockValue(forecast.predictedDate);
      const windowStart = this.formatClockValue(forecast.windowStart);
      const windowEnd = this.formatClockValue(forecast.windowEnd);

      return `
        <div style="margin-top: 8px;">
          <div><strong>${runnerLabel}:</strong> ${predictedTime}</div>
          <div style="font-size: 0.72rem; color: #475569;">Window: ${windowStart} – ${windowEnd}</div>
        </div>
      `;
    }).join('');

    return `
      <div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid rgba(148, 163, 184, 0.4);">
        <div style="font-weight:700; margin-bottom: 4px;">Runner ETA</div>
        ${rows}
      </div>
    `;
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
    this.requestDeviceHeadingPermission();

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

      const headingDegrees = this.resolveHeadingDegrees(heading);
      if (headingDegrees !== null) {
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
    const runnerForecastHtml = this.formatRunnerForecastHtml(routeMile);

    return `
      <div style="min-width: 220px; font-family: Arial, sans-serif;">
        <div><strong>Course point</strong></div>
        <div style="margin-top: 6px;"><strong>Race mile:</strong> ${routeMile.toFixed(1)} mi</div>
        <div style="margin-top: 4px;"><strong>Distance from you:</strong> ${distanceText}</div>
        ${runnerForecastHtml}
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

      const groupedStations = RaceMapComponent.groupStationsByLocation(stations);
      const groupedResults = new Map<string, { stations: StationRecord[]; accessPoints: StationAccessPoint[]; closestDistanceMiles: number; raceMiles: number[] }>();

      groupedStations.forEach((stationGroup) => {
        const groupResults = stationGroup
          .map((station) => RaceMapComponent.getStationCourseProximity(station, this.routePoints, this.routeDistances))
          .filter((summary) => summary.closestDistanceMiles <= this.stationDistanceLimitMiles)
          .sort((a, b) => a.closestDistanceMiles - b.closestDistanceMiles);

        if (groupResults.length === 0) {
          return;
        }

        const key = RaceMapComponent.getStationLocationKey(stationGroup[0]);
        const current = groupedResults.get(key) ?? {
          stations: [],
          accessPoints: [],
          closestDistanceMiles: Number.POSITIVE_INFINITY,
          raceMiles: []
        };

        current.stations.push(...stationGroup);
        current.accessPoints.push(...groupResults.flatMap((result) => result.accessPoints));
        current.closestDistanceMiles = Math.min(current.closestDistanceMiles, ...groupResults.map((result) => result.closestDistanceMiles));
        current.raceMiles.push(...groupResults.flatMap((result) => result.raceMiles));

        groupedResults.set(key, current);
      });

      groupedResults.forEach(({ stations, accessPoints, closestDistanceMiles, raceMiles }) => {
        const uniqueStations = RaceMapComponent.deduplicateStationsByStopId(stations);

        const location: RacePoint = [Number(uniqueStations[0].location.latitude), Number(uniqueStations[0].location.longitude)];
        const markerHtml = RaceMapComponent.getCombinedStationMarkerHtml(uniqueStations);

        const dedupedAccessPoints = RaceMapComponent.deduplicateAccessPoints(accessPoints)
          .sort((a, b) => a.walkDistanceMiles - b.walkDistanceMiles || a.routeMile - b.routeMile)
          .slice(0, 2);

        const accessPointHtml = dedupedAccessPoints.length > 0
          ? dedupedAccessPoints
              .map((entry) => `<li><strong>${entry.routeMile.toFixed(1)} mi</strong> — ${entry.walkDistanceMiles.toFixed(2)} mi</li>`)
              .join('')
          : `<li><strong>${(raceMiles[0] ?? 0)?.toFixed(1) ?? '0.0'} mi</strong> — ${closestDistanceMiles.toFixed(2)} mi</li>`;

        const stationMarker = L.marker(location, {
          icon: L.divIcon({
            className: 'station-marker pie-station-marker',
            html: markerHtml,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })
        });

        const getStationPopupHtml = (): string => {
          const currentUserDistanceText = this.getDistanceFromUserText(location);
          const popupHeader = RaceMapComponent.buildStationPopupHeader(uniqueStations);
          const popupTitle = uniqueStations.length === 1
            ? `${uniqueStations[0].station_name || uniqueStations[0].stop_name || 'L Station'}`
            : `${uniqueStations.length} nearby stations`;
          const currentMapButtons = this.getMapActionButtons(location, popupTitle);

          return `
            <div style="min-width: 240px; font-family: Arial, sans-serif;">
              ${popupHeader}
              <div style="margin-top: 10px;">
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

  private resolveHeadingDegrees(heading?: number): number | null {
    if (typeof heading === 'number' && Number.isFinite(heading)) {
      return heading;
    }

    if (typeof this.deviceHeadingDegrees === 'number' && Number.isFinite(this.deviceHeadingDegrees)) {
      return this.deviceHeadingDegrees;
    }

    return null;
  }

  private requestDeviceHeadingPermission(): void {
    if (typeof window === 'undefined' || this.deviceOrientationListenerAttached) {
      return;
    }

    const orientationApi = (window as any).DeviceOrientationEvent;
    if (!orientationApi) {
      return;
    }

    this.deviceOrientationListenerAttached = true;

    const requestPermission = orientationApi.requestPermission;
    if (typeof requestPermission === 'function') {
      requestPermission.call(orientationApi)
        .then((status: string) => {
          if (status === 'granted') {
            window.addEventListener('deviceorientation', (event: DeviceOrientationEvent) => {
              const compassHeading = (event as any).webkitCompassHeading;
              const heading = typeof compassHeading === 'number'
                ? compassHeading
                : typeof (event as any).alpha === 'number'
                  ? (event as any).alpha
                  : null;

              if (heading !== null && Number.isFinite(heading)) {
                this.deviceHeadingDegrees = heading;
                if (this.userLocation) {
                  const headingPoint = this.getHeadingPoint(this.userLocation, heading);
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
                      const updatedHtml = arrow.replace('transform: rotate(0deg)', `transform: rotate(${heading}deg)`);
                      this.userHeadingMarker.setIcon(L.divIcon({
                        className: 'user-heading-marker',
                        html: updatedHtml,
                        iconSize: [16, 16],
                        iconAnchor: [8, 8]
                      }));
                    }
                  }
                }
              }
            }, true);
          }
        })
        .catch(() => {
          this.deviceHeadingDegrees = null;
        });
      return;
    }

    window.addEventListener('deviceorientation', (event: DeviceOrientationEvent) => {
      const compassHeading = (event as any).webkitCompassHeading;
      const heading = typeof compassHeading === 'number'
        ? compassHeading
        : typeof (event as any).alpha === 'number'
          ? (event as any).alpha
          : null;

      if (heading !== null && Number.isFinite(heading)) {
        this.deviceHeadingDegrees = heading;
        if (this.userLocation) {
          const headingPoint = this.getHeadingPoint(this.userLocation, heading);
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
              const updatedHtml = arrow.replace('transform: rotate(0deg)', `transform: rotate(${heading}deg)`);
              this.userHeadingMarker.setIcon(L.divIcon({
                className: 'user-heading-marker',
                html: updatedHtml,
                iconSize: [16, 16],
                iconAnchor: [8, 8]
              }));
            }
          }
        }
      }
    }, true);
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

  static groupStationsByLocation(stations: StationRecord[]): Map<string, StationRecord[]> {
    const grouped = new Map<string, StationRecord[]>();

    stations.forEach((station) => {
      const key = RaceMapComponent.getStationLocationKey(station);
      const current = grouped.get(key) ?? [];
      current.push(station);
      grouped.set(key, current);
    });

    return grouped;
  }

  static deduplicateStationsByStopId(stations: StationRecord[]): StationRecord[] {
    const byStopId = new Map<string, StationRecord>();

    stations.forEach((station) => {
      const key = station.stop_id ?? RaceMapComponent.getStationLocationKey(station);
      if (!byStopId.has(key)) {
        byStopId.set(key, station);
      }
    });

    return Array.from(byStopId.values());
  }

  static getStationLocationKey(station: StationRecord): string {
    const stationName = station.station_name || station.stop_name || 'L Station';
    const latitude = Number(station.location.latitude);
    const longitude = Number(station.location.longitude);
    return `${stationName}|${latitude.toFixed(6)}|${longitude.toFixed(6)}`;
  }

  static getStationLineEntries(station: StationRecord): StationLineInfo[] {
    const lineEntries: Array<{ code: string; enabled?: boolean; label: string; color: string }> = [
      { code: 'red', enabled: station.red, label: 'Red Line', color: '#d62828' },
      { code: 'blue', enabled: station.blue, label: 'Blue Line', color: '#1d4ed8' },
      { code: 'g', enabled: station.g, label: 'Green Line', color: '#2e7d32' },
      { code: 'brn', enabled: station.brn, label: 'Brown Line', color: '#8d6e63' },
      { code: 'p', enabled: station.p, label: 'Purple Line', color: '#8e24aa' },
      { code: 'y', enabled: station.y, label: 'Yellow Line', color: '#f9a825' },
      { code: 'pnk', enabled: station.pnk, label: 'Pink Line', color: '#ec4899' },
      { code: 'o', enabled: station.o, label: 'Orange Line', color: '#f97316' }
    ];

    return lineEntries
      .filter((line) => Boolean(line.enabled))
      .map(({ code, label, color }) => ({ code, label, color }));
  }

  static getDistinctStationLineEntries(stations: StationRecord[]): StationLineInfo[] {
    const linesByCode = new Map<string, StationLineInfo>();

    stations.forEach((station) => {
      RaceMapComponent.getStationLineEntries(station).forEach((line) => {
        if (!linesByCode.has(line.code)) {
          linesByCode.set(line.code, line);
        }
      });
    });

    return Array.from(linesByCode.values());
  }

  static getStationPieMarkerHtml(stations: StationRecord[]): string {
    const colors = RaceMapComponent.getDistinctStationLineEntries(stations).map((line) => line.color);
    const safeColors = colors.length > 0 ? colors : ['#64748b'];
    const sliceSize = 100 / safeColors.length;
    const gradient = safeColors.map((color, index) => `${color} ${index * sliceSize}% ${(index + 1) * sliceSize}%`).join(', ');

    return `
      <div style="
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: conic-gradient(${gradient});
        border: 2px solid rgba(255,255,255,0.9);
        box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.18);
        display: flex;
        align-items: center;
        justify-content: center;
      "></div>
    `;
  }

  static buildStationPopupHeader(stations: StationRecord[]): string {
    const uniqueStationNames = Array.from(new Set(stations.map((station) => station.station_name || station.stop_name || 'L Station')));
    const lineEntries = RaceMapComponent.getDistinctStationLineEntries(stations);
    const stationNamesHtml = uniqueStationNames.map((name) => `
      <div style="font-size: 1rem; font-weight: 700; margin-bottom: 4px;">${name}</div>
    `).join('');
    const lineBadges = lineEntries.map((line) => `
      <span style="display:inline-block; background:${line.color}; color:white; border-radius: 999px; padding: 2px 8px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.04em;">${line.label}</span>
    `).join('');

    return `
      <div style="display: flex; flex-direction: column; margin-bottom: 8px;">
        ${stationNamesHtml}
        <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top: 4px;">
          ${lineBadges}
        </div>
      </div>
    `;
  }

  static getCombinedStationMarkerHtml(stations: StationRecord[]): string {
    return RaceMapComponent.getStationPieMarkerHtml(stations);
  }

  static getStationLineName(station: StationRecord): string {
    return RaceMapComponent.getStationLineEntries(station)[0]?.label ?? 'Red Line';
  }

  static getStationColor(station: StationRecord): string {
    return RaceMapComponent.getStationLineEntries(station)[0]?.color ?? '#d62828';
  }
}
