import { Injectable } from '@angular/core';
import { createClient, User } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  readonly client = createClient(environment.supabaseUrl, environment.supabaseKey);
}