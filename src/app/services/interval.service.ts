import { Injectable } from '@angular/core';
import { createClient  } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class IntervalService {
  private supabase = createClient(environment.supabaseUrl, environment.supabaseKey, {
    db: {
      schema: 'TimingApp'
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })

  // constructor() {
  //   this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  // }

  // Example: fetch data from a table
  async getData(table: string) {
    const { data, error } = await this.supabase.from(table).select('*');
    if (error) throw error;
    return data;
  }

  /**
   * Search Events table for event code and return the event data
   * Includes not just the Events table info but any athletes in the event.athletes array
   * and any splits in the Splits table with this event code
   * @param eventCode 
   * @returns event data
   */
  async getEventByCode(eventCode: string) {
    // Implement logic to search Events table for event code and return the event data
    const { data: eventData, error } = await this.supabase.from("Events").select('*').eq('event_code', eventCode).maybeSingle();
    if (error) throw error;
    if (!eventData) return null;
    if (eventData?.athletes && eventData.athletes.length > 0) {
      eventData.athletes = await this.getAthletesByIds(eventData.athletes);
      eventData.splits = await this.getSplitsByEventCode(eventCode);
    }
    return eventData;
  }

  /**
   * Get splits from Splits table with event code (for all athletes)
   */
  async getSplitsByEventCode(eventCode: string) {
    const { data, error } = await this.supabase.from("Splits").select('*').eq('event_code', eventCode);
    if (error) throw error;
    return data;
  }

  /**
   * Get multiple athletes from Athletes table with array of athlete uuids
   */
  async getAthletesByIds(athleteIds: string[]) {
    const { data, error } = await this.supabase.from("Athletes").select('*').in('id', athleteIds);
    if (error) throw error;
    return data;
  }

  /**
   * Get splits from Splits table with event code and athlete id
   */
  async getSplitsByEventCodeAndAthleteId(eventCode: string, athleteId: string) {
    const { data, error } = await this.supabase.from("Splits").select('*').eq('event_code', eventCode).eq('athlete_id', athleteId);
    if (error) throw error;
    return data;
  }

  /**
   * Create a new athlete in the Athletes table with the given name. Return the athlete data.
   */
  async createAthlete(name: string) {
    const { data, error } = await this.supabase.from("Athletes").insert({ name }).select('*').single();
    if (error) throw error;
    return data;
  }

  /** 
   * Search for athletes in the Athletes table with a name that matches the search term. Return an array of matching athletes.
   * Uses ilike for case insensitive search and partial matches. Search term should be wrapped in % for partial matches.
  */
  async searchAthletesByName(name: string) {
    const { data, error } = await this.supabase.from("Athletes").select('*').ilike('name', `%${name}%`);
    if (error) throw error;
    return data;
  }

  /**
   * Look for an athlete in the Athletes table with a name that matches the search term.
   * If they already exist in athlete db add their uuid to array
   * If they don't exist in athlete db create them and add their uuid to array.
   * @param eventCode 
   * @param athleteName 
   * @returns 
   */
  async findAthlete(eventCode:string, athleteName:string) {
    try {
      const eventData = await this.getEventByCode(eventCode);
      if (!eventData) throw new Error('Event not found');

      const existingAthletes = await this.searchAthletesByName(athleteName);
      if (existingAthletes && existingAthletes.length > 0) {
        await this.addAthleteToEvent(eventCode, existingAthletes[0].id);
      } else {
        const newAthlete = await this.createAthlete(athleteName);
        await this.addAthleteToEvent(eventCode, newAthlete.id);
      }
    } catch (error) {
      console.error('Error finding athlete:', error);
    }
  }

  /**
   * Add an athlete to an event. 
   * Update the event's athletes array in the Events table with the new athlete id.
   */
  async addAthleteToEvent(eventCode: string, athleteId: string) {
    try {
      const eventData = await this.getEventByCode(eventCode);
      if (!eventData) throw new Error('Event not found');

      // Extract athlete IDs - handle both string IDs (raw DB) and full athlete objects (enriched)
      const athleteIds = (eventData.athletes || []).map((athlete: any) => {
        return typeof athlete === 'string' ? athlete : athlete.id;
      });
      
      if (!athleteIds.includes(athleteId)) {
        athleteIds.push(athleteId);
        const { data, error } = await this.supabase
          .from("Events")
          .update({ athletes: athleteIds })
          .eq('event_code', eventCode);
        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error adding athlete to event:', error);
    }
  }

  async startEventTimer(eventCode: string) {
    const startTime = new Date().toISOString();
    const { data, error } = await this.supabase
      .from("Events")
      .update({ start_time: startTime })
      .eq('event_code', eventCode);
    if (error) throw error;
    return { data, startTime };
  }

  async stopEventTimer(eventCode: string) {
    const stopTime = new Date().toISOString();
    const { data, error } = await this.supabase
      .from("Events")
      .update({ stop_time: stopTime })
      .eq('event_code', eventCode);
    if (error) throw error;
    return { data, stopTime };
  }

  async resetTimer(eventCode: string) {
    const { data, error } = await this.supabase
      .from("Events")
      .update({ start_time: null, stop_time: null })
      .eq('event_code', eventCode);
    if (error) throw error;
    return data;
  }

  subscribeToEvent(
    eventCode: string,
    onTimerStart: (startTime: string) => void,
    onTimerStop?: (stopTime: string) => void,
    onTimerReset?: () => void
  ) {
    return this.supabase
      .channel(`event-${eventCode}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'TimingApp',
          table: 'Events',
          filter: `event_code=eq.${eventCode}`
        },
        (payload: { new: Record<string, any> }) => {
          const hasStartTime = payload.new?.['start_time'] !== null && payload.new?.['start_time'] !== undefined;
          const hasStopTime = payload.new?.['stop_time'] !== null && payload.new?.['stop_time'] !== undefined;
          
          // Timer was reset (both cleared)
          if (!hasStartTime && !hasStopTime && onTimerReset) {
            onTimerReset();
          }
          // Timer stopped (stop_time is set)
          else if (hasStopTime && onTimerStop) {
            onTimerStop(payload.new['stop_time']);
          }
          // Timer started
          else if (hasStartTime) {
            onTimerStart(payload.new['start_time']);
          }
        }
      )
      .subscribe();
  }

  /**
   * Get or create a split record for an athlete in an event.
   * Returns the split record with split_time array and finish status.
   */
  async getOrCreateAthleteRecord(eventCode: string, athleteId: string) {
    const { data, error } = await this.supabase
      .from("Splits")
      .select('*')
      .eq('event_code', eventCode)
      .eq('athlete_id', athleteId)
      .maybeSingle();
    
    if (error) throw error;
    
    // If record doesn't exist, create it with empty split_time array
    if (!data) {
      const { data: newRecord, error: insertError } = await this.supabase
        .from("Splits")
        .insert({
          event_code: eventCode,
          athlete_id: athleteId,
          split_time: [],
          finish: false
        })
        .select('*')
        .single();
      
      if (insertError) throw insertError;
      return newRecord;
    }
    
    return data;
  }

  /**
   * Record a lap for an athlete by appending the current time to their split_time array.
   */
  async recordLap(eventCode: string, athleteId: string, splitTime: string) {
    // Get current record to append to split_time array
    const record = await this.getOrCreateAthleteRecord(eventCode, athleteId);
    const updatedSplitTimes = record.split_time ? [...record.split_time, splitTime] : [splitTime];
    
    const { data, error } = await this.supabase
      .from("Splits")
      .update({ split_time: updatedSplitTimes })
      .eq('event_code', eventCode)
      .eq('athlete_id', athleteId)
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Stop an athlete by appending the final time to split_time array and setting finish to true.
   */
  async finishAthlete(eventCode: string, athleteId: string, finalSplitTime: string) {
    // Get current record to append final time
    const record = await this.getOrCreateAthleteRecord(eventCode, athleteId);
    const updatedSplitTimes = record.split_time ? [...record.split_time, finalSplitTime] : [finalSplitTime];
    
    const { data, error } = await this.supabase
      .from("Splits")
      .update({ 
        split_time: updatedSplitTimes,
        finish: true
      })
      .eq('event_code', eventCode)
      .eq('athlete_id', athleteId)
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Reset all athlete splits for an event (clears split_time array and finish flag for all athletes)
   */
  async resetAllAthleteRecords(eventCode: string) {
    const { data, error } = await this.supabase
      .from("Splits")
      .update({
        split_time: [],
        finish: false
      })
      .eq('event_code', eventCode);
    
    if (error) throw error;
    return data;
  }

  /**
   * Subscribe to real-time updates for an athlete's splits
   */
  subscribeTAthleteSpits(
    eventCode: string,
    athleteId: string,
    onSplitUpdate: (splits: any) => void
  ) {
    console.log(`Setting up subscription for event: ${eventCode}, athlete: ${athleteId}`);
    
    const channel = this.supabase
      .channel(`splits-${eventCode}-${athleteId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'TimingApp',
          table: 'Splits'
        },
        (payload: { new: Record<string, any> }) => {
          // Filter in the callback instead of relying on the filter parameter
          if (payload.new['event_code'] === eventCode && payload.new['athlete_id'] === athleteId) {
            console.log(`Splits update received for athlete ${athleteId}:`, payload);
            onSplitUpdate(payload.new);
          }
        }
      )
      .subscribe((status:any) => {
        console.log(`Subscription status for athlete ${athleteId}:`, status);
      });
    
    return channel;
  }
  
}