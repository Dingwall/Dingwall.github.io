/**
 * Fellowship App Type Definitions
 * All database models and API response types
 */

// ============ USER TYPES ============

export interface FellowshipUser {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  address: string;
}

export interface UpdateUserRequest {
  name?: string;
  phone?: string;
  address?: string;
}

// ============ GROUP TYPES ============

export interface Group {
  id: string;
  name: string;
  description?: string;
  password_hash: string;
  group_image_base64?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GroupWithMembers extends Group {
  members?: GroupMember[];
  memberCount?: number;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  password: string;
  group_image_base64?: string;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  group_image_base64?: string;
  password?: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
  is_active: boolean;
  role: 'owner' | 'member';
  created_at: string;
  user?: FellowshipUser; // populated on some queries
}

export interface JoinGroupRequest {
  password: string;
}

// ============ ITEM TYPES ============

export interface Item {
  id: string;
  group_id: string;
  name: string;
  description?: string;
  owner_id: string;
  item_image_base64?: string;
  dimensions?: string;
  weight?: string;
  value?: string;
  status: 'active' | 'storage';
  current_holder_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ItemWithDetails extends Item {
  owner?: FellowshipUser;
  current_holder?: FellowshipUser;
  history?: ItemHistoryEntry[];
}

export interface CreateItemRequest {
  name: string;
  description?: string;
  dimensions?: string;
  weight?: string;
  value?: string;
  item_image_base64?: string;
}

export interface UpdateItemRequest {
  name?: string;
  description?: string;
  dimensions?: string;
  weight?: string;
  value?: string;
  item_image_base64?: string;
  status?: 'active' | 'storage';
  current_holder_id?: string;
}

// ============ ITEM HISTORY TYPES ============

export interface ItemHistoryEntry {
  id: string;
  item_id: string;
  from_user_id?: string;
  to_user_id?: string;
  sent_at: string;
  received_at?: string;
  tracking_number?: string;
  status: 'in_transit' | 'delivered';
  created_at: string;
  updated_at: string;
  from_user?: FellowshipUser;
  to_user?: FellowshipUser;
}

export interface CreateItemHistoryRequest {
  from_user_id?: string;
  to_user_id?: string;
  sent_at: string;
  tracking_number?: string;
}

// ============ SHIPPING TYPES ============

export interface ShippingRound {
  id: string;
  group_id: string;
  scheduled_date: string;
  created_by: string;
  is_confirmed: boolean;
  created_at: string;
  updated_at: string;
  assignments?: ShippingAssignment[];
}

export interface CreateShippingRoundRequest {
  scheduled_date: string;
  assignments: CreateShippingAssignmentRequest[];
}

export interface ShippingAssignment {
  id: string;
  shipping_round_id: string;
  item_id: string;
  from_user_id: string;
  to_user_id: string;
  from_confirmed: boolean;
  to_confirmed: boolean;
  tracking_number?: string;
  created_at: string;
  updated_at: string;
  item?: Item;
  from_user?: FellowshipUser;
  to_user?: FellowshipUser;
}

export interface CreateShippingAssignmentRequest {
  item_id: string;
  from_user_id: string;
  to_user_id: string;
}

export interface UpdateShippingAssignmentRequest {
  from_user_id?: string;
  to_user_id?: string;
  from_confirmed?: boolean;
  to_confirmed?: boolean;
  tracking_number?: string;
}

// ============ DASHBOARD TYPES ============

export interface UserDashboard {
  currentTasks: DashboardTask[];
  recentHistory: DashboardHistoryEntry[];
  itemsOwned: Item[];
  itemsHeld: Item[];
}

export interface DashboardTask {
  type: 'ship' | 'receive';
  assignmentId: string;
  itemId: string;
  itemName: string;
  itemImage?: string;
  otherUserId: string;
  otherUserName: string;
  otherUserPhone?: string;
  otherUserAddress?: string;
  otherUserEmail: string;
  trackingNumber?: string;
  dueDate?: string;
}

export interface DashboardHistoryEntry {
  itemId: string;
  itemName: string;
  action: 'shipped' | 'received';
  otherUserName: string;
  completedAt: string;
  trackingNumber?: string;
}

// ============ SHIPPING SUGGESTION TYPES ============

export interface ShippingSuggestion {
  itemId: string;
  itemName: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  reason?: string;
}

export interface ShippingOptions {
  allowRepeats: boolean;
  optimizeRoute: boolean;
  sendToOwner: boolean;
}

export interface SuggestShippingResponse {
  suggestions: ShippingSuggestion[];
  warnings: ShippingWarning[];
}

export interface ShippingWarning {
  type: 'duplicate_recipient' | 'item_repeat' | 'inactive_member';
  severity: 'info' | 'warning' | 'error';
  message: string;
  itemId?: string;
  toUserId?: string;
}

// ============ API RESPONSE TYPES ============

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AuthResponse {
  user: FellowshipUser;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

// ============ SEARCH/FILTER TYPES ============

export interface GroupSearchParams {
  query?: string;
  page: number;
  limit: number;
  sortBy?: 'name' | 'created_at' | 'members';
  sortOrder?: 'asc' | 'desc';
}

export interface GroupSearchResult {
  groups: Group[];
  total: number;
  page: number;
  totalPages: number;
}
