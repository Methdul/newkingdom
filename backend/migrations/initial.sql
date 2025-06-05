-- FitZone Pro initial database schema
-- Enable uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Gym locations
CREATE TABLE IF NOT EXISTS gym_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    phone TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Membership plans
CREATE TABLE IF NOT EXISTS membership_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT,
    description TEXT,
    price NUMERIC(10,2) DEFAULT 0,
    duration_months INTEGER NOT NULL,
    features JSONB DEFAULT '[]',
    benefits JSONB DEFAULT '[]',
    max_gym_visits INTEGER,
    max_guest_passes INTEGER DEFAULT 0,
    includes_personal_training BOOLEAN DEFAULT FALSE,
    includes_group_classes BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 1,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Members
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    gym_location_id UUID REFERENCES gym_locations(id),
    current_plan_id UUID REFERENCES membership_plans(id),
    member_number TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT,
    membership_status TEXT,
    membership_start_date DATE,
    membership_end_date DATE,
    auto_renewal BOOLEAN DEFAULT FALSE,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Membership history
CREATE TABLE IF NOT EXISTS membership_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id),
    plan_id UUID REFERENCES membership_plans(id),
    start_date DATE,
    end_date DATE,
    amount NUMERIC(10,2),
    payment_id UUID,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id),
    plan_id UUID REFERENCES membership_plans(id),
    gym_location_id UUID REFERENCES gym_locations(id),
    amount NUMERIC(10,2),
    total_amount NUMERIC(10,2),
    payment_date DATE,
    payment_method TEXT,
    payment_status TEXT,
    invoice_number TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check-ins
CREATE TABLE IF NOT EXISTS check_ins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id),
    gym_location_id UUID REFERENCES gym_locations(id),
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Promotions
CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    title TEXT,
    description TEXT,
    discount_type TEXT,
    discount_value NUMERIC(10,2),
    start_date DATE,
    end_date DATE,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    applicable_plans JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    gym_location_id UUID REFERENCES gym_locations(id),
    role TEXT,
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Member goals
CREATE TABLE IF NOT EXISTS member_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id),
    goal TEXT,
    target_value NUMERIC,
    current_value NUMERIC,
    start_date DATE,
    end_date DATE,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

