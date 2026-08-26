const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Product = require('./models/Product');
const Scan = require('./models/Scan');
const Violation = require('./models/Violation');
const dns = require('dns');
dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/labelcheck';

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding');

    // Clear existing data
    await User.deleteMany();
    await Product.deleteMany();
    await Scan.deleteMany();
    await Violation.deleteMany();

    // Create users
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@labelcheck.gov.in',
      passwordHash: 'admin123', // Will be hashed by pre-save hook
      role: 'admin'
    });

    const officer1 = await User.create({
      name: 'Officer Sharma',
      email: 'sharma@labelcheck.gov.in',
      passwordHash: 'officer123',
      role: 'officer'
    });
    
    const officer2 = await User.create({
      name: 'Officer Verma',
      email: 'verma@labelcheck.gov.in',
      passwordHash: 'officer123',
      role: 'officer'
    });

    // Create products
    const products = await Product.insertMany([
      { name: 'Parle-G Gold', brand: 'Parle', category: 'Biscuits', barcode: '8901719280053', images: ['https://placehold.co/400x400/png?text=Parle-G+Gold'] },
      { name: 'Maggi 2-Minute Noodles', brand: 'Nestle', category: 'Noodles', barcode: '8901058814749', images: ['https://placehold.co/400x400/png?text=Maggi'] },
      { name: 'Amul Butter', brand: 'Amul', category: 'Dairy', barcode: '8901262010014', images: ['https://placehold.co/400x400/png?text=Amul+Butter'] },
      { name: 'Dove Cream Beauty Bathing Bar', brand: 'Dove', category: 'Soap', barcode: '8901030386868', images: ['https://placehold.co/400x400/png?text=Dove+Soap'] },
      { name: 'Tata Salt', brand: 'Tata', category: 'Groceries', barcode: '8904004400035', images: ['https://placehold.co/400x400/png?text=Tata+Salt'] },
    ]);

    // Create some scans and violations
    const scan1 = await Scan.create({
      productId: products[0]._id,
      officerId: officer1._id,
      images: ['https://placehold.co/400x400/png?text=Scan1'],
      complianceStatus: 'NON_COMPLIANT',
      riskScore: 70,
      notes: 'Missing MRP and generic name not clear.',
      declarations: [
        { field: 'mrp', found: false, value: null },
        { field: 'net_quantity', found: true, value: '100g' },
        { field: 'mfg_date', found: true, value: '10/2025' }
      ]
    });

    await Violation.create({
      scanId: scan1._id,
      ruleId: 'rule_mrp',
      field: 'mrp',
      description: 'Missing mandatory declaration: Maximum Retail Price (MRP) inclusive of all taxes',
      severity: 'HIGH',
      ruleReference: 'Rule 6(1)(d)'
    });

    const scan2 = await Scan.create({
      productId: products[1]._id,
      officerId: officer2._id,
      images: ['https://placehold.co/400x400/png?text=Scan2'],
      complianceStatus: 'COMPLIANT',
      riskScore: 100,
      notes: 'All declarations found.',
      declarations: [
        { field: 'mrp', found: true, value: 'Rs 14.00' },
        { field: 'net_quantity', found: true, value: '70g' },
        { field: 'mfg_date', found: true, value: '09/2025' },
        { field: 'expiry_date', found: true, value: '05/2026' }
      ]
    });

    console.log('Data seeded successfully!');
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
