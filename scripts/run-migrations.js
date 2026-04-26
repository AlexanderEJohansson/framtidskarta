// Run database migrations for Framtidskarta
const https = require('https');

const TOKEN = 'sbp_21b1add18c80174af7646a927176e53a3a63f57a';
const PROJECT = 'djdqpkslbvgniweqofkc';

function runQuery(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      query: sql,
      type: 'sql',
    });

    const options = {
      hostname: `${PROJECT}.supabase.co`,
      port: 443,
      path: '/rest/v1/rpc/sql',
      method: 'POST',
      headers: {
        'apikey': TOKEN,
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': postData.length,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('Running migrations...');

  // Check if profiles table exists and add stripe_customer_id
  try {
    const result = await runQuery(`
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
    `);
    console.log('Added stripe_customer_id:', result);
  } catch (err) {
    console.error('Error adding stripe_customer_id:', err);
  }

  // Check if analyses table exists and add is_free_sample
  try {
    const result = await runQuery(`
      ALTER TABLE analyses ADD COLUMN IF NOT EXISTS is_free_sample BOOLEAN DEFAULT FALSE;
    `);
    console.log('Added is_free_sample:', result);
  } catch (err) {
    console.error('Error adding is_free_sample:', err);
  }

  console.log('Done!');
}

main().catch(console.error);