#!/usr/bin/env python3
"""
Profile-based Recommendation System

This script loads user profiles from a JSON file and uses them to get personalized
recommendations from a large language model. It simulates different users based on
their profiles and generates recommendations tailored to each user.
"""

import json
import argparse
import random
import os
from typing import Dict, List, Any, Optional
import requests

# Try to import different LLM libraries, use what's available
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

try:
    from langchain.llms import OpenAI as LangchainOpenAI
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False


class ProfileRecommender:
    """A class to handle profile-based recommendations from LLMs."""
    
    def __init__(self, profiles_path: str, api_key: Optional[str] = None, base_url: Optional[str] = None, model: Optional[str] = None):
        """
        Initialize the recommender with profiles from a JSON file.
        
        Args:
            profiles_path: Path to the JSON file containing user profiles
            api_key: API key for the LLM service (optional)
            base_url: Base URL for the LLM API (optional)
            model: Model name to use (optional)
        """
        self.profiles_path = profiles_path
        self.profiles = self._load_profiles()
        
        # Default API configuration values from config.js
        # default_api_key = 'sk-5568c74f05f34ff89578c6c198c0f2bd'
        # default_base_url = 'https://api.deepseek.com/v1'
        # default_model = 'deepseek-chat'
        default_api_key= 'sk-GDdSWdIROKEoJUm0MRebZQf2SxGP2DO7LJCe0rfu8rYKlb5s'
        default_base_url = 'https://api.tao-shen.com/v1'
        default_model = 'gpt-4.1-mini'
        default_timeout = 30000  # 30 seconds timeout
        
        # Use provided values or defaults
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY") or default_api_key
        self.base_url = base_url or default_base_url
        self.model = model or default_model
        self.timeout = default_timeout / 1000  # Convert to seconds for Python requests
        
        # Check if API key is available
        if not self.api_key:
            print("Warning: No API key provided. Using default API key.")
        
        print(f"Using model: {self.model}")
        print(f"Using API base URL: {self.base_url}")
        print(f"API timeout: {self.timeout} seconds")
    
    def _load_profiles(self) -> Dict[str, Any]:
        """Load profiles from the JSON file."""
        try:
            with open(self.profiles_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Filter out profiles with empty summaries
            filtered_data = self._filter_empty_summaries(data)
            
            print(f"Successfully loaded {len(filtered_data) - 1} profiles from {self.profiles_path}")
            return filtered_data
        except Exception as e:
            print(f"Error loading profiles: {e}")
            return {"metadata": {"profiles_completed": 0, "total_profiles": 0, "status": "error"}}
    
    def _filter_empty_summaries(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Filter out profiles with empty summaries."""
        filtered_data = {}
        
        # Keep metadata if it exists
        if "metadata" in data:
            filtered_data["metadata"] = data["metadata"]
        
        profiles_removed = 0
        for key, value in data.items():
            if key == "metadata":
                continue
            
            # Check if this is a profile and has a Summary field
            if isinstance(value, dict):
                summary = value.get("Summary", "")
                if summary and summary.strip():  # Keep profiles with non-empty summaries
                    filtered_data[key] = value
                else:
                    profiles_removed += 1
                    print(f"Filtered out {key}: Summary is empty")
        
        print(f"Removed {profiles_removed} profiles with empty summaries")
        
        # Update metadata if it exists
        if "metadata" in filtered_data:
            original_count = filtered_data["metadata"].get("profiles_completed", 0)
            filtered_data["metadata"]["profiles_completed"] = len(filtered_data) - 1
            filtered_data["metadata"]["profiles_filtered"] = profiles_removed
        
        return filtered_data
    
    def list_profiles(self, limit: int = 10) -> List[str]:
        """
        List available profiles.
        
        Args:
            limit: Maximum number of profiles to list
            
        Returns:
            List of profile IDs
        """
        profile_ids = [key for key in self.profiles.keys() if key != "metadata"]
        
        if limit and limit < len(profile_ids):
            return profile_ids[:limit]
        return profile_ids
    
    def get_profile_summary(self, profile_id: str) -> str:
        """
        Get a summary of a specific profile.
        
        Args:
            profile_id: ID of the profile to summarize
            
        Returns:
            Summary of the profile
        """
        if profile_id not in self.profiles:
            return f"Profile {profile_id} not found"
        
        profile = self.profiles[profile_id]
        
        # Return the summary if available
        if "Summary" in profile:
            return profile["Summary"]
        
        # Otherwise, create a basic summary
        name = profile.get("Demographic Information", {}).get("Name", {}).get("Personal Name", "Unknown")
        age = profile.get("Demographic Information", {}).get("Age", {}).get("Current", "Unknown age")
        occupation = profile.get("Career and Work Identity", {}).get("ProfessionalRole", {}).get("Occupation", "Unknown occupation")
        
        return f"{name}, {age}, {occupation}"
    
    def get_profile_details(self, profile_id: str) -> Dict[str, Any]:
        """
        Get full details of a specific profile.
        
        Args:
            profile_id: ID of the profile to get details for
            
        Returns:
            Full profile details
        """
        if profile_id not in self.profiles:
            return {"error": f"Profile {profile_id} not found"}
        
        return self.profiles[profile_id]
    
    def create_user_prompt(self, profile_id: str, recommendation_type: str, history=None, round_num=1) -> str:
        """
        Create a prompt for the LLM based on the user profile and recommendation type.
        
        Args:
            profile_id: ID of the profile to use
            recommendation_type: Type of recommendation to request
            history: List of previous recommendation responses (optional)
            round_num: Current interaction round number (optional)
            
        Returns:
            Prompt for the LLM
        """
        if profile_id not in self.profiles:
            return f"Error: Profile {profile_id} not found"
        
        profile = self.profiles[profile_id]
        summary = profile.get("Summary", "")
        
        # Get basic demographic info
        demo_info = profile.get("Demographic Information", {})
        name = demo_info.get("Name", {}).get("Personal Name", "Unknown")
        age = demo_info.get("Age", {}).get("Current", "Unknown age")
        gender = demo_info.get("Gender", {}).get("SexualOrientation", "Unknown gender")
        
        # Get career info
        career_info = profile.get("Career and Work Identity", {})
        occupation = career_info.get("ProfessionalRole", {}).get("Occupation", "Unknown occupation")
        
        # Get interests
        interests = ""
        if "Interests and Activities" in profile:
            interests_dict = profile.get("Interests and Activities", {})
            interests_items = []
            
            # Extract interest items from various categories
            for category, details in interests_dict.items():
                if isinstance(details, dict):
                    for _, value in details.items():
                        if isinstance(value, str) and len(value) > 5:
                            interests_items.append(value)
            
            # Combine interests
            if interests_items:
                interests = "\nInterests:\n- " + "\n- ".join(interests_items[:5])
        
        # System instruction
        system_instruction = """You are a personalized recommendation system. Your task is to provide recommendations 
        that are specifically tailored to the user's profile. Each recommendation must be uniquely suited to 
        this specific user based on their demographics, interests, and background. 
        Avoid generic recommendations that could apply to anyone. Be specific and explain why each 
        recommendation is particularly suitable for this user."""
        
        # Build the base prompt
        prompt = f"""User Profile:

Name: {name}
Age: {age}
Gender: {gender}
Occupation: {occupation}{interests}

Profile Summary:
{summary}
"""
        
        # Add history context if available
        if history and len(history) > 0:
            history_context = "\nPrevious Recommendations:\n"
            for i, prev_rec in enumerate(history):
                # Extract just the first 150 characters of each previous recommendation to keep prompt size manageable
                short_rec = prev_rec[:150] + "..." if len(prev_rec) > 150 else prev_rec
                history_context += f"Round {i+1}: {short_rec}\n"
            prompt += history_context
            
            # Add feedback based on round number
            if round_num > 1:
                # For even rounds, add positive feedback
                if round_num % 2 == 0:
                    prompt += "\nUser enjoyed your previous recommendations but is looking for more variety."
                # For odd rounds, add constructive criticism
                else:
                    prompt += "\nUser found your previous recommendations too general and wants more personalized options."
        
        # Add the request
        prompt += f"\n\nRequest: Please provide {recommendation_type} recommendations for this specific user."
        
        # Add round-specific instructions
        if round_num > 1:
            prompt += " Avoid repeating previous recommendations and focus on new, diverse options."
        if round_num > 3:
            prompt += " The user is looking for more unique and tailored recommendations based on their specific profile details."
            
        prompt += "\n\nFor each recommendation, explain why it specifically fits this user's profile."
        
        return system_instruction, prompt
    
    def get_recommendation(self, profile_id: str, recommendation_type: str = "product", history=None, round_num=1) -> str:
        """
        Get recommendations for a specific profile.
        
        Args:
            profile_id: ID of the profile to get recommendations for
            recommendation_type: Type of recommendation to request (e.g., "product", "movie", "book")
            history: List of previous recommendation responses (optional)
            round_num: Current interaction round number (optional)
            
        Returns:
            Recommendations from the LLM
        """
        system_instruction, user_prompt = self.create_user_prompt(profile_id, recommendation_type, history, round_num)
        
        # Use OpenAI directly if available
        if OPENAI_AVAILABLE and self.api_key:
            openai.api_key = self.api_key
            
            # Set custom base URL if provided
            if self.base_url:
                openai.api_base = self.base_url
                
            try:
                response = openai.ChatCompletion.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": user_prompt}
                    ],
                    max_tokens=500,
                    temperature=0.7  # Add some randomness to avoid identical responses
                )
                return response.choices[0].message.content
            except Exception as e:
                return f"Error getting recommendation: {e}"
        
        # Use Langchain if available
        elif LANGCHAIN_AVAILABLE and self.api_key:
            try:
                # Configure Langchain with custom base URL if provided
                kwargs = {
                    "temperature": 0.7,
                    "openai_api_key": self.api_key,
                    "model_name": self.model
                }
                
                if self.base_url:
                    kwargs["openai_api_base"] = self.base_url
                    
                llm = LangchainOpenAI(**kwargs)
                # Combine system and user prompts for Langchain
                combined_prompt = f"{system_instruction}\n\n{user_prompt}"
                return llm(combined_prompt)
            except Exception as e:
                return f"Error getting recommendation: {e}"
        
        # If no LLM library is available, try a direct API call
        elif self.api_key and self.base_url:
            try:
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}"
                }
                
                payload = {
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": user_prompt}
                    ],
                    "max_tokens": 500,
                    "temperature": 0.7  # Add some randomness to avoid identical responses
                }
                
                # Determine the endpoint URL
                endpoint = f"{self.base_url}/chat/completions"
                if not self.base_url.endswith("/v1") and not "/chat/completions" in self.base_url:
                    endpoint = f"{self.base_url}/v1/chat/completions"
                
                response = requests.post(endpoint, headers=headers, json=payload, timeout=self.timeout)
                response.raise_for_status()
                result = response.json()
                
                return result["choices"][0]["message"]["content"]
            except Exception as e:
                return f"Error making direct API call: {e}"
        
        # If no LLM library is available, return the prompt
        else:
            return f"No LLM library or API configuration available. Here's the prompt that would be sent:\n\nSystem: {system_instruction}\n\nUser: {user_prompt}"


def main():
    """Main function to run the profile recommender."""
    parser = argparse.ArgumentParser(description="Get personalized recommendations based on user profiles")
    parser.add_argument("--profiles", default="/home/hyr/115/filterbubble/profiles/all_profiles_100_1.json", 
                        help="Path to the JSON file containing user profiles")
    parser.add_argument("--api-key", help="API key for the LLM service")
    parser.add_argument("--base-url", help="Base URL for the LLM API")
    parser.add_argument("--model", help="Model name to use")
    parser.add_argument("--list", action="store_true", help="List available profiles")
    parser.add_argument("--profile", help="ID of the profile to use")
    parser.add_argument("--random", action="store_true", help="Use a random profile")
    parser.add_argument("--summary", action="store_true", help="Show profile summary")
    parser.add_argument("--type", default="product", 
                        choices=["product", "movie", "book", "music", "restaurant", "travel"],
                        help="Type of recommendation to request")
    
    args = parser.parse_args()
    
    # Initialize the recommender
    recommender = ProfileRecommender(
        profiles_path=args.profiles, 
        api_key=args.api_key,
        base_url=args.base_url,
        model=args.model
    )
    
    # List profiles if requested
    if args.list:
        profiles = recommender.list_profiles()
        print("Available profiles:")
        for profile in profiles:
            print(f"- {profile}")
        return
    
    # Select a profile
    profile_id = None
    if args.random:
        profiles = recommender.list_profiles()
        profile_id = random.choice(profiles)
        print(f"Using random profile: {profile_id}")
    elif args.profile:
        profile_id = args.profile
    else:
        profiles = recommender.list_profiles(limit=5)
        print("Please select a profile or use --random to select a random profile")
        print("Available profiles (showing first 5):")
        for profile in profiles:
            print(f"- {profile}")
        return
    
    # Show profile summary if requested
    if args.summary:
        summary = recommender.get_profile_summary(profile_id)
        print(f"Profile Summary for {profile_id}:")
        print(summary)
    
    # Get recommendations
    print(f"\nGetting {args.type} recommendations for {profile_id}...")
    recommendations = recommender.get_recommendation(profile_id, args.type)
    print("\nRecommendations:")
    print(recommendations)


if __name__ == "__main__":
    main()
