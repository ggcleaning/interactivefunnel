import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable() {
  console.log('--- Inspecting quotes table ---');
  
  // Try to select one row to see what columns come back
  const { data, error } = await supabase.from('quotes').select('*').limit(1);
  
  if (error) {
    console.error('Error fetching quotes:', error.message);
  } else if (data && data.length > 0) {
    console.log('Columns found:', Object.keys(data[0]));
  } else {
    console.log('No data found in quotes table to inspect columns.');
    
    // Try to get column names from information_schema if possible (requires more permissions usually)
    const { data: cols, error: colError } = await supabase.rpc('get_table_columns', { table_name: 'quotes' });
    if (colError) {
        console.log('RPC check failed (expected if not defined):', colError.message);
    }
  }
}

inspectTable();
