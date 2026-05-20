import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FellowshipService } from '../../services/fellowship.service';
import { FellowshipUser } from '../../models/fellowship-types';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-fellowship',
  templateUrl: './fellowship.component.html',
  styleUrls: ['./fellowship.component.scss']
})
export class FellowshipComponent implements OnInit, OnDestroy {
  currentUser$ = this.fellowshipService.currentUser$;
  currentTab: string = 'groups';
  selectedGroupId: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fellowshipService: FellowshipService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Combine both URL params and user authentication to avoid race conditions
    combineLatest([
      this.activatedRoute.params,
      this.fellowshipService.currentUser$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([params, user]) => {
        // First priority: if user is not logged in, show login
        if (!user) {
          this.currentTab = 'login';
          this.selectedGroupId = null;
          return;
        }

        // User is logged in, check for groupId in URL
        if (params['groupId']) {
          this.selectedGroupId = params['groupId'];
          this.currentTab = 'group-dashboard';
        } else {
          this.selectedGroupId = null;
          this.currentTab = 'groups';
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setTab(tab: string): void {
    this.currentTab = tab;
    // Clear group ID
    // if (tab !== 'group-dashboard') {
    //   this.selectedGroupId = null;
    //   this.router.navigate(['/fellowship']);
    // }
  }

  navigateTo(tab: string): void {
    this.currentTab = tab;
  }

  enterGroup(groupId: string): void {
    this.router.navigate(['/fellowship', groupId]);
  }

  backFromGroup(): void {
    this.router.navigate(['/fellowship']);
  }

  onAuthSuccess(): void {
    this.currentTab = 'groups';
  }

  onJoinSuccess(): void {
    this.router.navigate(['/fellowship']);
    this.currentTab = 'groups';
  }

  onProfileUpdated(): void {
    // Profile updated, can show a toast/message if needed
  }

  logout(): void {
    this.fellowshipService.signOut();
    this.currentTab = 'login';
  }
}

