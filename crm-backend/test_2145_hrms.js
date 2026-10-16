import dotenv from 'dotenv';
dotenv.config();
import { generatePortalToken } from './src/services/auth.service.js';
import { decryptToken } from './src/services/encryption.service.js';
import { verifyToken as verifyJWTToken } from './src/services/token.service.js';
import { findHRMSUserByEmail } from './src/services/hrms.service.js';
import { getHRMSDb } from './src/config/database.js';

async function test() {
  console.log('--- Step 1: Simulate switchPortal for 2145 to HRMS ---');
  // Suppose user 2145 was in rbac_users (id: 43) or Fee
  const token = await generatePortalToken(
    '43',
    'hrms',
    'super_admin',
    'rbac_users',
    '2145',
    {
      email: 'teja@pydahsoft.in',
      employeeId: '2145',
      portals: ['hrms', 'fee-management', 'student-portal']
    }
  );
  console.log('Generated token length:', token.length);

  console.log('\n--- Step 2: Decrypt and inspect JWT payload ---');
  const decrypted = decryptToken(token);
  const decoded = verifyJWTToken(decrypted);
  console.log('Decoded Token:', decoded);

  console.log('\n--- Step 3: Simulate verifyToken for HRMS ---');
  const targetEmp = decoded.employeeId || (/^\d+$/.test(decoded.username) ? decoded.username : null);
  const hrmsIdentity = await findHRMSUserByEmail(decoded.email, targetEmp);
  console.log('findHRMSUserByEmail result:', hrmsIdentity);

  // Check what HRMS employee and user correspond to hrmsIdentity.userId
  const hrmsDb = await getHRMSDb();
  if (hrmsDb && hrmsIdentity) {
    const { ObjectId } = await import('mongodb');
    const empDoc = await hrmsDb.collection('employees').findOne({ _id: new ObjectId(hrmsIdentity.userId) });
    console.log('HRMS Employee doc for resolved userId:', empDoc ? {
      _id: empDoc._id,
      emp_no: empDoc.emp_no,
      name: empDoc.employee_name || empDoc.name
    } : 'NOT FOUND IN EMPLOYEES');

    const userDoc = await hrmsDb.collection('users').findOne({ _id: new ObjectId(hrmsIdentity.userId) });
    console.log('HRMS User doc for resolved userId:', userDoc ? {
      _id: userDoc._id,
      name: userDoc.name,
      employeeId: userDoc.employeeId
    } : 'NOT FOUND IN USERS');
  }

  process.exit(0);
}

test().catch(e => { console.error(e); process.exit(1); });
