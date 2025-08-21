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

async function checkConstraints() {
  console.log('🔍 Checking invoice table constraints...\n')
  
  try {
    // Check NOT NULL constraints
    const result = await executeSQLViaAPI(`
      SELECT 
        column_name,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'invoices'
      AND is_nullable = 'NO'
      ORDER BY ordinal_position;
    `)
    
    console.log('Required (NOT NULL) columns in invoices table:')
    console.log('==============================================')
    
    if (result.data && result.data.length > 0) {
      result.data.forEach(col => {
        console.log(`- ${col.column_name}${col.column_default ? ' (has default)' : ''}`)
      })
    }
    
    // Check if promoter_id has a NOT NULL constraint
    const promoterCheck = await executeSQLViaAPI(`
      SELECT 
        column_name,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'invoices'
      AND column_name = 'promoter_id';
    `)
    
    console.log('\n\nPromoter ID constraint:')
    console.log('======================')
    if (promoterCheck.data && promoterCheck.data.length > 0) {
      const col = promoterCheck.data[0]
      console.log(`- is_nullable: ${col.is_nullable}`)
      console.log(`- default: ${col.column_default || 'none'}`)
    }
    
    // Remove the NOT NULL constraint from promoter_id
    console.log('\n📝 Making promoter_id nullable...')
    try {
      await executeSQLViaAPI(`
        ALTER TABLE public.invoices 
        ALTER COLUMN promoter_id DROP NOT NULL;
      `)
      console.log('✅ Successfully made promoter_id nullable')
    } catch (error) {
      console.log('⚠️  Error:', error.message)
    }
    
  } catch (error) {
    console.error('Error:', error.message)
  }
}

checkConstraints()