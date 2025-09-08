const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * Script to merge title.basics.movie.filtered.tsv with title.ratings.tsv
 * based on tconst field to create a combined dataset
 */

const basicsFile = '/home/hyr/115/filterbubble/src/data/title.basics.movie.filtered.tsv';
const ratingsFile = '/home/hyr/115/filterbubble/src/data/title.ratings.tsv';
const outputFile = '/home/hyr/115/filterbubble/src/data/title.merged.tsv';

async function mergeFiles() {
    console.log('Starting to merge TSV files...');
    
    // Step 1: Load ratings data into memory (more efficient for lookup)
    console.log('Loading ratings data...');
    const ratingsMap = new Map();
    
    const ratingsStream = fs.createReadStream(ratingsFile);
    const ratingsReader = readline.createInterface({
        input: ratingsStream,
        crlfDelay: Infinity
    });
    
    let ratingsCount = 0;
    let isFirstRatingsLine = true;
    
    for await (const line of ratingsReader) {
        if (isFirstRatingsLine) {
            isFirstRatingsLine = false;
            continue; // Skip header
        }
        
        const parts = line.split('\t');
        if (parts.length >= 3) {
            const tconst = parts[0];
            const averageRating = parts[1];
            const numVotes = parts[2];
            ratingsMap.set(tconst, { averageRating, numVotes });
            ratingsCount++;
        }
    }
    
    console.log(`Loaded ${ratingsCount} ratings records`);
    
    // Step 2: Process basics file and merge with ratings
    console.log('Processing basics file and merging...');
    const basicsStream = fs.createReadStream(basicsFile);
    const basicsReader = readline.createInterface({
        input: basicsStream,
        crlfDelay: Infinity
    });
    
    const outputStream = fs.createWriteStream(outputFile);
    
    let processedCount = 0;
    let matchedCount = 0;
    let isFirstBasicsLine = true;
    
    for await (const line of basicsReader) {
        if (isFirstBasicsLine) {
            // Write header for merged file
            const header = line + '\taverageRating\tnumVotes';
            outputStream.write(header + '\n');
            isFirstBasicsLine = false;
            continue;
        }
        
        const parts = line.split('\t');
        if (parts.length >= 9) {
            const tconst = parts[0];
            const ratingsData = ratingsMap.get(tconst);
            
            if (ratingsData) {
                // Merge the data
                const mergedLine = line + '\t' + ratingsData.averageRating + '\t' + ratingsData.numVotes;
                outputStream.write(mergedLine + '\n');
                matchedCount++;
            } else {
                // No rating data found, use \N for missing values
                const mergedLine = line + '\t\\N\t\\N';
                outputStream.write(mergedLine + '\n');
            }
            
            processedCount++;
            
            // Progress indicator
            if (processedCount % 10000 === 0) {
                console.log(`Processed ${processedCount} records, matched ${matchedCount}`);
            }
        }
    }
    
    outputStream.end();
    
    console.log('\nMerge completed!');
    console.log(`Total records processed: ${processedCount}`);
    console.log(`Records with ratings: ${matchedCount}`);
    console.log(`Records without ratings: ${processedCount - matchedCount}`);
    console.log(`Output file: ${outputFile}`);
    
    // Verify output file
    const stats = fs.statSync(outputFile);
    console.log(`Output file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
}

// Error handling
async function main() {
    try {
        // Check if input files exist
        if (!fs.existsSync(basicsFile)) {
            throw new Error(`Basics file not found: ${basicsFile}`);
        }
        
        if (!fs.existsSync(ratingsFile)) {
            throw new Error(`Ratings file not found: ${ratingsFile}`);
        }
        
        await mergeFiles();
        
    } catch (error) {
        console.error('Error during merge process:', error.message);
        process.exit(1);
    }
}

// Run the script
main();
