// Run this with: npx ts-node seed-admin.ts
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Admin } from './src/admin/admin.entity'; // Adjust path if needed

// ⚙️ CONFIG: Match your app.module.ts database config
const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'Slag007@',
  database: 'university_db',
  entities: [Admin],
  synchronize: true,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('📦 Database Connected...');

  const adminRepo = AppDataSource.getRepository(Admin);

  // Check if admin exists
  const email = 'admin@uni.edu';
  const existing = await adminRepo.findOneBy({ email });

  if (existing) {
    console.log('✅ Admin already exists. No action taken.');
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
  console.log('🚀 SUCCESS: Admin User Created!');
  console.log('📧 Email: admin@uni.edu');
  console.log('🔑 Pass:  admin123');

  process.exit(0);
}

seed().catch((err) => console.error('❌ Error:', err));
