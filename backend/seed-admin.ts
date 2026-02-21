// Run this with: npx ts-node seed-admin.ts
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Admin } from './src/admin/admin.entity'; 
import * as dotenv from 'dotenv';

//Load environment variables from .env file
dotenv.config(); 

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Admin],
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  synchronize: true,
});

async function seed() {
  console.log(`Connecting to database: ${process.env.DB_NAME} on ${process.env.DB_HOST}...`);
  if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    console.log('Database Connected...')

  const adminRepo = AppDataSource.getRepository(Admin);

  // Check if admin exists
  const email = 'admin@uni.edu';
  const existing = await adminRepo.findOneBy({ email });

  if (existing) {
    console.log('Admin already exists. No action taken.');
    process.exit(0);
  }

  // Create Admin
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('admin123', salt);

  const newAdmin = adminRepo.create({
    firstName: 'System',
    lastName: 'Administrator',
    email: email,
    password: hashedPassword,
  });

  await adminRepo.save(newAdmin);
  console.log('SUCCESS: Admin User Created!');
  console.log('Email: admin@uni.edu');
  console.log('Pass:  admin123');

  process.exit(0);
}

seed();
