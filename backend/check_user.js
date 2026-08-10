const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  const email = 'skbarath089@gmail.com';
  
  // 1. Check public.users
  const { data: publicUser, error: publicErr } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
    
  console.log('Public User:', publicUser);
  console.log('Public User Error:', publicErr?.message);

  // 2. Try to log in with a dummy password
  const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
    email: email,
    password: 'SomeDummyPassword123!',
  });

  console.log('Login Error:', loginErr?.message);
  
  // 3. Try to send reset password email (this will trigger Supabase's native reset if configured)
  const { data: resetData, error: resetErr } = await supabase.auth.resetPasswordForEmail(email);
  console.log('Reset Password Result:', resetData, resetErr?.message);
}

checkUser();
