require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    const { data, error } = await supabase
        .from('password_reset_tokens')
        .select('*')
        .limit(1);
    
    if (error) {
        if (error.code === '42P01') {
            console.log('TABLE_MISSING');
        } else {
            console.error('ERROR', error);
        }
    } else {
        console.log('TABLE_EXISTS');
    }
}

checkTable();
