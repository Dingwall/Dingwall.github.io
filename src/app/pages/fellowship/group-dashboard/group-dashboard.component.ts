import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FellowshipService } from '../../../services/fellowship.service';
import {
  UserDashboard,
  Group,
  Item,
  ItemWithDetails,
  GroupMember,
  DashboardTask,
  FellowshipUser,
  CreateItemRequest,
  ShippingOptions,
  SuggestShippingResponse,
  ShippingSuggestion,
} from '../../../models/fellowship-types';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-group-dashboard',
  templateUrl: './group-dashboard.component.html',
  styleUrls: ['./group-dashboard.component.scss']
})
export class GroupDashboardComponent implements OnInit, OnDestroy {
  @Input() groupId: string | null = null;
  @Output() back = new EventEmitter<void>();

  // Tab management
  currentTab: string = 'dashboard';

  // Data
  group: Group | null = null;
  // dashboard: UserDashboard | null = null;
  dashboard: any;
  items: Item[] = [];
  members: GroupMember[] = [];
  currentUser: FellowshipUser | null = null;

  // UI State
  loading: boolean = false;
  error: string = '';
  success: string = '';
  showAddItemModal: boolean = false;
  showEditItemModal: boolean = false;
  showShippingPlanner: boolean = false;

  // Selected items
  selectedItem: Item | null = null;
  itemHistory: any[] = [];

  // Form data
  itemFormData = {
    name: '',
    description: '',
    dimensions: '',
    weight: '',
    value: '',
    image: null as File | null,
    imagePreview: ''
  };

  shippingOptions: ShippingOptions = {
    allowRepeats: false,
    optimizeRoute: false,
    sendToOwner: false
  };

  // shippingSuggestions: SuggestShippingResponse | null = null;
  shippingSuggestions: any = null;
  shippingDate: string = new Date().toISOString().split('T')[0];

  private destroy$ = new Subject<void>();

  constructor(
    private fellowshipService: FellowshipService,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // this.activatedRoute.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
    //   if (params['groupId']) {
    //       this.groupId = params['groupId'];
    //   }
    // });
    if (this.groupId) {
      this.loadData();
      
      this.fellowshipService.currentUser$
        .pipe(takeUntil(this.destroy$))
        .subscribe(user => {
          this.currentUser = user;
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): Promise<void> {
    if (!this.groupId) return Promise.resolve();

    this.loading = true;
    this.error = '';

    return Promise.all([
      this.fellowshipService.getGroupDetails(this.groupId).then(g => this.group = g),
      this.fellowshipService.getUserDashboard(this.groupId).then(d => this.dashboard = d),
      this.fellowshipService.getGroupItems(this.groupId).then(i => this.items = i),
      this.fellowshipService.getGroupMembers(this.groupId).then(m => this.members = m)
    ])
      .then(() => {
        this.loading = false;
      })
      .catch(err => {
        console.error('Error loading dashboard:', err);
        this.error = 'Failed to load group data';
        this.loading = false;
      });
  }

  setTab(tab: string): void {
    this.currentTab = tab;
  }

  goBack(): void {
    this.back.emit();
  }

  // ========== DASHBOARD TAB ==========

  getTasksForType(type: 'ship' | 'receive'): DashboardTask[] {
    return (this.dashboard?.currentTasks || []).filter((t: any) => t.type === type);
  }

  async confirmShipped(task: DashboardTask, trackingNumber: string = ''): Promise<void> {
    this.loading = true;
    try {
      await this.fellowshipService.confirmShipped(task.assignmentId, trackingNumber);
      this.success = 'Shipment confirmed!';
      await this.loadData();
      setTimeout(() => this.success = '', 3000);
    } catch (err) {
      console.error('Error confirming shipped:', err);
      this.error = 'Failed to confirm shipment';
    } finally {
      this.loading = false;
    }
  }

  async confirmReceived(task: DashboardTask): Promise<void> {
    this.loading = true;
    try {
      await this.fellowshipService.confirmReceived(task.assignmentId);
      this.success = 'Receipt confirmed!';
      await this.loadData();
      setTimeout(() => this.success = '', 3000);
    } catch (err) {
      console.error('Error confirming received:', err);
      this.error = 'Failed to confirm receipt';
    } finally {
      this.loading = false;
    }
  }

  // ========== ITEMS TAB ==========

  openAddItemModal(): void {
    this.showAddItemModal = true;
    this.resetItemForm();
  }

  closeAddItemModal(): void {
    this.showAddItemModal = false;
    this.resetItemForm();
  }

  onItemImageSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.itemFormData.image = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.itemFormData.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async createItem(): Promise<void> {
    if (!this.itemFormData.name || !this.groupId) {
      this.error = 'Item name is required';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const createRequest: CreateItemRequest = {
        name: this.itemFormData.name,
        description: this.itemFormData.description,
        dimensions: this.itemFormData.dimensions,
        weight: this.itemFormData.weight,
        value: this.itemFormData.value,
        item_image_base64: this.itemFormData.imagePreview
      };

      await this.fellowshipService.createItem(this.groupId, createRequest);
      this.success = 'Item created successfully!';
      this.closeAddItemModal();
      await this.loadData();
      setTimeout(() => this.success = '', 3000);
    } catch (err) {
      console.error('Error creating item:', err);
      this.error = 'Failed to create item';
    } finally {
      this.loading = false;
    }
  }

  async toggleItemStatus(item: Item): Promise<void> {
    const newStatus = item.status === 'active' ? 'storage' : 'active';
    this.loading = true;

    try {
      await this.fellowshipService.updateItem(item.id, { status: newStatus });
      this.success = `Item moved to ${newStatus}`;
      await this.loadData();
      setTimeout(() => this.success = '', 3000);
    } catch (err) {
      console.error('Error updating item:', err);
      this.error = 'Failed to update item';
    } finally {
      this.loading = false;
    }
  }

  async toggleMemberActive(member: GroupMember): Promise<void> {
    if (!this.groupId) return;

    this.loading = true;
    try {
      await this.fellowshipService.toggleMemberActive(this.groupId, member.user_id, !member.is_active);
      this.success = `Member ${!member.is_active ? 'activated' : 'deactivated'}`;
      await this.loadData();
      setTimeout(() => this.success = '', 3000);
    } catch (err) {
      console.error('Error toggling member status:', err);
      this.error = 'Failed to update member status';
    } finally {
      this.loading = false;
    }
  }

  // ========== ITEM DETAIL & EDIT ==========

  async openItemDetail(item: Item): Promise<void> {
    this.selectedItem = item;
    this.currentTab = 'item-detail';
    this.loading = true;
    
    try {
      this.itemHistory = await this.fellowshipService.getItemHistory(item.id);
    } catch (err) {
      console.error('Error loading item history:', err);
      this.itemHistory = [];
    } finally {
      this.loading = false;
    }
  }

  closeItemDetail(): void {
    this.selectedItem = null;
    this.itemHistory = [];
    this.currentTab = 'items';
  }

  openEditItemModal(item: Item): void {
    this.selectedItem = item;
    this.itemFormData = {
      name: item.name,
      description: item.description || '',
      dimensions: item.dimensions || '',
      weight: item.weight || '',
      value: item.value || '',
      image: null,
      imagePreview: item.item_image_base64 || ''
    };
    this.showEditItemModal = true;
  }

  closeEditItemModal(): void {
    this.showEditItemModal = false;
    this.selectedItem = null;
    this.resetItemForm();
  }

  onEditItemImageSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.itemFormData.image = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.itemFormData.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async saveItemEdit(): Promise<void> {
    if (!this.selectedItem || !this.itemFormData.name) {
      this.error = 'Item name is required';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      await this.fellowshipService.updateItem(this.selectedItem.id, {
        name: this.itemFormData.name,
        description: this.itemFormData.description,
        dimensions: this.itemFormData.dimensions,
        weight: this.itemFormData.weight,
        value: this.itemFormData.value,
        item_image_base64: this.itemFormData.imagePreview,
      });
      
      this.success = 'Item updated successfully!';
      this.closeEditItemModal();
      await this.loadData();
      setTimeout(() => this.success = '', 3000);
    } catch (err) {
      console.error('Error updating item:', err);
      this.error = 'Failed to update item';
    } finally {
      this.loading = false;
    }
  }

  private resetItemForm(): void {
    this.itemFormData = {
      name: '',
      description: '',
      dimensions: '',
      weight: '',
      value: '',
      image: null,
      imagePreview: ''
    };
  }

  // ========== SHIPPING PLANNER ==========

  openShippingPlanner(): void {
    this.showShippingPlanner = true;
    this.generateSuggestions();
  }

  closeShippingPlanner(): void {
    this.showShippingPlanner = false;
    this.shippingSuggestions = null;
  }

  async generateSuggestions(): Promise<void> {
    if (!this.groupId) return;

    this.loading = true;
    try {
      this.shippingSuggestions = await this.fellowshipService.suggestShippingAssignments(
        this.groupId,
        this.shippingDate,
        this.shippingOptions
      );
    } catch (err) {
      console.error('Error generating suggestions:', err);
      this.error = 'Failed to generate shipping suggestions';
    } finally {
      this.loading = false;
    }
  }

  async confirmShippingRound(): Promise<void> {
    if (!this.groupId || !this.shippingSuggestions) return;

    this.loading = true;
    try {
      const assignments = this.shippingSuggestions.suggestions.map((s:any) => ({
        item_id: s.itemId,
        from_user_id: s.fromUserId,
        to_user_id: s.toUserId,
      }));

      await this.fellowshipService.createShippingRound(this.groupId, {
        scheduled_date: this.shippingDate,
        assignments
      });

      this.success = 'Shipping round created!';
      this.closeShippingPlanner();
      await this.loadData();
      setTimeout(() => this.success = '', 3000);
    } catch (err) {
      console.error('Error creating shipping round:', err);
      this.error = 'Failed to create shipping round';
    } finally {
      this.loading = false;
    }
  }

  isGroupOwner(): boolean {
    if (!this.currentUser || !this.members) return false;
    const membership = this.members.find(m => m.user_id === this.currentUser!.id);
    return membership?.role === 'owner';
  }
}
