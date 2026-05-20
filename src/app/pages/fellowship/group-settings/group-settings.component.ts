import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FellowshipService } from '../../../services/fellowship.service';
import { Group, GroupMember, UpdateGroupRequest } from '../../../models/fellowship-types';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-group-settings',
  templateUrl: './group-settings.component.html',
  styleUrls: ['./group-settings.component.scss']
})
export class GroupSettingsComponent implements OnInit, OnDestroy {
  @Input() groupId: string | null = null;
  @Output() groupUpdated = new EventEmitter<void>();

  group: Group | null = null;
  members: GroupMember[] = [];

  formData = {
    name: '',
    description: '',
    passwordRequired: true,
    newPassword: '',
    newPasswordConfirm: '',
    image: null as File | null,
    imagePreview: ''
  };

  loading: boolean = false;
  error: string = '';
  success: string = '';
  showDeleteConfirm: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(private fellowshipService: FellowshipService) {}

  ngOnInit(): void {
    if (this.groupId) {
      this.loadGroupData();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadGroupData(): void {
    if (!this.groupId) return;

    Promise.all([
      this.fellowshipService.getGroupDetails(this.groupId).then(g => {
        this.group = g;
        this.formData = {
          ...this.formData,
          name: g.name,
          description: g.description || '',
          passwordRequired: g.password_required,
          image: null,
          imagePreview: g.group_image_base64 || ''
        };
      }),
      this.fellowshipService.getGroupMembers(this.groupId).then(m => {
        this.members = m;
      })
    ]).catch(err => {
      console.error('Error loading group data:', err);
      this.error = 'Failed to load group data';
    });
  }

  onImageSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.formData.image = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.formData.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async saveGroupInfo(): Promise<void> {
    if (!this.groupId || !this.formData.name) {
      this.error = 'Group name is required';
      return;
    }

    if (this.formData.newPassword && this.formData.newPassword !== this.formData.newPasswordConfirm) {
      this.error = 'Passwords do not match';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const updateRequest: UpdateGroupRequest = {
        name: this.formData.name,
        description: this.formData.description,
        group_image_base64: this.formData.imagePreview,
        password_required: this.formData.passwordRequired,
      };

      if (this.formData.newPassword) {
        updateRequest.password = this.formData.newPassword;
      }

      await this.fellowshipService.updateGroupInfo(this.groupId, updateRequest);
      this.success = 'Group settings updated!';
      this.formData.newPassword = '';
      this.formData.newPasswordConfirm = '';
      this.loadGroupData();
      this.groupUpdated.emit();

      setTimeout(() => this.success = '', 3000);
    } catch (err) {
      console.error('Error updating group:', err);
      this.error = 'Failed to update group settings';
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
      this.loadGroupData();
      setTimeout(() => this.success = '', 3000);
    } catch (err) {
      console.error('Error toggling member status:', err);
      this.error = 'Failed to update member status';
    } finally {
      this.loading = false;
    }
  }

  async removeMember(member: GroupMember): Promise<void> {
    if (!this.groupId) return;

    if (!confirm(`Remove ${(member.user as any)?.name || 'this member'} from the group?`)) {
      return;
    }

    this.loading = true;
    try {
      await this.fellowshipService.removeMember(this.groupId, member.user_id);
      this.success = 'Member removed';
      this.loadGroupData();
      setTimeout(() => this.success = '', 3000);
    } catch (err) {
      console.error('Error removing member:', err);
      this.error = 'Failed to remove member';
    } finally {
      this.loading = false;
    }
  }

  async deleteGroup(): Promise<void> {
    if (!this.groupId) return;

    if (!confirm('Are you sure you want to delete this group? This cannot be undone.')) {
      return;
    }

    this.loading = true;
    try {
      await this.fellowshipService.deleteGroup(this.groupId);
      this.success = 'Group deleted';
      setTimeout(() => this.groupUpdated.emit(), 1000);
    } catch (err) {
      console.error('Error deleting group:', err);
      this.error = 'Failed to delete group';
    } finally {
      this.loading = false;
    }
  }
}
