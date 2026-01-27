/**
 * Debug script to show OAuth configuration
 * Run with: npx tsx scripts/debug-oauth.ts
 */

console.log('=== Google OAuth Debug Info ===\n');

// Check environment variables
console.log('Environment Variables:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET');
console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || 'NOT SET (will default to http://localhost:3000)');

console.log('\n=== Expected Redirect URI ===');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co';
console.log(`${supabaseUrl}/auth/v1/callback`);

console.log('\n=== What to Configure in Google Cloud Console ===');
console.log('Under "Authorized redirect URIs", add EXACTLY:');
console.log(`  ${supabaseUrl}/auth/v1/callback`);

console.log('\n=== Where Your App Redirects After OAuth ===');
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
console.log(`This is set in the server action: ${appUrl}/auth/callback`);
console.log('(This is where Supabase will redirect AFTER OAuth completes)');

console.log('\n=== Common Mistakes ===');
console.log('❌ Using app domain instead of Supabase domain');
console.log('❌ Including trailing slash');
console.log('❌ Wrong protocol (http vs https)');
console.log('❌ Including /auth/callback instead of /auth/v1/callback');
