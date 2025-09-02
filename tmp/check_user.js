(async () => {
  try {
  const path = require('path')
  require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })
  const admin = require('../src/lib/firebase/admin')
  const adminAuth = admin.adminAuth
  const email = 'josephwamiti8711@gmail.com'
  const user = await adminAuth.getUserByEmail(email)
  } catch (err) {
    process.exit(1)
  }
})()
