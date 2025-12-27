/**
 * Generate SQL INSERT statements for loading Brevo data into staging table
 */

const fs = require('fs');
const path = require('path');

const SYNC_DATA_PATH = path.join(__dirname, '../tmp/brevo-sync-data.json');
const OUTPUT_DIR = path.join(__dirname, '../tmp/staging-inserts');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function escapeSql(str) {
  if (!str) return '';
  return str.replace(/'/g, "''").trim();
}

function main() {
  const syncData = JSON.parse(fs.readFileSync(SYNC_DATA_PATH, 'utf-8'));
  console.log(`Loaded ${syncData.length} records`);

  // Generate batches of 200 records each
  const BATCH_SIZE = 200;
  const batches = [];

  for (let i = 0; i < syncData.length; i += BATCH_SIZE) {
    batches.push(syncData.slice(i, i + BATCH_SIZE));
  }

  console.log(`Generating ${batches.length} INSERT batch files...`);

  batches.forEach((batch, idx) => {
    const values = batch.map(r => {
      const email = escapeSql(r.email);
      const firstName = escapeSql(r.first_name);
      const lastName = escapeSql(r.last_name);
      const dob = r.date_of_birth ? `'${r.date_of_birth}'` : 'NULL';
      const optIn = r.marketing_opt_in;
      return `('${email}', '${firstName}', '${lastName}', ${dob}, ${optIn})`;
    }).join(',\n');

    const sql = `INSERT INTO brevo_sync_staging (email, first_name, last_name, date_of_birth, marketing_opt_in)
VALUES
${values}
ON CONFLICT (email) DO NOTHING;`;

    fs.writeFileSync(
      path.join(OUTPUT_DIR, `batch-${String(idx + 1).padStart(3, '0')}.sql`),
      sql
    );
  });

  console.log(`Generated ${batches.length} files in ${OUTPUT_DIR}`);
}

main();
