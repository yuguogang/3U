const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:password@127.0.0.1:5433/3u_aura_uat_mockusdt?schema=fork_anvil',
  });
  
  const walletAddress = '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65';
  
  // Check user
  const userCheck = await pool.query(`SELECT id, "walletAddress" FROM "User" WHERE "walletAddress" = $1`, [walletAddress]);
  console.log('User:', userCheck.rows);
  
  // Check eligibility
  if (userCheck.rows.length > 0) {
    const userId = userCheck.rows[0].id;
    const eligCheck = await pool.query(`SELECT * FROM "NftReferralEligibility" WHERE "userId" = $1`, [userId]);
    console.log('Eligibility:', eligCheck.rows);
    
    // Set eligibility
    await pool.query(`
      INSERT INTO "NftReferralEligibility" (id, "userId", status, "personalCheckinCount", "smallLegVolumeUsdt", "requiredCheckinCount", "requiredSmallLegUsdt", "approvedAt", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, 'APPROVED', 30, 6000000000, 30, 6000000000, NOW(), NOW(), NOW())
      ON CONFLICT ("userId") DO UPDATE SET
        status = 'APPROVED',
        "personalCheckinCount" = 30,
        "smallLegVolumeUsdt" = 6000000000,
        "approvedAt" = NOW(),
        "updatedAt" = NOW()
    `, [userId]);
    console.log('Eligibility set successfully');
  }
  
  await pool.end();
}

main().catch(console.error);
