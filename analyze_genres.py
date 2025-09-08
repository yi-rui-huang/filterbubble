#!/usr/bin/env python3
"""
Analyze movie genres from the TSV database file.
This script extracts all unique genres and counts movies per genre.
"""

import csv
from collections import Counter
import sys

def analyze_movie_genres(tsv_file_path):
    """
    Analyze the movie genres from the TSV file.
    
    Args:
        tsv_file_path (str): Path to the TSV file
        
    Returns:
        tuple: (genre_counts, total_movies, total_genres)
    """
    genre_counts = Counter()
    total_movies = 0
    
    try:
        with open(tsv_file_path, 'r', encoding='utf-8') as file:
            # Skip the header line
            next(file)
            
            for line in file:
                total_movies += 1
                # Split by tab to get columns
                columns = line.strip().split('\t')
                
                # The genres column is the last one (index 8)
                if len(columns) > 8:
                    genres_str = columns[8]
                    
                    # Skip if genres is \N (null value)
                    if genres_str != '\\N' and genres_str.strip():
                        # Split by comma to get individual genres
                        genres = [genre.strip() for genre in genres_str.split(',')]
                        
                        # Count each genre
                        for genre in genres:
                            if genre:  # Make sure genre is not empty
                                genre_counts[genre] += 1
    
    except FileNotFoundError:
        print(f"Error: File {tsv_file_path} not found.")
        return None, 0, 0
    except Exception as e:
        print(f"Error reading file: {e}")
        return None, 0, 0
    
    return genre_counts, total_movies, len(genre_counts)

def main():
    tsv_file = "/home/hyr/115/filterbubble/src/data/title.basics.movie.filtered.tsv"
    
    print("正在分析电影类型数据...")
    print("=" * 60)
    
    genre_counts, total_movies, total_genres = analyze_movie_genres(tsv_file)
    
    if genre_counts is None:
        return
    
    print(f"数据库统计信息:")
    print(f"- 总电影数量: {total_movies:,}")
    print(f"- 电影类型总数: {total_genres}")
    print()
    
    print("各电影类型及其电影数量 (按电影数量降序排列):")
    print("-" * 60)
    
    # Sort genres by count (descending)
    sorted_genres = genre_counts.most_common()
    
    for i, (genre, count) in enumerate(sorted_genres, 1):
        percentage = (count / total_movies) * 100
        print(f"{i:2d}. {genre:<20} {count:>8,} 部电影 ({percentage:5.2f}%)")
    
    print()
    print("=" * 60)
    print("分析完成!")

if __name__ == "__main__":
    main()
