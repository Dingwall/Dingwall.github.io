import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FellowshipService } from '../../../services/fellowship.service';
import { Group, GroupSearchParams } from '../../../models/fellowship-types';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-group-list',
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.scss']
})
export class GroupListComponent implements OnInit, OnDestroy {
  @Input() isMyGroups: boolean = false;
  @Output() groupSelected = new EventEmitter<string>();

  groups: Group[] = [];
  filteredGroups: Group[] = [];
  searchQuery: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  loading: boolean = false;
  error: string = '';
  
  showCreateModal: boolean = false;
  showJoinModal: boolean = false;
  showFilterModal: boolean = false;
  
  createFormData = {
    name: '',
    description: '',
    password: '',
    passwordConfirm: '',
    image: null as File | null,
    imagePreview: ''
  };

  joinFormData = {
    password: ''
  };

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(private fellowshipService: FellowshipService) {}

  ngOnInit(): void {
    this.loadGroups();

    // Debounced search
    this.searchSubject
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(query => {
        this.searchQuery = query;
        this.currentPage = 1;
        this.loadGroups();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  loadGroups(): void {
    this.loading = true;
    this.error = '';

    if (this.isMyGroups) {
      this.fellowshipService.getGroupsByUser()
        .then(groups => {
          this.groups = groups;
          this.applyFiltering();
          this.loading = false;
        })
        .catch(err => {
          console.error('Error loading groups:', err);
          this.error = 'Failed to load groups';
          this.loading = false;
        });
    } else {
      const params: GroupSearchParams = {
        query: this.searchQuery || undefined,
        page: this.currentPage,
        limit: this.pageSize,
        sortBy: 'name',
        sortOrder: 'asc'
      };

      this.fellowshipService.searchAllGroups(params)
        .then(result => {
          this.groups = result.groups;
          this.totalPages = result.totalPages;
          this.applyFiltering();
          this.loading = false;
        })
        .catch(err => {
          console.error('Error searching groups:', err);
          this.error = 'Failed to search groups';
          this.loading = false;
        });
    }
  }

  private applyFiltering(): void {
    if (this.searchQuery && this.isMyGroups) {
      const query = this.searchQuery.toLowerCase();
      this.filteredGroups = this.groups.filter(g =>
        g.name.toLowerCase().includes(query) ||
        (g.description && g.description.toLowerCase().includes(query))
      );
    } else {
      this.filteredGroups = this.groups;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadGroups();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadGroups();
    }
  }

  selectGroup(groupId: string): void {
    this.groupSelected.emit(groupId);
  }

  onImageSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.createFormData.image = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.createFormData.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async createGroup(): Promise<void> {
    if (!this.createFormData.name || !this.createFormData.password) {
      this.error = 'Group name and password are required';
      return;
    }

    if (this.createFormData.password !== this.createFormData.passwordConfirm) {
      this.error = 'Passwords do not match';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const createRequest = {
        name: this.createFormData.name,
        description: this.createFormData.description,
        password: this.createFormData.password,
        group_image_base64: this.createFormData.imagePreview || undefined
      };

      await this.fellowshipService.createGroup(createRequest);
      this.showCreateModal = false;
      this.resetCreateForm();
      this.loadGroups();
    } catch (err) {
      console.error('Error creating group:', err);
      this.error = 'Failed to create group';
    } finally {
      this.loading = false;
    }
  }

  async joinGroup(groupId: string): Promise<void> {
    if (!this.joinFormData.password) {
      this.error = 'Password is required';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      await this.fellowshipService.joinGroup(groupId, this.joinFormData.password);
      this.showJoinModal = false;
      this.joinFormData.password = '';
      
      // Emit the group selection to navigate into it
      this.groupSelected.emit(groupId);
    } catch (err) {
      console.error('Error joining group:', err);
      this.error = 'Failed to join group. Check your password and try again.';
    } finally {
      this.loading = false;
    }
  }

  openCreateModal(): void {
    this.showCreateModal = true;
    this.error = '';
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.resetCreateForm();
    this.error = '';
  }

  openJoinModal(): void {
    this.showJoinModal = true;
    this.error = '';
  }

  closeJoinModal(): void {
    this.showJoinModal = false;
    this.joinFormData.password = '';
    this.error = '';
  }

  private resetCreateForm(): void {
    this.createFormData = {
      name: '',
      description: '',
      password: '',
      passwordConfirm: '',
      image: null,
      imagePreview: ''
    };
  }
}
