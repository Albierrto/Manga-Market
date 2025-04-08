// server/scripts/importCsv.js

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser'); // For parsing CSV files

// **MODIFIED**: Specify path to .env file in the parent directory
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const { CompletedSale } = require('../src/models'); // Adjust path if your models/index.js exports everything
const sequelize = require('../src/utils/database'); // Your configured Sequelize instance

// --- Configuration ---
// Path to the folder containing the CSV files (relative to this script's location)
// Assumes 'manga_price_data' is in the parent directory of 'server'. Adjust if needed.
const dataFolderPath = path.join(__dirname, '..', '..', 'manga_price_data');
// Expected CSV file patterns (adjust if your Python script uses different names)
const singlesLotsPattern = /_SinglesLots_\d{4}-\d{2}-\d{2}\.csv$/;
const omnibusPattern = /_Omnibus_\d{4}-\d{2}-\d{2}\.csv$/;
// --- End Configuration ---


/**
 * Parses the eBay listing ID from a URL.
 * @param {string} urlString - The eBay link.
 * @returns {string|null} The listing ID or null if not found.
 */
function parseListingId(urlString) {
    if (!urlString) return null;
    try {
        const match = urlString.match(/\/itm\/(\d+)/);
        return match ? match[1] : null;
    } catch (error) {
        console.error(`Error parsing URL ${urlString}:`, error);
        return null;
    }
}

/**
 * Parses the "Date Sold" string into a JavaScript Date object.
 * Format expected: "Sold Mmm DD, YYYY" (e.g., "Sold Jan 15, 2024")
 * @param {string} dateString - The date string from the CSV.
 * @returns {Date|null} The parsed Date object or null if invalid.
 */
function parseSaleDate(dateString) {
    if (!dateString) return null;
    const cleanDateString = dateString.replace(/^Sold\s+/i, '');
    try {
        const date = new Date(cleanDateString);
        if (isNaN(date.getTime())) {
            console.warn(`Could not parse date: "${dateString}"`);
            return null;
        }
        return date;
    } catch (error) {
        console.error(`Error parsing date string ${dateString}:`, error);
        return null;
    }
}

/**
 * Processes a single CSV file and imports valid rows into the CompletedSale table.
 * @param {string} filePath - The full path to the CSV file.
 */
async function processCsvFile(filePath) {
    console.log(`\nProcessing file: ${path.basename(filePath)}`);
    const results = [];
    let importedCount = 0;
    let skippedCount = 0;

    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                const saleData = {
                    source: 'ebay',
                    currency: 'USD',
                    condition: 'good', // Default from CSV limitation
                    is_complete_set: false, // Default from CSV limitation
                };

                const totalPrice = parseFloat(row['Total Price'] || row['Total Price']);
                const dateSoldString = row['Date Sold'];
                const link = row['Link'];

                if (!totalPrice || isNaN(totalPrice) || !dateSoldString || !link) {
                    skippedCount++;
                    return;
                }

                saleData.sale_price = totalPrice;
                saleData.sale_date = parseSaleDate(dateSoldString);
                saleData.source_listing_id = parseListingId(link);

                if (!saleData.sale_date || !saleData.source_listing_id) {
                    skippedCount++;
                    return;
                }
                results.push(saleData);
            })
            .on('end', async () => {
                console.log(`CSV file successfully parsed. Found ${results.length} potential records.`);
                if (results.length > 0) {
                    for (const sale of results) {
                        try {
                            const [record, created] = await CompletedSale.findOrCreate({
                                where: { source_listing_id: sale.source_listing_id, source: 'ebay' },
                                defaults: sale,
                            });
                            if (created) importedCount++;
                            else skippedCount++;
                        } catch (error) {
                            console.error(`Error inserting/finding sale for listing ID ${sale.source_listing_id}:`, error.message);
                            skippedCount++;
                        }
                    }
                }
                console.log(`Finished processing ${path.basename(filePath)}:`);
                console.log(`  Successfully imported/found: ${importedCount}`);
                console.log(`  Skipped (missing data/duplicate/error): ${skippedCount}`);
                resolve();
            })
            .on('error', (error) => {
                console.error(`Error reading CSV file ${filePath}:`, error);
                reject(error);
            });
    });
}

/**
 * Main function to find and process all relevant CSV files.
 */
async function importSalesData() {
    console.log('Starting manga sales data import...');
    // Check if data folder exists
     if (!fs.existsSync(dataFolderPath)) {
         console.error(`Error: Data folder not found at ${dataFolderPath}`);
         console.error('Please ensure the manga_price_data folder exists in the correct location relative to the server directory.');
         return;
     }
     console.log(`Looking for CSV files in: ${dataFolderPath}`);

    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully.');

        const files = fs.readdirSync(dataFolderPath);
        const csvFilesToProcess = files.filter(file =>
            singlesLotsPattern.test(file) || omnibusPattern.test(file)
        );

        if (csvFilesToProcess.length === 0) {
            console.log('No matching CSV files found to import.');
            return;
        }

        console.log(`Found ${csvFilesToProcess.length} CSV file(s) to process:`);
        csvFilesToProcess.forEach(file => console.log(` - ${file}`));

        for (const file of csvFilesToProcess) {
            const filePath = path.join(dataFolderPath, file);
            await processCsvFile(filePath);
        }

        console.log('\nImport process finished.');

    } catch (error) {
        console.error('\nAn error occurred during the import process:', error);
        // Check for specific authentication errors
        if (error.name === 'SequelizeConnectionRefusedError') {
             console.error('Database connection refused. Is the PostgreSQL server running?');
        } else if (error.name === 'SequelizeAccessDeniedError' || (error.original && error.original.code === '28P01')) {
             console.error('Database authentication failed. Check DB_USER and DB_PASSWORD in your .env file.');
        } else if (error.name === 'SequelizeDatabaseError' && error.original && error.original.code === '3D000') {
             console.error(`Database "${process.env.DB_NAME || 'manga_market'}" not found. Please ensure it exists.`);
        }
    } finally {
        // await sequelize.close(); // Keep connection open if run frequently
        // console.log('Database connection closed.');
    }
}

// Run the main import function
importSalesData();