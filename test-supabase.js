import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env file manually since dotenv is not in dependencies
const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[key] = value.trim();
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function testTables() {
  const tables = ['profiles', 'patients', 'doctors', 'appointments', 'invoices', 'billing'];
  console.log('Checking tables in Supabase...');
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`Table "${table}": Error - ${error.message} (${error.code})`);
      } else {
        console.log(`Table "${table}": SUCCESS (Exists)`);
      }
    } catch (err) {
      console.log(`Table "${table}": Exception - ${err.message}`);
    }
  }
}

testTables();
