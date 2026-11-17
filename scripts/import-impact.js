// Copy impact history from a SQLite analytics file (e.g. one copied from the old server) into
// the Firestore log used on Cloud Run. Rows are already privacy-first (hashed ids, no text).
// Safe to re-run: each row gets a fixed document id, and existing documents are left alone.
//
//   node scripts/import-impact.js data/analytics.db                 # dry run: counts only
//   GOOGLE_CLOUD_PROJECT=<id> FIRESTORE_TOKEN=$(gcloud auth print-access-token) \
//     node scripts/import-impact.js data/analytics.db --write
import { DatabaseSync } from 'node:sqlite';
import { createFirestoreLog } from '../src/firestore-log.js';

const [file, flag] = process.argv.slice(2);
if (!file) { console.error('usage: node scripts/import-impact.js <analytics.db> [--write]'); process.exit(2); }
const db = new DatabaseSync(file, { readOnly: true });
const rows = db.prepare('SELECT id, ts, day, sid, kind, problem_type, lang, mode, value, is_bot, is_internal FROM events ORDER BY id').all();
const real = rows.filter((r) => !r.is_bot && !r.is_internal);
console.log(`${rows.length} events (${real.length} real, ${rows.length - real.length} bot/internal), ${rows[0]?.day ?? '-'} to ${rows.at(-1)?.day ?? '-'}`);

if (flag !== '--write') { console.log('dry run; add --write to copy them to Firestore'); process.exit(0); }
if (!process.env.GOOGLE_CLOUD_PROJECT || !process.env.FIRESTORE_TOKEN) { console.error('set GOOGLE_CLOUD_PROJECT and FIRESTORE_TOKEN'); process.exit(2); }
const log = createFirestoreLog();
let ok = 0;
for (const { id, ...row } of rows) if (await log.append(row, `import-${String(id).padStart(8, '0')}`)) ok++;
console.log(`copied ${ok} of ${rows.length}`);
process.exit(ok === rows.length ? 0 : 1);
