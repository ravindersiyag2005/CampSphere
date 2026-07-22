// Run with: node seed.js
// Creates a test student account and a few chat rooms.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const ChatRoom = require('./models/ChatRoom');

(async () => {
  await connectDB();

  await User.deleteMany({ collegeId: '1232610' });
  const hashed = await bcrypt.hash('1232610', 10);
  const testUser = await User.create({
    name: 'Test Student',
    collegeId: '1232610',

    password: hashed,
    role: 'student',
  });
  console.log('Created test student collegeId: 1232610 / password: 1232610');

  const defaultRooms = [
    { name: 'General Campus Chat', subject: 'General', description: 'Talk about anything campus related' },
    { name: 'Placements & Internships', subject: 'Placements', description: 'Interview experiences, prep, referrals' },
    { name: 'DSA & Coding', subject: 'Computer Science', description: 'Discuss DSA, competitive coding, projects' },
  ];
  for (const r of defaultRooms) {
    const exists = await ChatRoom.findOne({ name: r.name });
    if (!exists) {
      await ChatRoom.create({ ...r, createdBy: testUser._id });
      console.log('Created room:', r.name);
    }
  }

  console.log('Seed complete.');
  process.exit(0);
})();
