(async () => {
  try {
  console.log('STEP: loading .env.local')
  const path = require('path')
  require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })
  console.log('STEP: env loaded. FIREBASE_PROJECT_ID=', process.env.FIREBASE_PROJECT_ID ? 'SET' : 'MISSING')
  console.log('STEP: importing admin')
  const admin = require('../src/lib/firebase/admin')
  const adminAuth = admin.adminAuth
  console.log('STEP: admin imported')
  console.log('admin app options:', admin.adminApp && admin.adminApp.options ? admin.adminApp.options : '(none)')
  const email = 'josephwamiti8711@gmail.com'
  console.log('STEP: calling getUserByEmail for', email)
  const user = await adminAuth.getUserByEmail(email)
  console.log('FOUND', { uid: user.uid, email: user.email, emailVerified: user.emailVerified })
  } catch (err) {
  console.error('ERR', err && err.message ? err.message : err)
    process.exit(1)
  }
})()
