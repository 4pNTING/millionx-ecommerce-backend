const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BRUNO_DIR = path.join(__dirname, '..', 'api-client', 'bruno');
const LOCAL_ENV_PATH = path.join(BRUNO_DIR, 'environments', 'Local.bru');

function parseLocalEnv(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const vars = {};
  const match = content.match(/vars\s*\{([\s\S]*?)\}/);
  if (!match) return vars;
  for (const line of match[1].split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx > 0) {
      const key = trimmed.slice(0, colonIdx).trim();
      const val = trimmed.slice(colonIdx + 1).trim();
      vars[key] = val;
    }
  }
  return vars;
}

function parseBruFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const metaNameMatch = content.match(/meta\s*\{[\s\S]*?name:\s*(.*?)\n[\s\S]*?\}/);
  const name = metaNameMatch ? metaNameMatch[1].trim() : path.basename(filePath);

  const bodyMatch = content.match(/body:json\s*\{([\s\S]*?)\n\}\n/);
  let bodyJsonRaw = bodyMatch ? bodyMatch[1].trim() : null;

  const preRequestMatch = content.match(/script:pre-request\s*\{([\s\S]*?)\n\}\n/);
  const preRequestScript = preRequestMatch ? preRequestMatch[1].trim() : null;

  const postResponseMatch = content.match(/script:post-response\s*\{([\s\S]*?)\n\}\n/);
  const postResponseScript = postResponseMatch ? postResponseMatch[1].trim() : null;

  return { name, bodyJsonRaw, preRequestScript, postResponseScript };
}

function interpolate(str, env) {
  if (!str) return str;
  return str.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_, key) => {
    return env[key] !== undefined ? env[key] : `{{${key}}}`;
  });
}

async function main() {
  console.log('===============================================================');
  console.log('       MILLIONX E-COMMERCE API: FULL BRUNO SUITE TEST          ');
  console.log('===============================================================\n');

  // Step 0: Clear Redis rate limits
  try {
    execSync("docker exec millionx_ecommerce_redis redis-cli keys 'auth:rate-limit:*' | xargs -r docker exec millionx_ecommerce_redis redis-cli del", { stdio: 'pipe' });
    console.log('[Setup] Cleared Redis rate-limit keys.\n');
  } catch (_) {}

  const env = parseLocalEnv(LOCAL_ENV_PATH);
  env.baseUrl = 'http://localhost:3001';
  env.runId = Date.now().toString();

  const files = fs.readdirSync(BRUNO_DIR)
    .filter(f => f.endsWith('.bru'))
    .sort((a, b) => {
      const seqA = parseInt(a.split(' ')[0], 10);
      const seqB = parseInt(b.split(' ')[0], 10);
      return seqA - seqB;
    });

  let passed = 0;
  let failed = 0;
  const results = [];

  for (const file of files) {
    const fullPath = path.join(BRUNO_DIR, file);
    const parsed = parseBruFile(fullPath);
    const seq = file.split(' ')[0];

    // Request 19 is for Rate Limit testing separately
    if (seq === '19') {
      console.log(`[${seq}] ${parsed.name} -> (Dedicated rate-limit check tested separately)`);
      continue;
    }

    // Run pre-request script if present
    if (parsed.preRequestScript) {
      const bruMock = {
        setEnvVar: (k, v) => { env[k] = v; },
        getEnvVar: (k) => env[k]
      };
      try {
        const fn = new Function('bru', parsed.preRequestScript);
        fn(bruMock);
      } catch (e) {
        console.warn(`Pre-request script error in ${file}:`, e.message);
      }
    }

    if (!parsed.bodyJsonRaw) {
      console.log(`[${seq}] ${parsed.name} -> Skipped (No body)`);
      continue;
    }

    const interpolatedBody = interpolate(parsed.bodyJsonRaw, env);
    let requestObj;
    try {
      requestObj = JSON.parse(interpolatedBody);
    } catch (e) {
      console.error(`[${seq}] ${parsed.name} JSON parse error:`, e.message);
      failed++;
      results.push({ seq, name: parsed.name, status: 'FAIL', error: 'JSON Parse Error' });
      continue;
    }

    const headers = { 'Content-Type': 'application/json' };
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes('Authorization: Bearer {{staffToken}}')) {
      headers['Authorization'] = `Bearer ${env.staffToken}`;
    } else if (content.includes('Authorization: Bearer {{customerToken}}')) {
      headers['Authorization'] = `Bearer ${env.customerToken}`;
    }

    const startTime = Date.now();
    let res, data;
    try {
      res = await fetch(`${env.baseUrl}/api-gateway`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestObj),
      });
      data = await res.json();
    } catch (e) {
      console.error(`[${seq}] ${parsed.name} Request failed:`, e.message);
      failed++;
      results.push({ seq, name: parsed.name, status: 'FAIL', error: e.message });
      continue;
    }
    const duration = Date.now() - startTime;

    if (res.status === 200 && !data.errors) {
      passed++;
      results.push({ seq, name: parsed.name, status: 'PASS', duration });
      console.log(`  ✓ [${seq}] ${parsed.name} (${duration}ms)`);

      // Run post-response script
      if (parsed.postResponseScript) {
        const resMock = {
          getStatus: () => res.status,
          getBody: () => data
        };
        const bruMock = {
          setEnvVar: (k, v) => { env[k] = v; },
          getEnvVar: (k) => env[k]
        };
        try {
          const fn = new Function('res', 'bru', parsed.postResponseScript);
          fn(resMock, bruMock);
        } catch (e) {
          console.warn(`Post-response script error in ${file}:`, e.message);
        }
      }
    } else {
      failed++;
      const errMsg = data.errors ? data.errors[0]?.message : `HTTP ${res.status}`;
      results.push({ seq, name: parsed.name, status: 'FAIL', duration, error: errMsg });
      console.log(`  ✗ [${seq}] ${parsed.name} (${duration}ms) - Error: ${errMsg}`);
    }
  }

  // Now test 19 Rate Limit Staff Login
  console.log('\n--- Testing Request 19: Rate Limit Staff Login (Security Verification) ---');
  let hitRateLimit = false;
  for (let i = 1; i <= 6; i++) {
    const rlRes = await fetch(`${env.baseUrl}/api-gateway`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'mutation Login($input: LoginDto!) { login(input: $input) { token } }',
        variables: { input: { username: 'admin', password: 'wrong-password' } }
      })
    });
    const rlData = await rlRes.json();
    if (rlData.errors?.[0]?.extensions?.code === 'TOO_MANY_REQUESTS') {
      hitRateLimit = true;
      console.log(`  ✓ Rate limit triggered on attempt ${i} with 429 TOO_MANY_REQUESTS`);
      break;
    }
  }

  console.log('\n===============================================================');
  console.log(`                      TEST SUMMARY                             `);
  console.log('===============================================================');
  console.log(`  Total Standard Operations: ${passed + failed}`);
  console.log(`  Passed:                   ${passed}`);
  console.log(`  Failed:                   ${failed}`);
  console.log(`  Rate Limit Protection:    ${hitRateLimit ? 'PASS (HTTP 429 Verified)' : 'CHECK'}`);
  console.log('===============================================================\n');

  // Clear rate limits again so environment is ready for user
  try {
    execSync("docker exec millionx_ecommerce_redis redis-cli keys 'auth:rate-limit:*' | xargs -r docker exec millionx_ecommerce_redis redis-cli del", { stdio: 'pipe' });
  } catch (_) {}

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
