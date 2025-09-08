const fs = require('fs');
const readline = require('readline');

/**
 * Script to analyze genre distribution in the high-quality movies dataset
 */

const inputFile = '/home/hyr/115/filterbubble/src/data/title.high_quality.tsv';
const outputFile = '/home/hyr/115/filterbubble/src/data/genre_distribution.json';

async function analyzeGenreDistribution() {
    console.log('Analyzing genre distribution in high-quality movies dataset...');
    
    const inputStream = fs.createReadStream(inputFile);
    const reader = readline.createInterface({
        input: inputStream,
        crlfDelay: Infinity
    });
    
    const genreCount = new Map();
    const genreCombinations = new Map();
    let totalMovies = 0;
    let isFirstLine = true;
    
    for await (const line of reader) {
        if (isFirstLine) {
            isFirstLine = false;
            continue; // Skip header
        }
        
        const parts = line.split('\t');
        if (parts.length >= 9) {
            const genres = parts[8]; // genres column
            totalMovies++;
            
            if (genres && genres !== '\\N') {
                // Count genre combinations
                if (genreCombinations.has(genres)) {
                    genreCombinations.set(genres, genreCombinations.get(genres) + 1);
                } else {
                    genreCombinations.set(genres, 1);
                }
                
                // Split genres and count individual genres
                const individualGenres = genres.split(',');
                for (const genre of individualGenres) {
                    const trimmedGenre = genre.trim();
                    if (genreCount.has(trimmedGenre)) {
                        genreCount.set(trimmedGenre, genreCount.get(trimmedGenre) + 1);
                    } else {
                        genreCount.set(trimmedGenre, 1);
                    }
                }
            }
        }
    }
    
    // Sort genres by count (descending)
    const sortedGenres = Array.from(genreCount.entries())
        .sort((a, b) => b[1] - a[1]);
    
    // Sort genre combinations by count (descending)
    const sortedCombinations = Array.from(genreCombinations.entries())
        .sort((a, b) => b[1] - a[1]);
    
    // Calculate percentages
    const genreStats = sortedGenres.map(([genre, count]) => ({
        genre,
        count,
        percentage: ((count / totalMovies) * 100).toFixed(2)
    }));
    
    const combinationStats = sortedCombinations.map(([combination, count]) => ({
        combination,
        count,
        percentage: ((count / totalMovies) * 100).toFixed(2)
    }));
    
    // Prepare results
    const results = {
        totalMovies,
        analysisDate: new Date().toISOString(),
        individualGenres: {
            total: genreStats.length,
            distribution: genreStats
        },
        genreCombinations: {
            total: combinationStats.length,
            distribution: combinationStats.slice(0, 50) // Top 50 combinations
        }
    };
    
    // Save to JSON file
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
    
    // Display results
    console.log('\n=== GENRE DISTRIBUTION ANALYSIS ===');
    console.log(`Total movies analyzed: ${totalMovies}`);
    console.log(`Unique individual genres: ${genreStats.length}`);
    console.log(`Unique genre combinations: ${combinationStats.length}`);
    
    console.log('\n=== TOP 15 INDIVIDUAL GENRES ===');
    genreStats.slice(0, 15).forEach((item, index) => {
        console.log(`${(index + 1).toString().padStart(2)}. ${item.genre.padEnd(20)} ${item.count.toString().padStart(5)} movies (${item.percentage}%)`);
    });
    
    console.log('\n=== TOP 15 GENRE COMBINATIONS ===');
    combinationStats.slice(0, 15).forEach((item, index) => {
        console.log(`${(index + 1).toString().padStart(2)}. ${item.combination.padEnd(40)} ${item.count.toString().padStart(4)} movies (${item.percentage}%)`);
    });
    
    console.log(`\nDetailed results saved to: ${outputFile}`);
    
    // Additional statistics
    const singleGenreMovies = combinationStats.filter(item => !item.combination.includes(',')).length;
    const multiGenreMovies = combinationStats.filter(item => item.combination.includes(',')).length;
    
    console.log('\n=== ADDITIONAL STATISTICS ===');
    console.log(`Single-genre movies: ${singleGenreMovies} combinations`);
    console.log(`Multi-genre movies: ${multiGenreMovies} combinations`);
    
    // Most common genre count
    const genreCountDistribution = new Map();
    combinationStats.forEach(item => {
        const genreCount = item.combination.split(',').length;
        if (genreCountDistribution.has(genreCount)) {
            genreCountDistribution.set(genreCount, genreCountDistribution.get(genreCount) + item.count);
        } else {
            genreCountDistribution.set(genreCount, item.count);
        }
    });
    
    console.log('\n=== MOVIES BY NUMBER OF GENRES ===');
    Array.from(genreCountDistribution.entries())
        .sort((a, b) => a[0] - b[0])
        .forEach(([count, movies]) => {
            const percentage = ((movies / totalMovies) * 100).toFixed(2);
            console.log(`${count} genre${count > 1 ? 's' : ''}: ${movies} movies (${percentage}%)`);
        });
}

async function main() {
    try {
        if (!fs.existsSync(inputFile)) {
            throw new Error(`Input file not found: ${inputFile}`);
        }
        
        await analyzeGenreDistribution();
        
    } catch (error) {
        console.error('Error during analysis:', error.message);
        process.exit(1);
    }
}

main();
