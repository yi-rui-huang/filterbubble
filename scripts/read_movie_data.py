#!/usr/bin/env python3
"""
Script to read and display movie ratings and directors from TSV files
based on tconst (movie ID) field.

Usage:
    python read_movie_data.py [options]

Options:
    --limit N        Limit output to N movies (default: 20)
    --min-rating N   Filter movies with rating >= N
    --min-votes N    Filter movies with votes >= N
    --sort-by FIELD  Sort by field (rating, votes, default: rating)
    --desc           Sort in descending order (default)
    --asc            Sort in ascending order
"""

import csv
import os
import sys
import argparse

def read_ratings(ratings_file):
    """Read ratings data from TSV file and return a dictionary with tconst as key."""
    ratings_data = {}
    with open(ratings_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f, delimiter='\t')
        next(reader)  # Skip header
        for row in reader:
            if len(row) >= 3:
                tconst = row[0]
                avg_rating = row[1]
                num_votes = row[2]
                ratings_data[tconst] = {
                    'averageRating': avg_rating,
                    'numVotes': num_votes
                }
    return ratings_data

def read_crew(crew_file):
    """Read crew data from TSV file and return a dictionary with tconst as key."""
    crew_data = {}
    with open(crew_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f, delimiter='\t')
        next(reader)  # Skip header
        for row in reader:
            if len(row) >= 3:
                tconst = row[0]
                directors = row[1]
                writers = row[2]
                crew_data[tconst] = {
                    'directors': directors if directors != '\\N' else 'N/A',
                    'writers': writers if writers != '\\N' else 'N/A'
                }
    return crew_data

def merge_data(ratings_data, crew_data, args):
    """Merge ratings and crew data and return a list of combined records."""
    merged_data = []
    
    # Get common tconst values
    common_tconsts = set(ratings_data.keys()).intersection(set(crew_data.keys()))
    
    for tconst in common_tconsts:
        try:
            avg_rating = float(ratings_data[tconst]['averageRating'])
            num_votes = int(ratings_data[tconst]['numVotes'])
            
            # Apply filters
            if avg_rating < args.min_rating or num_votes < args.min_votes:
                continue
                
            merged_data.append({
                'tconst': tconst,
                'averageRating': avg_rating,
                'numVotes': num_votes,
                'directors': crew_data[tconst]['directors'],
                'writers': crew_data[tconst]['writers']
            })
        except (ValueError, TypeError):
            # Skip entries with invalid ratings or votes
            continue
    
    # Sort data
    sort_key = 'averageRating' if args.sort_by == 'rating' else 'numVotes'
    reverse_sort = not args.asc  # Default is descending
    merged_data.sort(key=lambda x: x[sort_key], reverse=reverse_sort)
    
    # Apply limit
    return merged_data[:args.limit]

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Read and display movie ratings and directors')
    parser.add_argument('--limit', type=int, default=20, help='Limit output to N movies (default: 20)')
    parser.add_argument('--min-rating', type=float, default=0.0, help='Filter movies with rating >= N')
    parser.add_argument('--min-votes', type=int, default=0, help='Filter movies with votes >= N')
    parser.add_argument('--sort-by', choices=['rating', 'votes'], default='rating', 
                        help='Sort by field (rating, votes, default: rating)')
    
    # Create a mutually exclusive group for sort order
    sort_group = parser.add_mutually_exclusive_group()
    sort_group.add_argument('--desc', dest='asc', action='store_false', help='Sort in descending order (default)')
    sort_group.add_argument('--asc', dest='asc', action='store_true', help='Sort in ascending order')
    parser.set_defaults(asc=False)
    
    return parser.parse_args()

def main():
    # Parse command line arguments
    args = parse_arguments()
    
    # Define file paths
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ratings_file = os.path.join(base_dir, 'src', 'data', 'title.ratings.tsv')
    crew_file = os.path.join(base_dir, 'src', 'data', 'title.crew.tsv')
    
    # Check if files exist
    if not os.path.exists(ratings_file):
        print(f"Error: Ratings file not found at {ratings_file}")
        sys.exit(1)
    if not os.path.exists(crew_file):
        print(f"Error: Crew file not found at {crew_file}")
        sys.exit(1)
    
    print("Reading ratings data...")
    ratings_data = read_ratings(ratings_file)
    print(f"Found {len(ratings_data)} ratings entries")
    
    print("Reading crew data...")
    crew_data = read_crew(crew_file)
    print(f"Found {len(crew_data)} crew entries")
    
    print(f"Merging data with filters: min_rating={args.min_rating}, min_votes={args.min_votes}")
    print(f"Sorting by {args.sort_by} in {'ascending' if args.asc else 'descending'} order")
    merged_data = merge_data(ratings_data, crew_data, args)
    
    # Display results
    print("\n{:<10} {:<15} {:<10} {:<20}".format("tconst", "Rating (Votes)", "Directors", "Writers"))
    print("-" * 60)
    
    for item in merged_data:
        print("{:<10} {:<15} {:<10} {:<20}".format(
            item['tconst'],
            f"{item['averageRating']:.1f} ({item['numVotes']})",
            item['directors'],
            item['writers'][:20] + ('...' if len(item['writers']) > 20 else '')
        ))
    
    print(f"\nShowing {len(merged_data)} movies out of {len(ratings_data)} total movies")

if __name__ == "__main__":
    main()
