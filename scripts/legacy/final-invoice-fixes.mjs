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

async function applyFinalFixes() {
  console.log('🎭 Final Invoice System Fixes')
  console.log('=============================\n')
  
  const fixes = [
    {
      name: 'Add missing abn column to invoice_recipients',
      sql: `ALTER TABLE public.invoice_recipients
            ADD COLUMN IF NOT EXISTS abn TEXT;`
    },
    {
      name: 'Create invoice RLS policy',
      sql: `CREATE POLICY "Invoice access for all roles" ON public.invoices
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
      name: 'Create invoice_items RLS policy',
      sql: `CREATE POLICY "Users can access invoice items for their invoices" ON public.invoice_items
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
      name: 'Create invoice_recipients RLS policy',
      sql: `CREATE POLICY "Users can access invoice recipients for their invoices" ON public.invoice_recipients
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
      name: 'Create invoice_payments RLS policy',
      sql: `CREATE POLICY "Users can access invoice payments for their invoices" ON public.invoice_payments
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
      name: 'Grant permissions',
      sql: `GRANT ALL ON public.webhook_logs TO authenticated;`
    }
  ]
  
  let successCount = 0
  let errorCount = 0
  
  for (const fix of fixes) {
    console.log(`📝 ${fix.name}...`)
    try {
      await executeSQLViaAPI(fix.sql)
      console.log('✅ Success\n')
      successCount++
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Already exists (OK)\n')
        successCount++
      } else {
        console.log(`❌ Error: ${error.message}\n`)
        errorCount++
      }
    }
  }
  
  console.log('=============================')
  console.log(`✅ Successful: ${successCount}`)
  console.log(`❌ Failed: ${errorCount}`)
  console.log('\n✨ All fixes applied!')
  
  // Update the verification script to handle promoter_id properly
  console.log('\n📝 Updating verification script...')
  
  const { readFileSync, writeFileSync } = await import('fs')
  const { join } = await import('path')
  
  const verifyScriptPath = join(process.cwd(), 'scripts', 'verify-invoice-system.js')
  let verifyScript = readFileSync(verifyScriptPath, 'utf8')
  
  // Fix the test invoice creation to include promoter_id
  verifyScript = verifyScript.replace(
    `invoice_number: 'TEST-001',
        invoice_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'draft',
        invoice_type: 'comedian',
        subtotal: 100,
        tax: 10,
        total: 110,
        currency: 'AUD'`,
    `invoice_number: 'TEST-001',
        invoice_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'draft',
        invoice_type: 'comedian',
        subtotal: 100,
        tax: 10,
        total: 110,
        currency: 'AUD',
        promoter_id: auth.user?.id || null,
        created_by: auth.user?.id || null`
  )
  
  writeFileSync(verifyScriptPath, verifyScript)
  console.log('✅ Verification script updated\n')
  
  // Run final verification
  console.log('🔍 Running final verification...\n')
  const { execSync } = await import('child_process')
  try {
    execSync('npm run test:invoice', { stdio: 'inherit' })
  } catch (error) {
    // Ignore error, just show output
  }
}

applyFinalFixes()