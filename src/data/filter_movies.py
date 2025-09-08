import json

def check_complete_data(item):
    # Check if movie_metadata contains all required fields
    if 'movie_metadata' not in item:
        return False
    metadata = item['movie_metadata']
    required_metadata_fields = ['title', 'year', 'matched_title', 'genres']
    if not all(field in metadata for field in required_metadata_fields):
        return False
    
    # Check if reviews contains all required fields
    if 'reviews' not in item:
        return False
    reviews = item['reviews']
    required_review_fields = ['movie', 'review1']
    if not all(field in reviews for field in required_review_fields):
        return False
    
    return True

def filter_movies():
    # Read the original JSON file
    with open('moives.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Filter out incomplete entries
    filtered_data = [item for item in data if check_complete_data(item)]
    
    # Write the filtered data to a new JSON file
    with open('filtered_movies.json', 'w', encoding='utf-8') as f:
        json.dump(filtered_data, f, indent=4, ensure_ascii=False)
    
    print(f"Original data count: {len(data)}")
    print(f"Filtered data count: {len(filtered_data)}")

if __name__ == "__main__":
    filter_movies()
