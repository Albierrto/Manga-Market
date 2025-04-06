const { Series, Volume, CompletedSale, SaleVolume } = require('../models');

// Function to add sample sales data
const seedSalesData = async () => {
  try {
    console.log('Adding sample sales data...');
    
    // 1. Get or create a series
    let series = await Series.findOne({ where: { name: 'Naruto' } });
    
    if (!series) {
      series = await Series.create({
        name: 'Naruto',
        publisher: 'VIZ Media',
        total_volumes: 72,
        status: 'completed'
      });
      console.log('Created Naruto series');
    }
    
    // 2. Make sure volumes exist
    const volumesData = [];
    for (let i = 1; i <= 10; i++) {
      volumesData.push({
        series_id: series.series_id,
        volume_number: i,
        isbn: `978156931900${i}`,
        retail_price: 9.99
      });
    }
    
    // Use bulk create with updateOnDuplicate to avoid duplicate errors
    await Volume.bulkCreate(volumesData, {
      updateOnDuplicate: ['retail_price']
    });
    console.log('Volumes created or updated');
    
    // 3. Create sample completed sales
    const now = new Date();
    const saleData = [
      // Complete set (volumes 1-5)
      {
        source: 'ebay',
        source_listing_id: 'ebay123456',
        sale_date: new Date(now - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        sale_price: 45.99, // ~$9.20 per volume
        condition: 'good',
        is_complete_set: true,
        volumes: [1, 2, 3, 4, 5]
      },
      // Complete set (volumes 1-5) in very good condition
      {
        source: 'ebay',
        source_listing_id: 'ebay123457',
        sale_date: new Date(now - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        sale_price: 52.99, // ~$10.60 per volume
        condition: 'very_good',
        is_complete_set: true,
        volumes: [1, 2, 3, 4, 5]
      },
      // Partial set (volumes 1-3)
      {
        source: 'ebay',
        source_listing_id: 'ebay123458',
        sale_date: new Date(now - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        sale_price: 26.99, // ~$9.00 per volume
        condition: 'good',
        is_complete_set: false,
        volumes: [1, 2, 3]
      },
      // Individual volume
      {
        source: 'ebay',
        source_listing_id: 'ebay123459',
        sale_date: new Date(now - 25 * 24 * 60 * 60 * 1000), // 25 days ago
        sale_price: 8.99,
        condition: 'acceptable',
        is_complete_set: false,
        volumes: [1]
      },
      // Older sales for trend analysis
      {
        source: 'ebay',
        source_listing_id: 'ebay123460',
        sale_date: new Date(now - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        sale_price: 42.99, // ~$8.60 per volume
        condition: 'good',
        is_complete_set: true,
        volumes: [1, 2, 3, 4, 5]
      },
    ];
    
    // 4. Add each sale and its volumes
    for (const sale of saleData) {
      const { volumes, ...saleInfo } = sale;
      
      // Create sale
      const createdSale = await CompletedSale.create(saleInfo);
      
      // Get volume objects
      const volumeObjects = await Volume.findAll({
        where: { 
          series_id: series.series_id,
          volume_number: volumes
        }
      });
      
      // Link volumes to sale
      for (const volume of volumeObjects) {
        await SaleVolume.create({
          sale_id: createdSale.sale_id,
          volume_id: volume.volume_id
        });
      }
    }
    
    console.log('Sample sales data added successfully');
  } catch (error) {
    console.error('Error adding sample sales data:', error);
  }
};

// Export for use in other files
module.exports = seedSalesData;

// If run directly, execute the seeder
if (require.main === module) {
  seedSalesData()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}