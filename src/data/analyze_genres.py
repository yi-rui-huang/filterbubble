#!/usr/bin/env python3
import csv
from collections import Counter

def analyze_genre_distribution(file_path):
    # Dictionary to store genre counts
    genre_counts = Counter()
    total_movies = 0
    
    # Read the TSV file
    with open(file_path, 'r', encoding='utf-8') as file:
        reader = csv.reader(file, delimiter='\t')
        # Skip header
        next(reader)
        
        # Process each movie
        for row in reader:
            total_movies += 1
            # Genres are in the last column
            genres = row[-1].split(',')
            for genre in genres:
                if genre and genre != '\\N':  # Skip empty or null genres
                    genre_counts[genre] += 1
    
    # Sort genres by count in descending order
    sorted_genres = sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)
    
    # Print results
    print(f"Total number of movies: {total_movies}")
    print(f"Number of unique genres: {len(genre_counts)}")
    print("\nGenre distribution:")
    print("-" * 40)
    print(f"{'Genre':<20} {'Count':<10} {'Percentage':<10}")
    print("-" * 40)
    
    for genre, count in sorted_genres:
        percentage = (count / total_movies) * 100
        print(f"{genre:<20} {count:<10} {percentage:.2f}%")
    
    return genre_counts, total_movies

if __name__ == "__main__":
    file_path = "/home/hyr/115/filterbubble/src/data/title.basics.movie.filtered.tsv"
    analyze_genre_distribution(file_path)
