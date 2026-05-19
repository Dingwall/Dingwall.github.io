-- "Fellowship" App Database Schema
-- Run this in your Supabase SQL Editor to set up the schema
-- Schema name: "Fellowship" (or modify statements below to use public schema)

-- 1. Users Table (linked to Supabase auth.users)
CREATE TABLE "Fellowship".users (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Groups Table
CREATE TABLE "Fellowship".groups (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  password_hash TEXT NOT NULL,
  group_image_base64 TEXT,
  created_by UUID NOT NULL REFERENCES "Fellowship".users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Group Members Table (junction table)
CREATE TABLE "Fellowship".group_members (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES "Fellowship".groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES "Fellowship".users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, user_id)
);

-- 4. Items Table
CREATE TABLE "Fellowship".items (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES "Fellowship".groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES "Fellowship".users(id) ON DELETE CASCADE,
  item_image_base64 TEXT,
  dimensions TEXT,
  weight TEXT,
  value TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'storage')),
  current_holder_id UUID REFERENCES "Fellowship".users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Item History Table
CREATE TABLE "Fellowship".item_history (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES "Fellowship".items(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES "Fellowship".users(id) ON DELETE SET NULL,
  to_user_id UUID REFERENCES "Fellowship".users(id) ON DELETE SET NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  tracking_number TEXT,
  status TEXT DEFAULT 'in_transit' CHECK (status IN ('in_transit', 'delivered')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Shipping Rounds Table
CREATE TABLE "Fellowship".shipping_rounds (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES "Fellowship".groups(id) ON DELETE CASCADE,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID NOT NULL REFERENCES "Fellowship".users(id) ON DELETE CASCADE,
  is_confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Shipping Assignments Table
CREATE TABLE "Fellowship".shipping_assignments (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  shipping_round_id UUID NOT NULL REFERENCES "Fellowship".shipping_rounds(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES "Fellowship".items(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES "Fellowship".users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES "Fellowship".users(id) ON DELETE CASCADE,
  from_confirmed BOOLEAN DEFAULT FALSE,
  to_confirmed BOOLEAN DEFAULT FALSE,
  tracking_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX idx_groups_created_by ON "Fellowship".groups(created_by);
CREATE INDEX idx_group_members_group_id ON "Fellowship".group_members(group_id);
CREATE INDEX idx_group_members_user_id ON "Fellowship".group_members(user_id);
CREATE INDEX idx_items_group_id ON "Fellowship".items(group_id);
CREATE INDEX idx_items_owner_id ON "Fellowship".items(owner_id);
CREATE INDEX idx_items_current_holder ON "Fellowship".items(current_holder_id);
CREATE INDEX idx_item_history_item_id ON "Fellowship".item_history(item_id);
CREATE INDEX idx_shipping_rounds_group_id ON "Fellowship".shipping_rounds(group_id);
CREATE INDEX idx_shipping_assignments_round_id ON "Fellowship".shipping_assignments(shipping_round_id);
CREATE INDEX idx_shipping_assignments_item_id ON "Fellowship".shipping_assignments(item_id);

-- Enable Row-Level Security
ALTER TABLE "Fellowship".users ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Fellowship".groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Fellowship".group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Fellowship".items ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Fellowship".item_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Fellowship".shipping_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Fellowship".shipping_assignments ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Users: Can only view and update own profile
CREATE POLICY "Users can view own profile" ON "Fellowship".users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view group members" ON "Fellowship".users
  FOR SELECT USING (
    id IN (
      SELECT user_id FROM "Fellowship".group_members 
      WHERE group_id IN (
        SELECT group_id FROM "Fellowship".group_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update own profile" ON "Fellowship".users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON "Fellowship".users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Groups: All authenticated users can view, members can update/delete
CREATE POLICY "All authenticated can view groups" ON "Fellowship".groups
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert groups" ON "Fellowship".groups
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Group owner can update" ON "Fellowship".groups
  FOR UPDATE USING (
    created_by = auth.uid() OR 
    auth.uid() IN (SELECT user_id FROM "Fellowship".group_members WHERE group_id = groups.id AND role = 'owner')
  );

CREATE POLICY "Group owner can delete" ON "Fellowship".groups
  FOR DELETE USING (created_by = auth.uid());

-- Group Members: View for group members, manage by owner
CREATE POLICY "Group members can view members" ON "Fellowship".group_members
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM "Fellowship".group_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups" ON "Fellowship".group_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner can manage members" ON "Fellowship".group_members
  FOR UPDATE USING (
    group_id IN (
      SELECT id FROM "Fellowship".groups WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Group owner can remove members" ON "Fellowship".group_members
  FOR DELETE USING (
    group_id IN (
      SELECT id FROM "Fellowship".groups WHERE created_by = auth.uid()
    )
  );

-- Items: Only visible to group members
CREATE POLICY "Group members can view items" ON "Fellowship".items
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM "Fellowship".group_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can create items" ON "Fellowship".items
  FOR INSERT WITH CHECK (
    group_id IN (
      SELECT group_id FROM "Fellowship".group_members 
      WHERE user_id = auth.uid()
    ) AND owner_id = auth.uid()
  );

CREATE POLICY "Group members can update items" ON "Fellowship".items
  FOR UPDATE USING (
    group_id IN (
      SELECT group_id FROM "Fellowship".group_members 
      WHERE user_id = auth.uid()
    )
  );

-- Item History: Visible to group members
CREATE POLICY "Group members can view item history" ON "Fellowship".item_history
  FOR SELECT USING (
    item_id IN (
      SELECT id FROM "Fellowship".items 
      WHERE group_id IN (
        SELECT group_id FROM "Fellowship".group_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Group members can add item history" ON "Fellowship".item_history
  FOR INSERT WITH CHECK (
    item_id IN (
      SELECT id FROM "Fellowship".items 
      WHERE group_id IN (
        SELECT group_id FROM "Fellowship".group_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Shipping Rounds: Visible to group members
CREATE POLICY "Group members can view shipping rounds" ON "Fellowship".shipping_rounds
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM "Fellowship".group_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can create shipping rounds" ON "Fellowship".shipping_rounds
  FOR INSERT WITH CHECK (
    group_id IN (
      SELECT group_id FROM "Fellowship".group_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can update shipping rounds" ON "Fellowship".shipping_rounds
  FOR UPDATE USING (
    group_id IN (
      SELECT group_id FROM "Fellowship".group_members 
      WHERE user_id = auth.uid()
    )
  );

-- Shipping Assignments: Visible to group members
CREATE POLICY "Group members can view assignments" ON "Fellowship".shipping_assignments
  FOR SELECT USING (
    shipping_round_id IN (
      SELECT id FROM "Fellowship".shipping_rounds 
      WHERE group_id IN (
        SELECT group_id FROM "Fellowship".group_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Group members can create assignments" ON "Fellowship".shipping_assignments
  FOR INSERT WITH CHECK (
    shipping_round_id IN (
      SELECT id FROM "Fellowship".shipping_rounds 
      WHERE group_id IN (
        SELECT group_id FROM "Fellowship".group_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Group members can update assignments" ON "Fellowship".shipping_assignments
  FOR UPDATE USING (
    shipping_round_id IN (
      SELECT id FROM "Fellowship".shipping_rounds 
      WHERE group_id IN (
        SELECT group_id FROM "Fellowship".group_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Create UPDATED AT triggers
CREATE OR REPLACE FUNCTION "Fellowship".update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "Fellowship".users
  FOR EACH ROW EXECUTE FUNCTION "Fellowship".update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON "Fellowship".groups
  FOR EACH ROW EXECUTE FUNCTION "Fellowship".update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON "Fellowship".items
  FOR EACH ROW EXECUTE FUNCTION "Fellowship".update_updated_at_column();

CREATE TRIGGER update_item_history_updated_at BEFORE UPDATE ON "Fellowship".item_history
  FOR EACH ROW EXECUTE FUNCTION "Fellowship".update_updated_at_column();

CREATE TRIGGER update_shipping_rounds_updated_at BEFORE UPDATE ON "Fellowship".shipping_rounds
  FOR EACH ROW EXECUTE FUNCTION "Fellowship".update_updated_at_column();

CREATE TRIGGER update_shipping_assignments_updated_at BEFORE UPDATE ON "Fellowship".shipping_assignments
  FOR EACH ROW EXECUTE FUNCTION "Fellowship".update_updated_at_column();
