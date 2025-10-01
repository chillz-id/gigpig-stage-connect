import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

config({ path: join(__dirname, '..', '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables:')
  console.error('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  console.error('SUPABASE_SERVICE_KEY:', supabaseKey ? 'Set' : 'Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAndFix() {
  console.log('🔍 Checking invoice_items table structure...\n')
  
  try {
    // First, check what columns exist
    const { data: columns, error: columnsError } = await supabase
      .from('invoice_items')
      .select('*')
      .limit(1)
    
    if (columnsError) {
      console.log('Error checking columns:', columnsError)
    } else if (columns && columns.length > 0) {
      console.log('Existing columns in invoice_items:')
      console.log(Object.keys(columns[0]))
    }
    
    // Check if we have any data
    const { data: items, error } = await supabase
      .from('invoice_items')
      .select('*')
    
    if (error) {
      console.error('Error fetching invoice items:', error)
      return
    }
    
    console.log(`\nFound ${items.length} invoice items`)
    
    if (items.length > 0) {
      console.log('\nSample item structure:')
      console.log(JSON.stringify(items[0], null, 2))
      
      // Update subtotal based on existing columns
      const hasRate = 'rate' in items[0]
      const hasUnitPrice = 'unit_price' in items[0]
      const hasPrice = 'price' in items[0]
      
      console.log('\nColumn availability:')
      console.log(`- rate: ${hasRate}`)
      console.log(`- unit_price: ${hasUnitPrice}`)
      console.log(`- price: ${hasPrice}`)
      
      // Update subtotal using the correct column
      if (hasUnitPrice) {
        console.log('\n✅ Using unit_price for subtotal calculation')
        const { error: updateError } = await supabase
          .from('invoice_items')
          .update({ 
            subtotal: items[0].unit_price * (items[0].quantity || 1)
          })
          .is('subtotal', null)
        
        if (updateError) {
          console.error('Update error:', updateError)
        } else {
          console.log('✅ Subtotal updated successfully')
        }
      }
    }
    
    // Now verify the invoice system
    console.log('\n🔍 Running invoice system verification...\n')
    const { execSync } = await import('child_process')
    execSync('npm run test:invoice', { stdio: 'inherit' })
    
  } catch (error) {
    console.error('Error:', error)
  }
}

checkAndFix()