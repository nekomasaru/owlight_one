const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function inspectSchema() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
        .from('knowledges')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching data:', error);
    } else if (data && data.length > 0) {
        console.log('Columns in knowledges table:', Object.keys(data[0]));
        console.log('Sample record:', JSON.stringify(data[0], null, 2));
    } else {
        console.log('No data in knowledges table.');
    }
}

inspectSchema();
