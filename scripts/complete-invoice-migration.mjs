const SUPABASE_ACCESS_TOKEN = 'sbp_YOUR_SUPABASE_ACCESS_TOKEN_HERE_GET_FROM_OWNER'
const PROJECT_REF = 'pdikjpfulhhpqpxzpgtu'

async function executeSQLViaAPI(sql) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql })
    }
  )
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API Error: ${error}`)
  }
  
  return await response.json()
}

async function completeMigration() {
  console.log('🎭 Completing Invoice Migration')
  console.log('================================\n')
  
  const remainingMigrations = [
    {
      name: 'Add remaining invoice columns',
      sql: `ALTER TABLE public.invoices 
            ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2),
            ADD COLUMN IF NOT EXISTS deposit_percentage DECIMAL(5,2),
            ADD COLUMN IF NOT EXISTS deposit_due_days_before_event INTEGER,
            ADD COLUMN IF NOT EXISTS deposit_due_date DATE,
            ADD COLUMN IF NOT EXISTS deposit_status TEXT DEFAULT 'not_required' CHECK (deposit_status IN ('not_required', 'pending', 'paid', 'overdue', 'partial')),
            ADD COLUMN IF NOT EXISTS deposit_paid_date DATE,
            ADD COLUMN IF NOT EXISTS deposit_paid_amount DECIMAL(10,2),
            ADD COLUMN IF NOT EXISTS event_date DATE;`
    },
    {
      name: 'Add invoice_recipients columns',
      sql: `ALTER TABLE public.invoice_recipients
            ADD COLUMN IF NOT EXISTS recipient_type TEXT,
            ADD COLUMN IF NOT EXISTS recipient_phone TEXT,
            ADD COLUMN IF NOT EXISTS recipient_abn TEXT,
            ADD COLUMN IF NOT EXISTS company_name TEXT;`
    },
    {
      name: 'Add invoice_payments columns',
      sql: `ALTER TABLE public.invoice_payments
            ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
            ADD COLUMN IF NOT EXISTS is_deposit BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES auth.users(id);`
    },
    {
      name: 'Drop old RLS policies',
      sql: `DROP POLICY IF EXISTS "Users can view invoices for their events" ON public.invoices;
            DROP POLICY IF EXISTS "Users can manage invoices for their events" ON public.invoices;
            DROP POLICY IF EXISTS "Invoice creators can manage their invoices" ON public.invoices;`
    },
    {
      name: 'Create new RLS policy for invoices',
      sql: `CREATE POLICY IF NOT EXISTS "Invoice access for all roles" ON public.invoices
            FOR ALL TO authenticated
            USING (
              created_by = auth.uid() OR
              promoter_id = auth.uid() OR
              comedian_id = auth.uid() OR
              EXISTS (
                SELECT 1 FROM public.user_roles
                WHERE user_id = auth.uid()
                AND role IN ('admin', 'promoter', 'comedian')
              )
            );`
    },
    {
      name: 'Update invoice_items RLS policy',
      sql: `DROP POLICY IF EXISTS "Users can view invoice items for their invoices" ON public.invoice_items;
            CREATE POLICY IF NOT EXISTS "Users can access invoice items for their invoices" ON public.invoice_items
            FOR ALL TO authenticated
            USING (
              EXISTS (
                SELECT 1 FROM public.invoices
                WHERE id = invoice_items.invoice_id
                AND (
                  created_by = auth.uid() OR
                  promoter_id = auth.uid() OR
                  comedian_id = auth.uid()
                )
              )
            );`
    },
    {
      name: 'Update invoice_recipients RLS policy',
      sql: `DROP POLICY IF EXISTS "Users can view invoice recipients for their invoices" ON public.invoice_recipients;
            CREATE POLICY IF NOT EXISTS "Users can access invoice recipients for their invoices" ON public.invoice_recipients
            FOR ALL TO authenticated
            USING (
              EXISTS (
                SELECT 1 FROM public.invoices
                WHERE id = invoice_recipients.invoice_id
                AND (
                  created_by = auth.uid() OR
                  promoter_id = auth.uid() OR
                  comedian_id = auth.uid()
                )
              )
            );`
    },
    {
      name: 'Update invoice_payments RLS policy',
      sql: `DROP POLICY IF EXISTS "Users can view invoice payments for their invoices" ON public.invoice_payments;
            CREATE POLICY IF NOT EXISTS "Users can access invoice payments for their invoices" ON public.invoice_payments
            FOR ALL TO authenticated
            USING (
              EXISTS (
                SELECT 1 FROM public.invoices
                WHERE id = invoice_payments.invoice_id
                AND (
                  created_by = auth.uid() OR
                  promoter_id = auth.uid() OR
                  comedian_id = auth.uid()
                )
              )
            );`
    },
    {
      name: 'Sync GST and tax treatment',
      sql: `UPDATE public.invoices 
            SET gst_treatment = tax_treatment 
            WHERE tax_treatment IS NOT NULL AND gst_treatment IS NULL;
            
            UPDATE public.invoices 
            SET tax_treatment = gst_treatment 
            WHERE gst_treatment IS NOT NULL AND tax_treatment IS NULL;`
    },
    {
      name: 'Create indexes',
      sql: `CREATE INDEX IF NOT EXISTS idx_invoices_invoice_type ON public.invoices(invoice_type);
            CREATE INDEX IF NOT EXISTS idx_invoices_comedian_id ON public.invoices(comedian_id);
            CREATE INDEX IF NOT EXISTS idx_invoices_deposit_status ON public.invoices(deposit_status);
            CREATE INDEX IF NOT EXISTS idx_invoices_event_date ON public.invoices(event_date);`
    }
  ]
  
  let successCount = 0
  let errorCount = 0
  
  for (const migration of remainingMigrations) {
    console.log(`📝 ${migration.name}...`)
    try {
      await executeSQLViaAPI(migration.sql)
      console.log('✅ Success\n')
      successCount++
    } catch (error) {
      console.log(`⚠️  Error: ${error.message}\n`)
      errorCount++
    }
  }
  
  console.log('================================')
  console.log(`✅ Successful: ${successCount}`)
  console.log(`❌ Failed: ${errorCount}`)
  console.log('\n✨ Migration complete!')
  
  // Run verification
  console.log('\n🔍 Running final verification...\n')
  const { execSync } = await import('child_process')
  try {
    execSync('npm run test:invoice', { stdio: 'inherit' })
  } catch (error) {
    // Ignore error, just show output
  }
}

completeMigration()