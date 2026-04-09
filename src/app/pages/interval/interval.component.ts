import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
  splitsSubscriptions: Map<string, any> = new Map();  // Map to track subscriptions per athlete
  timerInterval: any;
  active = false;
  hasStarted = false;
  isStopped = false;  // Tracks if timer has been stopped (separate from active)
  dbStartTime: string | null = null;  // Store DB start time for consistent calculations
  dbStopTime: string | null = null;   // Store DB stop time for consistent calculations
  athleteStates: Map<string, AthleteState> = new Map();

  constructor(private _supabase: IntervalService, private cdr: ChangeDetectorRef) { }

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
      
      // Initialize athlete states with their splits data
      this.initializeAthleteStates(event);
    }).catch(error => {
      console.error('Error checking if event is active:', error);
    });
  }

  /**
   * Initialize athlete states by fetching their splits data from DB
   */
  async initializeAthleteStates(event: any) {
    if (!event.athletes || event.athletes.length === 0) {
      return;
    }

    for (const athlete of event.athletes) {
      try {
        const splitRecord = await this._supabase.getOrCreateAthleteRecord(event.event_code, athlete.id);
        
        // Initialize athlete state if not already present
        if (!this.athleteStates.has(athlete.id)) {
          this.athleteStates.set(athlete.id, {
            id: athlete.id,
            name: athlete.name,
            isFinished: splitRecord.finish || false,
            splits: splitRecord.split_time || []
          });
        } else {
          // Update existing state with fresh data
          const state = this.athleteStates.get(athlete.id)!;
          state.isFinished = splitRecord.finish || false;
          state.splits = splitRecord.split_time || [];
        }

        // Subscribe to realtime split updates for this athlete
        this.subscribeToAthleteUpdates(event.event_code, athlete);
      } catch (error) {
        console.error(`Error initializing splits for athlete ${athlete.id}:`, error);
      }
    }
  }

  /**
   * Subscribe to realtime split updates for an athlete
   */
  subscribeToAthleteUpdates(eventCode: string, athlete: any) {
    // Avoid duplicate subscriptions
    if (this.splitsSubscriptions.has(athlete.id)) {
      console.log(`Already subscribed to athlete ${athlete.id}`);
      return;
    }

    console.log(`Subscribing to athlete: ${athlete.name} (${athlete.id})`);
    
    const subscription = this._supabase.subscribeTAthleteSpits(
      eventCode,
      athlete.id,
      (updatedSplitRecord: any) => {
        console.log(`Callback fired for athlete ${athlete.id}:`, updatedSplitRecord);
        const state = this.athleteStates.get(athlete.id);
        if (state) {
          state.splits = updatedSplitRecord.split_time || [];
          state.isFinished = updatedSplitRecord.finish || false;
          console.log(`Updated state for athlete ${athlete.id}:`, state);
          // Manually trigger change detection since realtime callbacks happen outside Angular's zone
          this.cdr.markForCheck();
        }
      }
    );

    this.splitsSubscriptions.set(athlete.id, subscription);
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
    
    // Reset all athlete states (their split data will sync via realtime subscriptions)
    this.athleteStates.forEach((state) => {
      state.isFinished = false;
      state.splits = [];
    });
  }

  /**
   * Calculate elapsed time from a split timestamp relative to event start
   */
  getSplitDisplayTime(splitTime: string): number {
    if (!this.dbStartTime || !splitTime) return 0;
    const startMs = new Date(this.dbStartTime).getTime();
    const splitMs = new Date(splitTime).getTime();
    return splitMs - startMs;
  }

  /**
   * Get both the split delta time (time since last lap) and total time from event start
   * Returns { deltaMs: number, totalMs: number }
   */
  getSplitInfo(athleteId: string, splitIndex: number): { deltaMs: number; totalMs: number } {
    const state = this.athleteStates.get(athleteId);
    if (!state || !state.splits[splitIndex] || !this.dbStartTime) {
      return { deltaMs: 0, totalMs: 0 };
    }

    const startMs = new Date(this.dbStartTime).getTime();
    const currentSplitMs = new Date(state.splits[splitIndex]).getTime();
    const totalMs = currentSplitMs - startMs;

    // Calculate delta from previous split or from start if first split
    let deltaMs = totalMs;
    if (splitIndex > 0 && state.splits[splitIndex - 1]) {
      const previousSplitMs = new Date(state.splits[splitIndex - 1]).getTime();
      deltaMs = currentSplitMs - previousSplitMs;
    }

    return { deltaMs, totalMs };
  }

  ngOnDestroy() {
    this.stopLocalTimer();
    
    // Unsubscribe from all athlete split subscriptions
    this.splitsSubscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.splitsSubscriptions.clear();

    // Unsubscribe from event subscription
    if (this.eventSubscription) {
      this.eventSubscription.unsubscribe();
    }
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
      // Also reset all athlete splits when event timer is reset
      return this._supabase.resetAllAthleteRecords(this.eventData.event_code);
    }).then(() => {
      console.log('Event timer and athlete splits reset in DB');
    }).catch(error => {
      console.error('Error resetting event timer or athlete splits in DB:', error);
    });
  }

  /**
   * Laps the athletes timer for this event. Sends a split to the Splits table
   * with event code, athlete id, current time (no timezone)
   * @param athleteId 
   */
  lapAthlete(athleteId: any) {
    console.log('Lapping athlete with ID:', athleteId);
    
    if (!this.eventData) {
      console.error('No event data available');
      return;
    }

    // Get current time as timestamp
    const currentTime = new Date().toISOString();

    this._supabase.recordLap(this.eventData.event_code, athleteId, currentTime)
      .then((updatedRecord) => {
        console.log('Lap recorded successfully:', updatedRecord);
        // Update athlete state with new splits
        const state = this.athleteStates.get(athleteId);
        if (state) {
          state.splits = updatedRecord.split_time || [];
        }
      })
      .catch(error => {
        console.error('Error recording lap:', error);
      });
  }

  /**
   * Stops the athletes timer for this event. Sends a split to the Splits table with finish = true
   */
  stopAthlete(athleteId: any) {
    console.log('Stopping athlete with ID:', athleteId);

    if (!this.eventData) {
      console.error('No event data available');
      return;
    }

    // Get current time as timestamp
    const currentTime = new Date().toISOString();

    this._supabase.finishAthlete(this.eventData.event_code, athleteId, currentTime)
      .then((updatedRecord) => {
        console.log('Athlete finished successfully:', updatedRecord);
        // Update athlete state with finish status and final splits
        const state = this.athleteStates.get(athleteId);
        if (state) {
          state.splits = updatedRecord.split_time || [];
          state.isFinished = true;
        }
      })
      .catch(error => {
        console.error('Error finishing athlete:', error);
      });
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
    this._supabase.findAthlete(this.eventData.event_code, this.searchAthleteName).then(() => {
      // Fetch updated event data to get the newly added athlete
      this._supabase.getEventByCode(this.eventData.event_code).then(updatedEvent => {
        this.eventData = updatedEvent;
        this.cdr.markForCheck();
        
        // Initialize splits for any new athletes
        const newAthletes = updatedEvent.athletes.filter((athlete: any) => !this.athleteStates.has(athlete.id));
        for (const athlete of newAthletes) {
          this._supabase.getOrCreateAthleteRecord(updatedEvent.event_code, athlete.id).then(splitRecord => {
            // Initialize athlete state
            this.athleteStates.set(athlete.id, {
              id: athlete.id,
              name: athlete.name,
              isFinished: splitRecord.finish || false,
              splits: splitRecord.split_time || []
            });
            this.cdr.markForCheck();
            
            // Subscribe to updates for this athlete
            this.subscribeToAthleteUpdates(updatedEvent.event_code, athlete);
          }).catch(error => {
            console.error(`Error initializing splits for new athlete ${athlete.id}:`, error);
          });
        }
        
        // Clear the search input
        this.searchAthleteName = '';
      }).catch(error => {
        console.error('Error fetching updated event:', error);
      });
    }).catch(error => {
      console.error('Error adding athlete:', error);
    });
  }

}
