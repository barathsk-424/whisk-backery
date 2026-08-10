const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test',
        email: 'test_insert@gmail.com',
        role: 'user'
      }
    ]);
  console.log('Error:', error?.message);
}

testInsert();
