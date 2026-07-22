#!/usr/bin/env node

// Setup script for Prove Ownership Device Registry - MySQL Version
import fs from 'fs';
import { execSync } from 'child_process';

console.log('🚀 Setting up Prove Ownership Device Registry - MySQL Version\n');

// Check if Node.js version is compatible
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 16) {
  console.error('❌ Node.js 16 or higher is required. Current version:', nodeVersion);
  process.exit(1);
}

console.log('✅ Node.js version:', nodeVersion);

// Install frontend dependencies
console.log('\n📦 Installing frontend dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Frontend dependencies installed');
} catch (error) {
  console.error('❌ Failed to install frontend dependencies');
  process.exit(1);
}

// Install server dependencies
console.log('\n📦 Installing server dependencies...');
try {
  execSync('npm run server:install', { stdio: 'inherit' });
  console.log('✅ Server dependencies installed');
} catch (error) {
  console.error('❌ Failed to install server dependencies');
  process.exit(1);
}

// Create environment files if they don't exist
console.log('\n⚙️  Setting up environment files...');

const envFiles = [
  { src: '.env.example', dest: '.env' },
  { src: 'server/.env.example', dest: 'server/.env' }
];

envFiles.forEach(({ src, dest }) => {
  if (!fs.existsSync(dest)) {
    fs.copyFileSync(src, dest);
    console.log(`✅ Created ${dest}`);
  } else {
    console.log(`⚠️  ${dest} already exists, skipping`);
  }
});

console.log('\n📋 Next steps:');
console.log('1. Set up your MySQL database:');
console.log('   - Create a database named "check_it_registry"');
console.log('   - Import the schema: mysql -u root -p check_it_registry < mysql/schema.sql');
console.log('');
console.log('2. Update your environment variables:');
console.log('   - Edit .env for frontend settings');
console.log('   - Edit server/.env for backend settings (database credentials, JWT secret)');
console.log('');
console.log('3. Start the development servers:');
console.log('   - Frontend: npm run dev');
console.log('   - Backend: npm run server:dev');
console.log('');
console.log('4. Access the application:');
console.log('   - Frontend: http://localhost:5173');
console.log('   - Backend API: http://localhost:3001');
console.log('');
console.log('🎉 Setup complete! Happy coding!');