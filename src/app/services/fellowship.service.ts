import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

import {
  FellowshipUser,
  CreateUserRequest,
  UpdateUserRequest,
  Group,
  GroupWithMembers,
  CreateGroupRequest,
  UpdateGroupRequest,
  GroupMember,
  JoinGroupRequest,
  Item,
  ItemWithDetails,
  CreateItemRequest,
  UpdateItemRequest,
  ItemHistoryEntry,
  CreateItemHistoryRequest,
  ShippingRound,
  CreateShippingRoundRequest,
  ShippingAssignment,
  CreateShippingAssignmentRequest,
  UpdateShippingAssignmentRequest,
  UserDashboard,
  DashboardTask,
  DashboardHistoryEntry,
  ShippingSuggestion,
  ShippingOptions,
  SuggestShippingResponse,
  ShippingWarning,
  GroupSearchParams,
  GroupSearchResult,
  ApiResponse,
  AuthResponse,
} from '../models/fellowship-types';

@Injectable({
  providedIn: 'root'
})
export class FellowshipService {
  private supabase: any;
  private currentUserSubject = new BehaviorSubject<FellowshipUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private currentGroupSubject = new BehaviorSubject<Group | null>(null);
  public currentGroup$ = this.currentGroupSubject.asObservable();

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    this.initializeUser();
  }

  // ============ INITIALIZATION ============

  private async initializeUser(): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (user) {
        const fellowshipUser = await this.getUserProfile(user.id);
        this.currentUserSubject.next(fellowshipUser);
      }
    } catch (error) {
      console.error('Error initializing user:', error);
    }
  }

  // ============ AUTHENTICATION ============

  async signUp(request: CreateUserRequest): Promise<AuthResponse> {
    try {
      // Create auth user
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: request.email,
        password: request.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      // Create fellowship user profile
      const { data, error } = await this.supabase
        .schema('Fellowship')
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email: request.email,
            name: request.name,
            phone: request.phone,
            address: request.address,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      const session = authData.session;
      if (!session) throw new Error('No session returned');

      const fellowshipUser = data as FellowshipUser;
      this.currentUserSubject.next(fellowshipUser);

      return {
        user: fellowshipUser,
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token || '',
          expires_at: session.expires_at || 0,
        }
      };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Sign in failed');

      const fellowshipUser = await this.getUserProfile(data.user.id);
      this.currentUserSubject.next(fellowshipUser);

      if (!data.session) throw new Error('No session returned');

      return {
        user: fellowshipUser,
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token || '',
          expires_at: data.session.expires_at || 0,
        }
      };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
      this.currentUserSubject.next(null);
      this.currentGroupSubject.next(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  getCurrentUserSync(): FellowshipUser | null {
    return this.currentUserSubject.value;
  }

  // ============ USER PROFILE ============

  async getUserProfile(userId: string): Promise<FellowshipUser> {
    try {
      const { data, error } = await this.supabase
        .schema('Fellowship')
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data as FellowshipUser;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(request: UpdateUserRequest): Promise<FellowshipUser> {
    try {
      const currentUser = this.getCurrentUserSync();
      if (!currentUser) throw new Error('No authenticated user');

      const { data, error } = await this.supabase
        .schema('Fellowship')
        .from('users')
        .update(request)
        .eq('id', currentUser.id)
        .select()
        .single();

      if (error) throw error;

      const updatedUser = data as FellowshipUser;
      this.currentUserSubject.next(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // ============ GROUP MANAGEMENT ============

  async createGroup(request: CreateGroupRequest): Promise<Group> {
    try {
      const currentUser = this.getCurrentUserSync();
      if (!currentUser) throw new Error('No authenticated user');

      // Hash password with bcrypt
      const hashedPassword = await this.hashPassword(request.password);

      const { data, error } = await this.supabase
        .schema('Fellowship')
        .from('groups')
        .insert([
          {
            name: request.name,
            description: request.description || null,
            password_hash: hashedPassword,
            password_required: request.password_required !== false, // Default to true
            group_image_base64: request.group_image_base64 || null,
            created_by: currentUser.id,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      const newGroup = data as Group;

      // Add creator as owner to group_members
      await this.supabase
        .schema('Fellowship')
        .from('group_members')
        .insert([
          {
            group_id: newGroup.id,
            user_id: currentUser.id,
            role: 'owner',
            is_active: true,
          }
        ]);

      return newGroup;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }

  async joinGroup(groupId: string, password: string = ''): Promise<GroupMember> {
    try {
      const currentUser = this.getCurrentUserSync();
      if (!currentUser) throw new Error('No authenticated user');

      const { data: { user: authUser }, error: authError } = await this.supabase.auth.getUser();
      if (authError) throw authError;
      if (!authUser) throw new Error('No authenticated session');
      if (authUser.id !== currentUser.id) {
        throw new Error('Authenticated user mismatch');
      }

      // Get group
      const group = await this.getGroupDetails(groupId);

      // Verify password if required
      const requiresPassword = group.password_required !== false;
      if (requiresPassword) {
        if (!password) throw new Error('Password is required for this group');
        const passwordValid = await this.verifyPassword(password, group.password_hash);
        if (!passwordValid) throw new Error('Invalid group password');
      }

      // Add to group_members
      const { data, error } = await this.supabase
        .schema('Fellowship')
        .from('group_members')
        .insert([
          {
            group_id: groupId,
            user_id: authUser.id,
            role: 'member',
            is_active: true,
          }
        ])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          // User already member, just return their membership
          return await this.getGroupMembership(groupId, currentUser.id);
        }
        throw error;
      }

      return data as GroupMember;
    } catch (error) {
      console.error('Error joining group:', error);
      throw error;
    }
  }

  async getGroupDetails(groupId: string): Promise<Group> {
    try {
      const { data, error } = await this.supabase
        .schema('Fellowship')
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (error) throw error;
      return data as Group;
    } catch (error) {
      console.error('Error getting group details:', error);
      throw error;
    }
  }

  async getGroupsByUser(): Promise<Group[]> {
    try {
      const currentUser = this.getCurrentUserSync();
      if (!currentUser) throw new Error('No authenticated user');

      const { data, error } = await this.supabase
        .schema('Fellowship')
        .from('group_members')
        .select('group_id')
        .eq('user_id', currentUser.id);

      if (error) throw error;

      const groupIds = (data as any[]).map(m => m.group_id);
      if (groupIds.length === 0) return [];

      const { data: groups, error: groupError } = await this.supabase
        .schema('Fellowship')
        .from('groups')
        .select('*')
        .in('id', groupIds);

      if (groupError) throw groupError;
      return (groups || []) as Group[];
    } catch (error) {
      console.error('Error getting user groups:', error);
      throw error;
    }
  }

  async searchAllGroups(params: GroupSearchParams): Promise<GroupSearchResult> {
    try {
      let query = this.supabase
        .schema('Fellowship')
        .from('groups')
        .select('*', { count: 'exact' });

      if (params.query) {
        query = query.ilike('name', `%${params.query}%`);
      }

      // Apply sorting
      const sortBy = params.sortBy || 'name';
      const sortOrder = params.sortOrder === 'desc' ? 'desc' : 'asc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const offset = (params.page - 1) * params.limit;
      query = query.range(offset, offset + params.limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      const total = count || 0;
      const totalPages = Math.ceil(total / params.limit);

      return {
        groups: (data || []) as Group[],
        total,
        page: params.page,
        totalPages,
      };
    } catch (error) {
      console.error('Error searching groups:', error);
      throw error;
    }
  }

  async updateGroupInfo(groupId: string, request: UpdateGroupRequest): Promise<Group> {
    try {
      const updateData: any = {};

      if (request.name) updateData.name = request.name;
      if (request.description !== undefined) updateData.description = request.description;
      if (request.group_image_base64 !== undefined) updateData.group_image_base64 = request.group_image_base64;
      if (request.password) {
        updateData.password_hash = await this.hashPassword(request.password);
      }
      if (request.password_required !== undefined) updateData.password_required = request.password_required;

      const { data, error } = await this.supabase
        .schema('Fellowship')
        .from('groups')
        .update(updateData)
        .eq('id', groupId)
        .select()
        .single();

      if (error) throw error;
      return data as Group;
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  }

  async deleteGroup(groupId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .schema('Fellowship')
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  }

  // ============ GROUP MEMBERS ============

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    try {
      const { data, error } = await this.supabase
        .schema('Fellowship')
        .from('group_members')
        .select(`
          *,
          user:user_id (*)
        `)
        .eq('group_id', groupId);

      if (error) throw error;

      return (data || []) as GroupMember[];
    } catch (error) {
      console.error('Error getting group members:', error);
      throw error;
    }
  }

  private async getGroupMembership(groupId: string, userId: string): Promise<GroupMember> {
    try {
      const { data, error } = await this.supabase
        .schema('Fellowship')
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data as GroupMember;
    } catch (error) {
      console.error('Error getting group membership:', error);
      throw error;
    }
  }

  async toggleMemberActive(groupId: string, userId: string, isActive: boolean): Promise<GroupMember> {
    try {
      const { data, error } = await this.supabase
        .schema('Fellowship')
        .from('group_members')
        .update({ is_active: isActive })
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data as GroupMember;
    } catch (error) {
      console.error('Error toggling member active status:', error);
      throw error;
    }
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .schema('Fellowship')
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  }

  // ============ ITEMS ============

  async getGroupItems(groupId: string): Promise<Item[]> {
    try {
      const { data, error } = await this.supabase
        .schema('Fellowship')
        .from('items')
        .select('*')
        .eq('group_id', groupId);

      if (error) throw error;
      return (data || []) as Item[];
    } catch (error) {
      console.error('Error getting group items:', error);
      throw error;
    }
  }

  async getItemDetails(itemId: string): Promise<ItemWithDetails> {
    try {
      const { data, error } = await this.supabase
        .schema('Fellowship')
        .from('items')
        .select(`
          *,
          owner:owner_id (*),
          current_holder:current_holder_id (*)
        `)
        .eq('id', itemId)
        .single();

      if (error) throw error;

      const item = data as any;

      // Get history
      const history = await this.getItemHistory(itemId);

      return {
        ...item,
        history,
      } as ItemWithDetails;
    } catch (error) {
      console.error('Error getting item details:', error);
      throw error;
    }
  }

  async createItem(groupId: string, request: CreateItemRequest): Promise<Item> {
    try {
      const currentUser = this.getCurrentUserSync();
      if (!currentUser) throw new Error('No authenticated user');

      const { data, error } = await this.supabase
        .schema('Fellowship')
        .from('items')
        .insert([
          {
            group_id: groupId,
            name: request.name,
            description: request.description || null,
            owner_id: currentUser.id,
            current_holder_id: currentUser.id,
            item_image_base64: request.item_image_base64 || null,
            dimensions: request.dimensions || null,
            weight: request.weight || null,
            value: request.value || null,
            status: 'active',
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Add initial history entry
      await this.supabase
        .schema('Fellowship')
        .from('item_history')
        .insert([
          {
            item_id: (data as any).id,
            from_user_id: null,
            to_user_id: currentUser.id,
            sent_at: new Date().toISOString(),
            received_at: new Date().toISOString(),
            status: 'delivered',
          }
        ]);

      return (data as any) as Item;
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  }

  async updateItem(itemId: string, request: UpdateItemRequest): Promise<Item> {
    try {
      const updateData: any = {};

      if (request.name) updateData.name = request.name;
      if (request.description !== undefined) updateData.description = request.description;
      if (request.dimensions !== undefined) updateData.dimensions = request.dimensions;
      if (request.weight !== undefined) updateData.weight = request.weight;
      if (request.value !== undefined) updateData.value = request.value;
      if (request.item_image_base64 !== undefined) updateData.item_image_base64 = request.item_image_base64;
      if (request.status) updateData.status = request.status;
      if (request.current_holder_id !== undefined) updateData.current_holder_id = request.current_holder_id;

      const { data, error } = await this.supabase
        .schema('Fellowship')
        .from('items')
        .update(updateData)
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return (data as any) as Item;
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  }

  // ============ ITEM HISTORY ============

  async getItemHistory(itemId: string): Promise<ItemHistoryEntry[]> {
    try {
      const { data, error } = await this.supabase
        .schema('Fellowship')
        .from('item_history')
        .select(`
          *,
          from_user:from_user_id (*),
          to_user:to_user_id (*)
        `)
        .eq('item_id', itemId)
        .order('sent_at', { ascending: true });

      if (error) throw error;
      return (data || []) as ItemHistoryEntry[];
    } catch (error) {
      console.error('Error getting item history:', error);
      throw error;
    }
  }

  async addToItemHistory(itemId: string, request: CreateItemHistoryRequest): Promise<ItemHistoryEntry> {
    try {
      const { data, error } = await this.supabase
        .schema('Fellowship')
        .from('item_history')
        .insert([
          {
            item_id: itemId,
            from_user_id: request.from_user_id || null,
            to_user_id: request.to_user_id || null,
            sent_at: request.sent_at,
            received_at: null,
            tracking_number: request.tracking_number || null,
            status: 'in_transit',
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return (data as any) as ItemHistoryEntry;
    } catch (error) {
      console.error('Error adding to item history:', error);
      throw error;
    }
  }

  // ============ SHIPPING ROUNDS & ASSIGNMENTS ============

  async createShippingRound(groupId: string, request: CreateShippingRoundRequest): Promise<ShippingRound> {
    try {
      const currentUser = this.getCurrentUserSync();
      if (!currentUser) throw new Error('No authenticated user');

      // Create shipping round
      const { data: roundData, error: roundError } = await this.supabase
        .schema('Fellowship')
        .from('shipping_rounds')
        .insert([
          {
            group_id: groupId,
            scheduled_date: request.scheduled_date,
            created_by: currentUser.id,
            is_confirmed: false,
          }
        ])
        .select()
        .single();

      if (roundError) throw roundError;

      const roundId = (roundData as any).id;

      // Create assignments
      const assignmentData = request.assignments.map(a => ({
        shipping_round_id: roundId,
        item_id: a.item_id,
        from_user_id: a.from_user_id,
        to_user_id: a.to_user_id,
        from_confirmed: false,
        to_confirmed: false,
      }));

      const { data: assignments, error: assignError } = await this.supabase
        .schema('Fellowship')
        .from('shipping_assignments')
        .insert(assignmentData)
        .select();

      if (assignError) throw assignError;

      return {
        ...(roundData as any),
        assignments: assignments || [],
      } as ShippingRound;
    } catch (error) {
      console.error('Error creating shipping round:', error);
      throw error;
    }
  }

  async getShippingHistory(groupId: string): Promise<ShippingRound[]> {
    try {
      const { data, error } = await this.supabase
        .schema('Fellowship')
        .from('shipping_rounds')
        .select(`
          *,
          assignments:shipping_assignments (
            *,
            item:item_id (*),
            from_user:from_user_id (*),
            to_user:to_user_id (*)
          )
        `)
        .eq('group_id', groupId)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      return (data || []) as ShippingRound[];
    } catch (error) {
      console.error('Error getting shipping history:', error);
      throw error;
    }
  }

  async getShippingRound(roundId: string): Promise<ShippingRound> {
    try {
      const { data, error } = await this.supabase
        .schema('Fellowship')
        .from('shipping_rounds')
        .select(`
          *,
          assignments:shipping_assignments (
            *,
            item:item_id (*),
            from_user:from_user_id (*),
            to_user:to_user_id (*)
          )
        `)
        .eq('id', roundId)
        .single();

      if (error) throw error;
      return (data as any) as ShippingRound;
    } catch (error) {
      console.error('Error getting shipping round:', error);
      throw error;
    }
  }

  async updateShippingAssignment(assignmentId: string, request: UpdateShippingAssignmentRequest): Promise<ShippingAssignment> {
    try {
      const updateData: any = {};

      if (request.from_user_id) updateData.from_user_id = request.from_user_id;
      if (request.to_user_id) updateData.to_user_id = request.to_user_id;
      if (request.from_confirmed !== undefined) updateData.from_confirmed = request.from_confirmed;
      if (request.to_confirmed !== undefined) updateData.to_confirmed = request.to_confirmed;
      if (request.tracking_number !== undefined) updateData.tracking_number = request.tracking_number;

      const { data, error } = await this.supabase
        .schema('Fellowship')
        .from('shipping_assignments')
        .update(updateData)
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) throw error;
      return (data as any) as ShippingAssignment;
    } catch (error) {
      console.error('Error updating shipping assignment:', error);
      throw error;
    }
  }

  async confirmShipped(assignmentId: string, trackingNumber?: string): Promise<ShippingAssignment> {
    try {
      return await this.updateShippingAssignment(assignmentId, {
        from_confirmed: true,
        tracking_number: trackingNumber,
      });
    } catch (error) {
      console.error('Error confirming shipped:', error);
      throw error;
    }
  }

  async confirmReceived(assignmentId: string): Promise<ShippingAssignment> {
    try {
      return await this.updateShippingAssignment(assignmentId, {
        to_confirmed: true,
      });
    } catch (error) {
      console.error('Error confirming received:', error);
      throw error;
    }
  }

  // ============ DASHBOARD ============

  async getUserDashboard(groupId: string): Promise<UserDashboard> {
    try {
      const currentUser = this.getCurrentUserSync();
      if (!currentUser) throw new Error('No authenticated user');

      // Get active shipping assignments
      const { data: assignments, error: assignError } = await this.supabase
        .schema('Fellowship')
        .from('shipping_rounds')
        .select(`
          scheduled_date,
          assignments:shipping_assignments (
            id,
            item_id,
            from_user_id,
            to_user_id,
            from_confirmed,
            to_confirmed,
            tracking_number,
            item:item_id (*),
            from_user:from_user_id (*),
            to_user:to_user_id (*)
          )
        `)
        .eq('group_id', groupId)
        .eq('is_confirmed', false)
        .order('scheduled_date', { ascending: true });

      if (assignError) throw assignError;

      // Build current tasks
      const currentTasks: DashboardTask[] = [];

      for (const round of (assignments || [])) {
        for (const assignment of round.assignments || []) {
          const asgnData = assignment as any;
          
          // Check if this user needs to ship
          if (asgnData.from_user_id === currentUser.id && !asgnData.from_confirmed) {
            currentTasks.push({
              type: 'ship',
              assignmentId: asgnData.id,
              itemId: asgnData.item_id,
              itemName: asgnData.item?.name,
              itemImage: asgnData.item?.item_image_base64,
              otherUserId: asgnData.to_user_id,
              otherUserName: asgnData.to_user?.name,
              otherUserPhone: asgnData.to_user?.phone,
              otherUserAddress: asgnData.to_user?.address,
              otherUserEmail: asgnData.to_user?.email,
              trackingNumber: asgnData.tracking_number,
              dueDate: round.scheduled_date,
            });
          }

          // Check if this user needs to receive
          if (asgnData.to_user_id === currentUser.id && !asgnData.to_confirmed && asgnData.from_confirmed) {
            currentTasks.push({
              type: 'receive',
              assignmentId: asgnData.id,
              itemId: asgnData.item_id,
              itemName: asgnData.item?.name,
              itemImage: asgnData.item?.item_image_base64,
              otherUserId: asgnData.from_user_id,
              otherUserName: asgnData.from_user?.name,
              otherUserPhone: asgnData.from_user?.phone,
              otherUserAddress: asgnData.from_user?.address,
              otherUserEmail: asgnData.from_user?.email,
              trackingNumber: asgnData.tracking_number,
              dueDate: round.scheduled_date,
            });
          }
        }
      }

      // Get recent history
      const { data: items, error: itemsError } = await this.supabase
        .schema('Fellowship')
        .from('items')
        .select('id')
        .eq('group_id', groupId);

      if (itemsError) throw itemsError;

      const itemIds = (items || []).map((i: any) => i.id);

      let historyData: ItemHistoryEntry[] = [];
      if (itemIds.length > 0) {
        const { data: history, error: historyError } = await this.supabase
          .schema('Fellowship')
          .from('item_history')
          .select(`
            *,
            item:item_id (name),
            from_user:from_user_id (name),
            to_user:to_user_id (name)
          `)
          .in('item_id', itemIds)
          .eq('status', 'delivered')
          .order('received_at', { ascending: false })
          .limit(10);

        if (historyError) throw historyError;
        historyData = (history || []) as ItemHistoryEntry[];
      }

      const recentHistory: DashboardHistoryEntry[] = historyData
        .filter(h => h.from_user_id === currentUser.id || h.to_user_id === currentUser.id)
        .map(h => ({
          itemId: h.item_id,
          itemName: (h as any).item?.name || 'Unknown Item',
          action: h.to_user_id === currentUser.id ? 'received' : 'shipped',
          otherUserName: h.to_user_id === currentUser.id ? (h as any).from_user?.name : (h as any).to_user?.name,
          completedAt: h.received_at || h.sent_at,
          trackingNumber: h.tracking_number,
        }));

      // Get items owned by current user
      const { data: ownedItems, error: ownedError } = await this.supabase
        .schema('Fellowship')
        .from('items')
        .select('*')
        .eq('group_id', groupId)
        .eq('owner_id', currentUser.id);

      if (ownedError) throw ownedError;

      // Get items currently held by current user
      const { data: heldItems, error: heldError } = await this.supabase
        .schema('Fellowship')
        .from('items')
        .select('*')
        .eq('group_id', groupId)
        .eq('current_holder_id', currentUser.id);

      if (heldError) throw heldError;

      return {
        currentTasks,
        recentHistory,
        itemsOwned: (ownedItems || []) as Item[],
        itemsHeld: (heldItems || []) as Item[],
      };
    } catch (error) {
      console.error('Error getting user dashboard:', error);
      throw error;
    }
  }

  // ============ SHIPPING SUGGESTIONS ============

  async suggestShippingAssignments(
    groupId: string,
    shippingDate: string,
    options: ShippingOptions
  ): Promise<SuggestShippingResponse> {
    try {
      // Get all active members
      const members = await this.getGroupMembers(groupId);
      const activeMembers = members.filter(m => m.is_active);

      // Get all active items in group
      const items = await this.getGroupItems(groupId);
      const activeItems = items.filter(i => i.status === 'active');

      const suggestions: ShippingSuggestion[] = [];
      const warnings: ShippingWarning[] = [];

      for (const item of activeItems) {
        // Get item history
        const history = await this.getItemHistory(item.id);

        // Determine who can receive this item
        let eligibleReceivers = activeMembers
          .filter(m => m.user_id !== item.current_holder_id)
          .filter(m => m.role === 'member' || m.role === 'owner');

        // Filter based on allowRepeats option
        if (!options.allowRepeats) {
          const previousHolders = history.map(h => h.to_user_id).filter(uid => uid);
          eligibleReceivers = eligibleReceivers.filter(m => !previousHolders.includes(m.user_id));
        }

        if (eligibleReceivers.length === 0) {
          // If "send to owner" option, send back to owner
          if (options.sendToOwner && item.owner_id !== item.current_holder_id) {
            const owner = activeMembers.find(m => m.user_id === item.owner_id);
            if (owner) {
              const currentHolder = activeMembers.find(m => m.user_id === item.current_holder_id);
              if (currentHolder) {
                suggestions.push({
                  itemId: item.id,
                  itemName: item.name,
                  fromUserId: currentHolder.user_id,
                  fromUserName: (currentHolder.user as any)?.name || 'Unknown',
                  toUserId: owner.user_id,
                  toUserName: (owner.user as any)?.name || 'Unknown',
                  reason: 'Sending back to owner',
                });
              }
            }
          } else {
            warnings.push({
              type: 'item_repeat',
              severity: 'warning',
              message: `Item "${item.name}" has been to all active members. Reset rotation or disable "No Repeats".`,
              itemId: item.id,
            });
          }
          continue;
        }

        // Simple round-robin: pick the first eligible receiver
        const receiver = eligibleReceivers[0];
        const currentHolder = activeMembers.find(m => m.user_id === item.current_holder_id);

        if (currentHolder) {
          suggestions.push({
            itemId: item.id,
            itemName: item.name,
            fromUserId: currentHolder.user_id,
            fromUserName: (currentHolder.user as any)?.name || 'Unknown',
            toUserId: receiver.user_id,
            toUserName: (receiver.user as any)?.name || 'Unknown',
          });
        }
      }

      // Check for warnings
      const recipientCounts = new Map<string, number>();
      suggestions.forEach(s => {
        recipientCounts.set(s.toUserId, (recipientCounts.get(s.toUserId) || 0) + 1);
      });

      recipientCounts.forEach((count, userId) => {
        if (count > 1) {
          const recipient = activeMembers.find(m => m.user_id === userId);
          warnings.push({
            type: 'duplicate_recipient',
            severity: 'warning',
            message: `${(recipient?.user as any)?.name || 'Unknown'} is receiving ${count} items.`,
            toUserId: userId,
          });
        }
      });

      return {
        suggestions,
        warnings,
      };
    } catch (error) {
      console.error('Error suggesting shipping assignments:', error);
      throw error;
    }
  }

  // ============ HELPER FUNCTIONS ============

  private async hashPassword(password: string): Promise<string> {
    // Simple SHA256 hashing using browser's crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await this.hashPassword(password);
    return passwordHash === hash;
  }
}
