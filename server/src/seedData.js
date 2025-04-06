const seedSalesData = require('./seeders/sampleSalesData');

// Run the seed function
(async () => {
  try {
    console.log('Starting to seed data...');
    await seedSalesData();
    console.log('Data seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
})();