import { Component, OnInit, OnDestroy } from '@angular/core';
import { IntervalService } from '../../services/interval.service';

interface AthleteState {
  id: string;
  name: string;
  isFinished: boolean;
  splits: any[];
}

@Component({
  selector: 'app-interval',
  templateUrl: './interval.component.html',
  styleUrls: ['./interval.component.scss']
})
export class IntervalComponent implements OnInit, OnDestroy {

  items: any[] = [];
  eventCodeToSearch: string = '';
  eventData: any = null;
  totalTime = 0;
  searchAthleteName: string = '';
  eventSubscription: any;
  splitsSubscription: any;
  timerInterval: any;
  active = false;
  hasStarted = false;
  isStopped = false;  // Tracks if timer has been stopped (separate from active)
  dbStartTime: string | null = null;  // Store DB start time for consistent calculations
  dbStopTime: string | null = null;   // Store DB stop time for consistent calculations
  athleteStates: Map<string, AthleteState> = new Map();

  constructor(private _supabase: IntervalService) { }

  async ngOnInit(): Promise<void> {
    // If event already has a start_time (e.g. page refresh), start timer immediately
    if (this.eventData?.event_code) {
      this.checkIfActive();
      this.subscribeToEventUpdates();
    }
  }

  checkIfActive() {
    this._supabase.getEventByCode(this.eventData.event_code).then(event => {
      // If start_time exists and stop_time is null, timer is running
      if (event.start_time && !event.stop_time) {
        this.dbStartTime = event.start_time;
        this.dbStopTime = null;
        this.active = true;
        this.hasStarted = true;
        this.isStopped = false;
        this.startLocalTimer(event.start_time);
      }
      // If both exist, timer was stopped
      else if (event.start_time && event.stop_time) {
        this.dbStartTime = event.start_time;
        this.dbStopTime = event.stop_time;
        this.active = false;
        this.hasStarted = true;
        this.isStopped = true;
        this.stopLocalTimer();
        // Calculate elapsed time from DB start and stop times
        const startMs = new Date(event.start_time).getTime();
        const stopMs = new Date(event.stop_time).getTime();
        this.totalTime = stopMs - startMs;
      }
      // If both are null, timer is reset
      else {
        this.dbStartTime = null;
        this.dbStopTime = null;
        this.active = false;
        this.hasStarted = false;
        this.isStopped = false;
        this.stopLocalTimer();
        this.totalTime = 0;
      }
      
      // Initialize athlete states
      // this.initializeAthleteStates(event);
    }).catch(error => {
      console.error('Error checking if event is active:', error);
    });
  }


  startLocalTimer(startTime: string) {
    // Prevent retriggering if timer is already running
    if (this.active && this.timerInterval) {
      return;
    }
    
    // Use the DB start time to calculate elapsed time (consistent across all devices)
    const start = new Date(startTime).getTime();
    this.active = true;
    this.timerInterval = setInterval(() => {
      // Calculate based on DB start time to keep all devices in sync
      this.totalTime = Date.now() - start; // ms elapsed
    }, 100);
  }

  stopLocalTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.active = false;
  }

  /**
   * Reset the timer state locally - clears timer, time, and athlete states
   */
  resetLocalTimer() {
    this.stopLocalTimer();
    this.totalTime = 0;
    this.dbStartTime = null;
    this.dbStopTime = null;
    this.hasStarted = false;
    this.isStopped = false;
    
    // Reset all athlete states
    this.athleteStates.forEach((state) => {
      state.isFinished = false;
      state.splits = [];
    });
  }

  ngOnDestroy() {
    this.stopLocalTimer();
  }

  /**
   * Joins an event using the event code. Fetches the event data from the DB and sets it to eventData.
   */
  joinEvent() {
    console.log('Joining event with code:', this.eventCodeToSearch);
    // Implement logic to join the event using the event code
    this._supabase.getEventByCode(this.eventCodeToSearch).then(eventData => {
      if (!eventData) {
        console.error('Event not found with code:', this.eventCodeToSearch);
        return;
      }
      this.eventData = eventData;
      console.log('Event data:', this.eventData);
      this.checkIfActive();
      
      // Set up realtime subscription for this event
      this.subscribeToEventUpdates();
    }).catch(error => {
      console.error('Error fetching event data:', error);
    });
  }

  /**
   * Subscribe to real-time updates for the current event
   */
  subscribeToEventUpdates() {
    if (this.eventSubscription) return; // Already subscribed
    
    if (this.eventData?.event_code) {
      this.eventSubscription = this._supabase.subscribeToEvent(
        this.eventData.event_code,
        (startTime) => {
          console.log('Timer started on another device, syncing...');
          this.dbStartTime = startTime;
          this.dbStopTime = null;
          this.active = true;
          this.hasStarted = true;
          this.isStopped = false;
          this.startLocalTimer(startTime);
        },
        (stopTime) => {
          console.log('Timer stopped on another device, syncing...');
          this.active = false;
          this.isStopped = true;
          this.stopLocalTimer();
          // Fetch the event to get both start and stop times for accurate calculation
          this._supabase.getEventByCode(this.eventData.event_code).then(event => {
            this.dbStartTime = event.start_time;
            this.dbStopTime = event.stop_time;
            const startMs = new Date(event.start_time).getTime();
            const stopMs = new Date(event.stop_time).getTime();
            this.totalTime = stopMs - startMs;
          }).catch(error => {
            console.error('Error fetching event during sync:', error);
          });
        },
        () => {
          console.log('Timer reset on another device, syncing...');
          this.active = false;
          this.resetLocalTimer();
        }
      );
    }
  }

  /**
   * Creates a new event. Generates a unique 6 digit event code and saves the event to the DB.
   * Default event name to "Event " + event code.
   * The event code is used to join the event and to identify the event in the DB.
   */
  createNewEvent() {
    console.log('Creating a new event');
    // Implement logic to create a new event
  }

  /**
   * Starts the timer for the selected event. Sets the start time for the event in the DB
   */
  startTimer() {
    this.active = true; // Instant UI feedback
    this.hasStarted = true;
    this._supabase.startEventTimer(this.eventData.event_code).then((result) => {
      // Use the DB timestamp to start the timer so all devices sync to the same time
      this.dbStartTime = result.startTime;
      this.isStopped = false;
      this.startLocalTimer(result.startTime);
      console.log('Event timer started in DB');
    }).catch(error => {
      console.error('Error starting event timer in DB:', error);
      this.active = false; // Revert if DB update fails
      this.hasStarted = false;
      this.dbStartTime = null;
    });
  }

  stopTimer() {
    this.active = false; // Instant UI feedback
    this._supabase.stopEventTimer(this.eventData.event_code).then((result) => {
      this.stopLocalTimer();
      this.isStopped = true;
      // Fetch the updated event from DB to get exact stop_time
      this._supabase.getEventByCode(this.eventData.event_code).then(event => {
        this.dbStartTime = event.start_time;
        this.dbStopTime = event.stop_time;
        // Calculate elapsed time from DB values for accuracy across all devices
        const startMs = new Date(event.start_time).getTime();
        const stopMs = new Date(event.stop_time).getTime();
        this.totalTime = stopMs - startMs;
        console.log('Event timer stopped in DB');
      }).catch(error => {
        console.error('Error fetching updated event:', error);
      });
    }).catch(error => {
      console.error('Error stopping event timer in DB:', error);
      this.active = true; // Revert if DB update fails
      this.isStopped = false;
    });
  }

  resetTimer() {
    this.active = false; // Instant UI feedback
    this.resetLocalTimer();
    
    this._supabase.resetTimer(this.eventData.event_code).then(() => {
      console.log('Event timer reset in DB');
    }).catch(error => {
      console.error('Error resetting event timer in DB:', error);
    });
  }

  /**
   * Laps the athletes timer for this event. Sends a split to the Splits table
   * with event code, athlete id, current time (no timezone)
   * @param athleteId 
   */
  lapAthlete(athleteId: any) {
    console.log('Lapping athlete with ID:', athleteId);
    // insert code here
  }

  /**
   * Stops the athletes timer for this event. Sends a split to the Splits table with finish = true
   */
  stopAthlete(athleteId: any) {
    console.log('Stopping athlete with ID:', athleteId);
    // insert code here
  }

  /**
   * Add an athlete to the event. Either selects an existing one from DB table Athletes
   * OR creates a new one if the name is not found.
   * The athlete is then added to the event by adding their uuid 
   * to eventData.athletes array and updating the event in the DB.
   */
  addAthlete() {
    console.log('Adding athlete to event:', this.eventData);
    if (!this.eventData) {
      console.error('No event selected. Cannot add athlete.');
      return;
    }
    if (!this.searchAthleteName) {
      console.error('No athlete name provided. Cannot add athlete.');
      return;
    }
    this._supabase.findAthlete(this.eventData.event_code, this.searchAthleteName);
  }

  /**
   * Format elapsed milliseconds as mm:ss.SS (minutes:seconds.centiseconds)
   */
  // formatElapsedTime(ms: number): string {
  //   if (!ms || ms < 0) return '00:00.00';
    
  //   const totalSeconds = Math.floor(ms / 1000);
  //   const minutes = Math.floor(totalSeconds / 60);
  //   const seconds = totalSeconds % 60;
  //   const centiseconds = Math.floor((ms % 1000) / 10);
    
  //   return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
  // }

  /**
   * Calculate elapsed time from event start to a split timestamp
   */
  getSplitElapsedTime(splitTimestamp: string): number {
    if (!this.eventData?.start_time) return 0;
    const startMs = new Date(this.eventData.start_time).getTime();
    const splitMs = new Date(splitTimestamp).getTime();
    return Math.max(0, splitMs - startMs);
  }

}
