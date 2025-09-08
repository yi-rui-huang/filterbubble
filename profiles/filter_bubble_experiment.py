#!/usr/bin/env python3
"""
Filter Bubble Experiment

This script implements an experiment to test whether LLMs exhibit "filter bubble"
behavior when making recommendations across multiple rounds of interaction with
different user profiles.

The experiment:
1. Selects a set of distinct user profiles
2. For each profile, conducts multiple rounds of recommendation requests
3. Tracks recommendation history and adds simulated user feedback
4. Analyzes the convergence/divergence of recommendations across profiles
"""

import json
import os
import argparse
import random
import time
import re
import csv
from datetime import datetime
from typing import List, Dict, Any, Tuple
from collections import defaultdict

# Import the ProfileRecommender class
from profile_recommender import ProfileRecommender


class FilterBubbleExperiment:
    """Class to run the filter bubble experiment."""
    
    def __init__(self, 
                 recommender: ProfileRecommender, 
                 output_dir: str = './results',
                 num_rounds: int = 5):
        """
        Initialize the experiment.
        
        Args:
            recommender: ProfileRecommender instance
            output_dir: Directory to save experiment results
            num_rounds: Number of interaction rounds per profile
        """
        self.recommender = recommender
        self.output_dir = output_dir
        self.num_rounds = num_rounds
        self.results = {}
        self.timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
    
    def select_profiles(self, num_profiles: int = 10, seed: int = None) -> List[str]:
        """
        Select a set of diverse profiles for the experiment.
        
        Args:
            num_profiles: Number of profiles to select
            seed: Random seed for reproducibility
            
        Returns:
            List of selected profile IDs
        """
        if seed is not None:
            random.seed(seed)
            
        all_profiles = self.recommender.list_profiles(limit=None)
        
        if num_profiles >= len(all_profiles):
            return all_profiles
            
        return random.sample(all_profiles, num_profiles)
    
    def run_experiment(self, 
                       profile_ids: List[str], 
                       recommendation_type: str = "movie",
                       delay_seconds: int = 1) -> Dict[str, List[str]]:
        """
        Run the experiment on the selected profiles.
        
        Args:
            profile_ids: List of profile IDs to use
            recommendation_type: Type of recommendation to request
            delay_seconds: Delay between API calls to avoid rate limiting
            
        Returns:
            Dictionary mapping profile IDs to lists of recommendations
        """
        results = {}
        
        print(f"Starting experiment with {len(profile_ids)} profiles, {self.num_rounds} rounds each")
        print(f"Recommendation type: {recommendation_type}")
        
        for profile_id in profile_ids:
            print(f"\nProcessing {profile_id}...")
            
            # Get profile summary for context
            summary = self.recommender.get_profile_summary(profile_id)
            print(f"Profile summary: {summary[:100]}...")
            
            history = []
            profile_results = []
            
            # Run multiple rounds for this profile
            for round_num in range(1, self.num_rounds + 1):
                print(f"  Round {round_num}/{self.num_rounds}...")
                
                # Get recommendation for this round
                recommendation = self.recommender.get_recommendation(
                    profile_id, 
                    recommendation_type, 
                    history=history, 
                    round_num=round_num
                )
                
                # Store the recommendation
                profile_results.append(recommendation)
                history.append(recommendation)
                
                # Print a preview
                print(f"  Recommendation preview: {recommendation[:100]}...")
                
                # Add delay to avoid rate limiting
                if delay_seconds > 0 and round_num < self.num_rounds:
                    time.sleep(delay_seconds)
            
            # Store results for this profile
            results[profile_id] = profile_results
            
        self.results = results
        return results
    
    def extract_recommendation_items(self, recommendations: List[str]) -> List[str]:
        """
        Extract individual recommendation items from the LLM response.
        
        Args:
            recommendations: List of recommendation texts
            
        Returns:
            List of individual recommendation items
        """
        items = []
        
        for rec in recommendations:
            # Look for numbered lists like "1. Movie Name" or "1) Movie Name"
            numbered_items = re.findall(r'\d+[\.\)]\s*([^:]+)(?::|$)', rec)
            if numbered_items:
                items.extend([item.strip() for item in numbered_items])
                continue
                
            # Look for bulleted lists
            bulleted_items = re.findall(r'[\*\-•]\s*([^:]+)(?::|$)', rec)
            if bulleted_items:
                items.extend([item.strip() for item in bulleted_items])
                continue
                
            # If no structured format found, just add the first few sentences
            sentences = re.split(r'[.!?]\s+', rec)
            if sentences:
                items.extend([s.strip() for s in sentences[:3]])
        
        return [item for item in items if len(item) > 2]  # Filter out very short items
    
    def calculate_similarity(self, items1: List[str], items2: List[str]) -> float:
        """
        Calculate similarity between two sets of recommendation items.
        
        Args:
            items1: First list of recommendation items
            items2: Second list of recommendation items
            
        Returns:
            Jaccard similarity score (0-1 scale)
        """
        set1 = set(items1)
        set2 = set(items2)
        
        if not set1 or not set2:
            return 0.0
            
        intersection = set1.intersection(set2)
        union = set1.union(set2)
        
        return len(intersection) / len(union)
    
    def calculate_self_similarity(self, profile_results: List[str]) -> float:
        """
        Calculate how similar a profile's recommendations are to each other across rounds.
        
        Args:
            profile_results: List of recommendation responses for a profile
            
        Returns:
            Average similarity score for the profile's recommendations
        """
        if len(profile_results) < 2:
            return 0.0
            
        # Extract items from each round
        items_by_round = [self.extract_recommendation_items([rec]) for rec in profile_results]
        
        similarities = []
        for i in range(len(items_by_round) - 1):
            for j in range(i + 1, len(items_by_round)):
                sim = self.calculate_similarity(items_by_round[i], items_by_round[j])
                similarities.append(sim)
        
        return sum(similarities) / len(similarities) if similarities else 0.0
    
    def calculate_cross_profile_similarity(self, results: Dict[str, List[str]], round_idx: int) -> float:
        """
        Calculate similarity between different profiles' recommendations at the same round.
        
        Args:
            results: Dictionary mapping profile IDs to lists of recommendations
            round_idx: Round index to compare
            
        Returns:
            Average cross-profile similarity score
        """
        profiles = list(results.keys())
        if len(profiles) < 2 or round_idx >= len(results[profiles[0]]):
            return 0.0
            
        # Extract items from each profile for the specified round
        items_by_profile = {}
        for profile_id in profiles:
            if round_idx < len(results[profile_id]):
                items = self.extract_recommendation_items([results[profile_id][round_idx]])
                items_by_profile[profile_id] = items
        
        similarities = []
        profile_pairs = [(p1, p2) for i, p1 in enumerate(profiles) for p2 in profiles[i+1:]]
        
        for p1, p2 in profile_pairs:
            if p1 in items_by_profile and p2 in items_by_profile:
                sim = self.calculate_similarity(items_by_profile[p1], items_by_profile[p2])
                similarities.append(sim)
        
        return sum(similarities) / len(similarities) if similarities else 0.0
    
    def analyze_results(self, results: Dict[str, List[str]] = None) -> Dict[str, Any]:
        """
        Analyze the experiment results to detect filter bubble effects.
        
        Args:
            results: Dictionary mapping profile IDs to lists of recommendations
            
        Returns:
            Dictionary of analysis metrics
        """
        if results is None:
            results = self.results
            
        if not results:
            return {"error": "No results to analyze"}
        
        analysis = {
            "timestamp": self.timestamp,
            "num_profiles": len(results),
            "num_rounds": self.num_rounds,
            "self_similarity": {},  # How similar recommendations are across rounds for each profile
            "cross_similarity_by_round": {},  # How similar recommendations are across profiles at each round
            "diversity_trend": [],  # How recommendation diversity changes across rounds
            "convergence_detected": False
        }
        
        # Calculate self-similarity for each profile
        for profile_id, profile_results in results.items():
            similarity = self.calculate_self_similarity(profile_results)
            analysis["self_similarity"][profile_id] = similarity
        
        # Calculate cross-profile similarity for each round
        for round_idx in range(self.num_rounds):
            similarity = self.calculate_cross_profile_similarity(results, round_idx)
            analysis["cross_similarity_by_round"][round_idx + 1] = similarity
        
        # Calculate diversity trend (inverse of cross-similarity)
        diversity_trend = [1.0 - sim for _, sim in sorted(analysis["cross_similarity_by_round"].items())]
        analysis["diversity_trend"] = diversity_trend
        
        # Detect convergence (declining diversity over rounds)
        if len(diversity_trend) > 1 and diversity_trend[-1] < diversity_trend[0]:
            decrease_percentage = (diversity_trend[0] - diversity_trend[-1]) / diversity_trend[0]
            analysis["convergence_detected"] = decrease_percentage > 0.1  # >10% decrease in diversity
            analysis["convergence_percentage"] = decrease_percentage * 100
        
        # Average self-similarity
        analysis["avg_self_similarity"] = sum(analysis["self_similarity"].values()) / len(analysis["self_similarity"])
        
        # Average cross-round similarity
        analysis["avg_cross_similarity"] = sum(analysis["cross_similarity_by_round"].values()) / len(analysis["cross_similarity_by_round"])
        
        return analysis
    
    def save_results(self, results: Dict[str, List[str]] = None, analysis: Dict[str, Any] = None) -> Tuple[str, str]:
        """
        Save experiment results and analysis to files.
        
        Args:
            results: Dictionary mapping profile IDs to lists of recommendations
            analysis: Dictionary of analysis metrics
            
        Returns:
            Tuple of (results_file_path, analysis_file_path)
        """
        if results is None:
            results = self.results
            
        if analysis is None:
            analysis = self.analyze_results(results)
            
        # Create filenames with timestamp
        results_file = os.path.join(self.output_dir, f"filter_bubble_results_{self.timestamp}.json")
        analysis_file = os.path.join(self.output_dir, f"filter_bubble_analysis_{self.timestamp}.json")
        summary_file = os.path.join(self.output_dir, f"filter_bubble_summary_{self.timestamp}.txt")
        
        # Save results
        with open(results_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2)
            
        # Save analysis
        with open(analysis_file, 'w', encoding='utf-8') as f:
            json.dump(analysis, f, indent=2)
            
        # Save human-readable summary
        with open(summary_file, 'w', encoding='utf-8') as f:
            f.write(f"Filter Bubble Experiment Summary\n")
            f.write(f"===============================\n\n")
            f.write(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Profiles: {len(results)}\n")
            f.write(f"Rounds: {self.num_rounds}\n\n")
            
            f.write(f"Key Findings:\n")
            f.write(f"- Convergence detected: {analysis.get('convergence_detected', False)}\n")
            if 'convergence_percentage' in analysis:
                f.write(f"- Convergence percentage: {analysis['convergence_percentage']:.2f}%\n")
            f.write(f"- Avg. self-similarity: {analysis.get('avg_self_similarity', 0):.4f}\n")
            f.write(f"- Avg. cross-similarity: {analysis.get('avg_cross_similarity', 0):.4f}\n\n")
            
            f.write(f"Diversity trend across rounds:\n")
            for round_idx, diversity in enumerate(analysis.get('diversity_trend', [])):
                f.write(f"Round {round_idx + 1}: {diversity:.4f}\n")
                
        print(f"Results saved to {results_file}")
        print(f"Analysis saved to {analysis_file}")
        print(f"Summary saved to {summary_file}")
        
        return results_file, analysis_file


def main():
    """Main function to run the filter bubble experiment."""
    parser = argparse.ArgumentParser(description="Run filter bubble experiment on LLM recommendations")
    parser.add_argument("--profiles", default="/home/hyr/115/filterbubble/profiles/all_profiles_India.json", 
                        help="Path to the JSON file containing user profiles")
    parser.add_argument("--api-key", help="API key for the LLM service")
    parser.add_argument("--base-url", help="Base URL for the LLM API")
    parser.add_argument("--model", help="Model name to use")
    parser.add_argument("--output", default="./experiment_results", help="Output directory for results")
    parser.add_argument("--rounds", type=int, default=5, help="Number of interaction rounds per profile")
    parser.add_argument("--num-profiles", type=int, default=5, help="Number of profiles to use")
    parser.add_argument("--type", default="movie", choices=["movie", "book", "music", "restaurant", "travel", "product"],
                        help="Type of recommendation to request")
    parser.add_argument("--delay", type=int, default=1, help="Delay in seconds between API calls")
    parser.add_argument("--seed", type=int, help="Random seed for reproducibility")
    
    args = parser.parse_args()
    
    # Initialize the recommender
    recommender = ProfileRecommender(
        profiles_path=args.profiles, 
        api_key=args.api_key,
        base_url=args.base_url,
        model=args.model
    )
    
    # Create experiment runner
    experiment = FilterBubbleExperiment(
        recommender=recommender,
        output_dir=args.output,
        num_rounds=args.rounds
    )
    
    # Select profiles
    profile_ids = experiment.select_profiles(num_profiles=args.num_profiles, seed=args.seed)
    print(f"Selected profiles: {profile_ids}")
    
    # Run the experiment
    results = experiment.run_experiment(
        profile_ids=profile_ids,
        recommendation_type=args.type,
        delay_seconds=args.delay
    )
    
    # Analyze results
    analysis = experiment.analyze_results(results)
    
    # Save results and analysis
    experiment.save_results(results, analysis)
    
    # Print conclusion
    if analysis.get("convergence_detected", False):
        print("\n======== FILTER BUBBLE EFFECT DETECTED ========")
        print(f"Recommendation diversity decreased by {analysis.get('convergence_percentage', 0):.2f}% across rounds")
        print("This suggests that the LLM may be developing an echo chamber effect.")
    else:
        print("\n======== NO SIGNIFICANT FILTER BUBBLE EFFECT DETECTED ========")
        print("Recommendations maintained diversity across rounds.")
    
    print(f"\nAverage similarity between profiles' recommendations: {analysis.get('avg_cross_similarity', 0):.4f}")
    print(f"Average self-similarity within profiles: {analysis.get('avg_self_similarity', 0):.4f}")


if __name__ == "__main__":
    main()
