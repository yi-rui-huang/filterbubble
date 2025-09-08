const fs = require('fs');
const readline = require('readline');

/**
 * Script to filter merged movie dataset for high-quality movies
 * Criteria: numVotes > 5000 AND averageRating >= 7.0
 */

const inputFile = '/home/hyr/115/filterbubble/src/data/title.merged.tsv';
const outputFile = '/home/hyr/115/filterbubble/src/data/title.high_quality.tsv';

async function filterHighQualityMovies() {
    console.log('Starting to filter high-quality movies...');
    console.log('Criteria: numVotes > 5000 AND averageRating >= 5.5');
    
    const inputStream = fs.createReadStream(inputFile);
    const reader = readline.createInterface({
        input: inputStream,
        crlfDelay: Infinity
    });
    
    const outputStream = fs.createWriteStream(outputFile);
    
    let totalProcessed = 0;
    let filteredCount = 0;
    let skippedMissingRatings = 0;
    let isFirstLine = true;
    
    for await (const line of reader) {
        if (isFirstLine) {
            // Write header
            outputStream.write(line + '\n');
            isFirstLine = false;
            continue;
        }
        
        const parts = line.split('\t');
        totalProcessed++;
        
        // Check if we have all required columns (should be 11 total)
        if (parts.length >= 11) {
            const averageRating = parts[9]; // averageRating column
            const numVotes = parts[10];     // numVotes column
            
            // Skip records with missing rating data
            if (averageRating === '\\N' || numVotes === '\\N') {
                skippedMissingRatings++;
                continue;
            }
            
            const rating = parseFloat(averageRating);
            const votes = parseInt(numVotes);
            
            // Apply filtering criteria
            if (votes > 5000 && rating >= 6.0) {
                outputStream.write(line + '\n');
                filteredCount++;
            }
        }
        
        // Progress indicator
        if (totalProcessed % 50000 === 0) {
            console.log(`Processed ${totalProcessed} records, filtered ${filteredCount} high-quality movies`);
        }
    }
    
    outputStream.end();
    
    console.log('\nFiltering completed!');
    console.log(`Total records processed: ${totalProcessed}`);
    console.log(`Records with missing ratings skipped: ${skippedMissingRatings}`);
    console.log(`High-quality movies found: ${filteredCount}`);
    console.log(`Filter rate: ${((filteredCount / totalProcessed) * 100).toFixed(2)}%`);
    console.log(`Output file: ${outputFile}`);
    
    // Verify output file
    const stats = fs.statSync(outputFile);
    console.log(`Output file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    // Show some statistics
    console.log('\nCriteria applied:');
    console.log('- Number of votes > 5,000');
    console.log('- Average rating >= 5.5');
}

async function main() {
    try {
        // Check if input file exists
        if (!fs.existsSync(inputFile)) {
            throw new Error(`Input file not found: ${inputFile}`);
        }
        
        await filterHighQualityMovies();
        
    } catch (error) {
        console.error('Error during filtering process:', error.message);
        process.exit(1);
    }
}

// Run the script
main();
