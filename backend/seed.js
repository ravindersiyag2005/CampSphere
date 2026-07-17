// Run with: node seed.js
// Creates a default admin account and a few chat rooms.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const ChatRoom = require('./models/ChatRoom');

(async () => {
  await connectDB();

  const adminEmail = 'admin@campushub.edu';
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    const hashed = await bcrypt.hash('Admin@123', 10);
    admin = await User.create({
      name: 'Campus Admin',
      collegeId: 'ADMIN001',
      email: adminEmail,
      password: hashed,
      role: 'admin',
    });
    console.log('Created admin:', adminEmail, '/ password: Admin@123');
  } else {
    console.log('Admin already exists:', adminEmail);
  }

  const defaultRooms = [
    { name: 'General Campus Chat', subject: 'General', description: 'Talk about anything campus related' },
    { name: 'Placements & Internships', subject: 'Placements', description: 'Interview experiences, prep, referrals' },
    { name: 'DSA & Coding', subject: 'Computer Science', description: 'Discuss DSA, competitive coding, projects' },
  ];
  for (const r of defaultRooms) {
    const exists = await ChatRoom.findOne({ name: r.name });
    if (!exists) {
      await ChatRoom.create({ ...r, createdBy: admin._id });
      console.log('Created room:', r.name);
    }
  }

  console.log('Seed complete.');
  process.exit(0);
})();
