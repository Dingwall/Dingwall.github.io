import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FellowshipService } from '../../../services/fellowship.service';
import { FellowshipUser } from '../../../models/fellowship-types';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-account-edit',
  templateUrl: './account-edit.component.html',
  styleUrls: ['./account-edit.component.scss']
})
export class AccountEditComponent implements OnInit, OnDestroy {
  @Output() profileUpdated = new EventEmitter<void>();

  formData = {
    name: '',
    phone: '',
    address: ''
  };
  loading: boolean = false;
  error: string = '';
  success: string = '';
  private destroy$ = new Subject<void>();

  constructor(private fellowshipService: FellowshipService) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUserProfile(): void {
    this.fellowshipService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.formData = {
            name: user.name || '',
            phone: user.phone || '',
            address: user.address || ''
          };
        }
      });
  }

  async saveProfile(): Promise<void> {
    this.loading = true;
    this.error = '';
    this.success = '';

    try {
      await this.fellowshipService.updateUserProfile(this.formData);
      this.success = 'Profile updated successfully!';
      this.profileUpdated.emit();

      setTimeout(() => {
        this.success = '';
      }, 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      this.error = err.message || 'Failed to update profile';
    } finally {
      this.loading = false;
    }
  }
}
