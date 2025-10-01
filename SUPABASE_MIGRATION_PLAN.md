# Supabase Migration Plan - Family Helper App

## **1. Database Schema Design**

### **Tables Structure:**

```sql
-- Families table
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  admin_email VARCHAR(255) NOT NULL UNIQUE,
  admin_password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Members table
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  avatar VARCHAR(255),
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'child')),
  theme VARCHAR(50) NOT NULL CHECK (theme IN ('boy', 'girl')),
  text_style VARCHAR(50) NOT NULL CHECK (text_style IN ('kanji', 'hiragana')),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  reward DECIMAL(10,2) NOT NULL DEFAULT 0,
  icon VARCHAR(255),
  category VARCHAR(255),
  daily_limit INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task completions table
CREATE TABLE task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL,
  reward DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Money balances table (FIXED STRUCTURE)
CREATE TABLE money_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  available DECIMAL(10,2) DEFAULT 0,
  allocated DECIMAL(10,2) DEFAULT 0,
  spent DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, member_id)
);

-- Earning records table
CREATE TABLE earning_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  earned_date DATE NOT NULL,
  earned_month VARCHAR(7) NOT NULL, -- YYYY-MM format
  source VARCHAR(50) NOT NULL CHECK (source IN ('task_completion', 'bonus', 'manual')),
  source_id UUID, -- Reference to completion or other source
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'allocated', 'expired')),
  allocated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals table
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0,
  icon VARCHAR(255),
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'achieved', 'paused')),
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Investments table
CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  principal_amount DECIMAL(10,2) NOT NULL,
  current_value DECIMAL(10,2) NOT NULL,
  profit_loss DECIMAL(10,2) DEFAULT 0,
  investment_date DATE NOT NULL,
  investment_type VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Money transactions table
CREATE TABLE money_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL,
  from_category VARCHAR(50),
  to_category VARCHAR(50),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  transaction_date TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## **2. Row Level Security (RLS) Policies**

```sql
-- Enable RLS on all tables
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE earning_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_transactions ENABLE ROW LEVEL SECURITY;

-- Family access policies
CREATE POLICY "Users can access their family data" ON families
  FOR ALL USING (
    id IN (
      SELECT family_id FROM members WHERE id = auth.uid()
    )
  );

-- Member access policies
CREATE POLICY "Users can access family members" ON members
  FOR ALL USING (
    family_id IN (
      SELECT family_id FROM members WHERE id = auth.uid()
    )
  );

-- Apply similar policies for all other tables...
```

## **3. Migration Steps**

### **Phase 1: Setup Supabase**
1. Create Supabase project
2. Run SQL migrations to create tables
3. Set up RLS policies
4. Configure authentication

### **Phase 2: Data Migration**
1. Create data export utility from localStorage
2. Create data import utility to Supabase
3. Handle data transformation (especially MoneyBalance structure)
4. Validate data integrity

### **Phase 3: Code Updates**
1. Install Supabase client
2. Create database service layer
3. Replace localStorage managers with Supabase managers
4. Update error handling
5. Add offline/online sync capabilities

### **Phase 4: Testing & Deployment**
1. Test with development data
2. User acceptance testing
3. Production migration
4. Monitor for issues

## **4. Critical Issues Fixed**

### **✅ MoneyBalance Type Inconsistency**
- Fixed type definition to match implementation
- Aligned all code to use: `available`, `allocated`, `spent`, `total`

### **✅ ID Generation Collision Risk**
- Replaced `Date.now().toString()` with proper UUID generation
- Added UUID utility for consistent ID generation

### **✅ Date Handling Inconsistencies**
- Created date utility functions for consistent date formatting
- Standardized ISO date handling across the app

## **5. Potential Runtime Errors Prevented**

1. **Type Assertion Failures** - Fixed MoneyBalance interface
2. **ID Collisions** - Implemented proper UUID generation
3. **Date Format Inconsistencies** - Standardized date utilities
4. **Property Access Errors** - Aligned types with implementation

## **6. Recommended Next Steps**

1. **Immediate**: Test current fixes with `npm run build` and `npm run typecheck`
2. **Setup**: Create Supabase project and run schema migrations
3. **Development**: Implement Supabase service layer
4. **Testing**: Create migration scripts and validate data integrity
5. **Deployment**: Plan gradual rollout with fallback to localStorage

## **7. Performance Considerations**

- Use Supabase real-time subscriptions for live updates
- Implement caching for frequently accessed data
- Optimize queries with proper indexing
- Consider pagination for large datasets

## **8. Security Considerations**

- Implement proper RLS policies
- Use Supabase Auth for user management
- Validate all inputs on both client and server
- Implement audit logging for sensitive operations

This migration plan addresses the critical type inconsistencies and provides a solid foundation for moving to Supabase while maintaining data integrity and preventing runtime errors.