const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignup() {
  const { data, error } = await supabase.auth.signUp({
    email: 'testnewuser12345@gmail.com',
    password: 'DummyPassword123!@#',
    options: {
      data: { full_name: 'Test' }
    }
  });
  console.log('Error:', error?.message);
  console.log('Data:', JSON.stringify(data, null, 2));
}

testSignup();
