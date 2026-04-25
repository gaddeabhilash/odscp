const dotenv = require('dotenv');
const connectDB = require('../config/db');
const User = require('../models/User');
const Project = require('../models/Project');

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    // Clear specific collections
    await User.deleteMany();
    await Project.deleteMany();

    // Add admin
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
    });

    // Add client
    const clientUser = await User.create({
      name: 'Client User',
      email: 'client@example.com',
      password: 'password123',
      role: 'client',
    });

    // Add project
    await Project.create({
      clientId: clientUser._id,
      projectName: 'Demo 3BHK Villa',
      status: 'Design',
      progress: 10,
    });

    console.log('Data Imported! Admin, Client, and Project successfully generated.');
    process.exit();
  } catch (error) {
    console.error(`Error with seeding: ${error.message}`);
    process.exit(1);
  }
};

seedData();
