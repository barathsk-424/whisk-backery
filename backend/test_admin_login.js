const { supabase } = require('./config/supabase');

async function testLogin() {
  console.log("Testing Login...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'skbarath424@gmail.com',
    password: '06022007',
  });
  console.log("Login Result:", { data, error });
}

testLogin();
