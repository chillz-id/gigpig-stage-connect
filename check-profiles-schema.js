import { createClient } from '@supabase/supabase-js';

// Database configuration
const supabaseUrl = 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI2Njg2MSwiZXhwIjoyMDY1ODQyODYxfQ.RS6RG0nbmxEqtO99dnpGnd7WV7C_uI0l_XJugKqOzPE';

// Create Supabase client with service key
const supabase = createClient(supabaseUrl, serviceKey);

async function checkProfilesSchema() {
  console.log('Checking profiles table schema...\n');

  try {
    // Query 1: Get column information from information_schema
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles')
      .order('ordinal_position');

    if (columnsError) {
      console.error('Error fetching column information:', columnsError);
      
      // Fallback: Try a different approach
      console.log('\nTrying alternative method...');
      
      // Get a sample row to see the structure
      const { data: sampleRow, error: sampleError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.error('Error fetching sample row:', sampleError);
      } else if (sampleRow && sampleRow.length > 0) {
        console.log('\nSample row columns:');
        console.log(Object.keys(sampleRow[0]));
      }
    } else {
      console.log('Profiles table columns:');
      console.log('=====================================');
      
      columns.forEach(col => {
        console.log(`Column: ${col.column_name}`);
        console.log(`  Type: ${col.data_type}`);
        console.log(`  Nullable: ${col.is_nullable}`);
        console.log(`  Default: ${col.column_default || 'none'}`);
        console.log('');
      });
      
      // Check for specific columns
      const hasFirstName = columns.some(col => col.column_name === 'first_name');
      const hasLastName = columns.some(col => col.column_name === 'last_name');
      
      console.log('Column existence check:');
      console.log('=====================');
      console.log(`first_name exists: ${hasFirstName ? 'YES' : 'NO'}`);
      console.log(`last_name exists: ${hasLastName ? 'YES' : 'NO'}`);
    }

    // Query 2: Check table constraints
    const { data: constraints, error: constraintsError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles');

    if (!constraintsError && constraints) {
      console.log('\nTable constraints:');
      console.log('==================');
      constraints.forEach(c => {
        console.log(`${c.constraint_type}: ${c.constraint_name}`);
      });
    }

    // Query 3: Get row count
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (!countError) {
      console.log(`\nTotal rows in profiles table: ${count}`);
    }

    // Query 4: Check for any profiles with display_name
    const { data: displayNameCheck, error: displayNameError } = await supabase
      .from('profiles')
      .select('id, display_name')
      .not('display_name', 'is', null)
      .limit(5);

    if (!displayNameError && displayNameCheck) {
      console.log(`\nProfiles with display_name: ${displayNameCheck.length}`);
      if (displayNameCheck.length > 0) {
        console.log('Sample display names:');
        displayNameCheck.forEach(p => {
          console.log(`  - ${p.display_name} (ID: ${p.id})`);
        });
      }
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the check
checkProfilesSchema()
  .then(() => {
    console.log('\nSchema check complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });