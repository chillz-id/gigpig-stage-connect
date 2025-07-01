# P3.1: Vouches System Enhancement

## **🎯 TASK OVERVIEW**
**Priority:** HIGH - Business logic integrity
**Component:** Vouches system
**Current Issue:** Users can give multiple vouches to same comedian

## **🔍 PROBLEM DETAILS**
- A comedian can give multiple vouches to the same person
- Should be limited to one vouch per comedian pair
- Need edit functionality through Vouch History
- Should prevent duplicate vouches with clear error message

## **📁 FILES TO CHECK**
- `src/components/Vouches/` - Vouch components
- `src/pages/VouchHistory.tsx` - Vouch history page
- Vouches-related API calls
- Supabase vouches table schema and constraints

## **✅ ACCEPTANCE CRITERIA**
1. User can give maximum one vouch per comedian
2. Attempting duplicate vouch shows clear error message
3. User can edit existing vouches via Vouch History
4. Vouch history shows all past vouches with edit options
5. Database enforces one-vouch-per-pair constraint
6. Smooth UX for vouch management

## **🔧 TECHNICAL REQUIREMENTS**
1. **Database constraint:**
   ```sql
   -- Add unique constraint to prevent duplicates
   ALTER TABLE vouches 
   ADD CONSTRAINT unique_vouch_pair 
   UNIQUE (giver_id, receiver_id);
   ```

2. **Frontend validation:**
   - Check existing vouches before allowing new ones
   - Show appropriate UI state (edit vs create)
   - Handle constraint violation errors gracefully

3. **Vouch History functionality:**
   - List all vouches given by user
   - Edit functionality for existing vouches
   - Delete functionality if needed
   - Proper permissions and validation

## **📊 DATABASE SCHEMA REQUIREMENTS**
```sql
-- Vouches table structure
CREATE TABLE vouches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  giver_id UUID REFERENCES users(id) NOT NULL,
  receiver_id UUID REFERENCES users(id) NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one vouch per pair
  CONSTRAINT unique_vouch_pair UNIQUE (giver_id, receiver_id),
  -- Prevent self-vouching
  CONSTRAINT no_self_vouch CHECK (giver_id != receiver_id)
);
```

## **🔍 IMPLEMENTATION STRATEGY**
1. **Check existing vouch:**
   ```typescript
   const checkExistingVouch = async (giverId: string, receiverId: string) => {
     const { data } = await supabase
       .from('vouches')
       .select('*')
       .eq('giver_id', giverId)
       .eq('receiver_id', receiverId)
       .single();
     
     return data;
   };
   ```

2. **UI state management:**
   ```typescript
   const [existingVouch, setExistingVouch] = useState(null);
   const [isEditing, setIsEditing] = useState(false);
   
   // Show edit form if vouch exists, create form if not
   ```

3. **Error handling:**
   ```typescript
   try {
     await createVouch(vouchData);
   } catch (error) {
     if (error.code === '23505') { // Unique constraint violation
       setError('You have already vouched for this comedian. Check your Vouch History to edit.');
     }
   }
   ```

## **🎨 UI/UX FLOW**
1. **New vouch attempt:**
   - Check if vouch already exists
   - If exists: Show "Edit Your Vouch" button
   - If not: Show "Give Vouch" form

2. **Vouch History page:**
   - List all vouches with recipient info
   - Edit button for each vouch
   - Filter/search functionality
   - Pagination for large lists

3. **Edit vouch flow:**
   - Pre-populate form with existing data
   - Save updates optimistically
   - Show success confirmation

## **🧪 TESTING INSTRUCTIONS**
1. **Test vouch creation:**
   - Give vouch to comedian A → should succeed
   - Try to give another vouch to comedian A → should show error
   - Verify database constraint works

2. **Test vouch editing:**
   - Navigate to Vouch History
   - Click edit on existing vouch
   - Modify content/rating
   - Save changes → should update successfully

3. **Test edge cases:**
   - Try to vouch for yourself → should prevent
   - Delete existing vouch → should allow new vouch
   - Multiple users vouching for same comedian → should work

4. **Test error handling:**
   - Network errors during vouch creation
   - Database constraint violations
   - Proper error messages displayed

## **📋 DEFINITION OF DONE**
- [ ] Database unique constraint implemented
- [ ] Frontend prevents duplicate vouches
- [ ] Clear error message for duplicate attempts
- [ ] Vouch History page shows all vouches
- [ ] Edit functionality works in Vouch History
- [ ] No self-vouching allowed
- [ ] Proper error handling for all edge cases
- [ ] Mobile-friendly vouch management interface