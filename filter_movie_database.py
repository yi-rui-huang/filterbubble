#!/usr/bin/env python3
"""
Filter movie database to remove:
1. Movies with empty genres (\\N or empty)
2. Movies with startYear >= 2026
3. Movies with runtimeMinutes < 60
4. Movies with startYear < 1970
5. Movies with empty runtimeMinutes (\\N or empty)
"""

import csv
import sys

def filter_movie_database(input_file, output_file):
    """Filter the movie database according to specified criteria."""
    
    filtered_count = 0
    total_count = 0
    empty_genres_count = 0
    future_years_count = 0
    short_runtime_count = 0
    old_movies_count = 0
    empty_runtime_count = 0
    
    print(f"开始处理电影数据库: {input_file}")
    
    with open(input_file, 'r', encoding='utf-8') as infile, \
         open(output_file, 'w', encoding='utf-8', newline='') as outfile:
        
        # Use tab delimiter for TSV files
        reader = csv.DictReader(infile, delimiter='\t')
        writer = csv.DictWriter(outfile, fieldnames=reader.fieldnames, delimiter='\t')
        
        # Write header
        writer.writeheader()
        
        for row in reader:
            total_count += 1
            
            # Check if genres is empty or \N
            genres = row.get('genres', '').strip()
            if not genres or genres == '\\N':
                empty_genres_count += 1
                continue
            
            # Check if startYear >= 2026 or startYear < 1970
            start_year = row.get('startYear', '').strip()
            try:
                if start_year and start_year != '\\N':
                    year = int(start_year)
                    if year >= 2026:
                        future_years_count += 1
                        continue
                    if year < 1970:
                        old_movies_count += 1
                        continue
            except ValueError:
                # If year is not a valid integer, skip this check
                pass
            
            # Check if runtimeMinutes is empty or < 60
            runtime = row.get('runtimeMinutes', '').strip()
            if not runtime or runtime == '\\N':
                empty_runtime_count += 1
                continue
            try:
                runtime_minutes = int(runtime)
                if runtime_minutes < 60:
                    short_runtime_count += 1
                    continue
            except ValueError:
                # If runtime is not a valid integer, treat as empty
                empty_runtime_count += 1
                continue
            
            # If we reach here, the movie passes all filters
            writer.writerow(row)
            filtered_count += 1
            
            # Progress indicator
            if total_count % 50000 == 0:
                print(f"已处理 {total_count} 条记录，保留 {filtered_count} 条")
    
    print(f"\n筛选完成!")
    print(f"总记录数: {total_count}")
    print(f"保留记录数: {filtered_count}")
    print(f"删除的空类型记录: {empty_genres_count}")
    print(f"删除的未来年份记录: {future_years_count}")
    print(f"删除的短时长记录(<60分钟): {short_runtime_count}")
    print(f"删除的1970年前记录: {old_movies_count}")
    print(f"删除的空时长记录: {empty_runtime_count}")
    print(f"总删除记录数: {empty_genres_count + future_years_count + short_runtime_count + old_movies_count + empty_runtime_count}")
    print(f"筛选后的文件: {output_file}")

if __name__ == "__main__":
    input_file = "/home/hyr/115/filterbubble/src/data/title.basics.movie.tsv"
    output_file = "/home/hyr/115/filterbubble/src/data/title.basics.movie.filtered.tsv"
    
    try:
        filter_movie_database(input_file, output_file)
    except FileNotFoundError:
        print(f"错误: 找不到输入文件 {input_file}")
        sys.exit(1)
    except Exception as e:
        print(f"处理过程中发生错误: {e}")
        sys.exit(1)
