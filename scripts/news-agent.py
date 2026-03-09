#!/usr/bin/env python3
"""
News aggregation agent using Ollama (self-hosted LLM).
Replaces anthropics/claude-code-action for cost savings.
"""
import os
import sys
import json
import requests
from datetime import datetime

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")

def call_ollama(prompt: str) -> str:
    """Call Ollama API with streaming disabled."""
    response = requests.post(
        f"{OLLAMA_URL}/api/generate",
        json={
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
        },
        timeout=300,
    )
    response.raise_for_status()
    return response.json()["response"]

def scrape_news_sources(sources: list[str]) -> str:
    """Fetch news from given URLs using curl."""
    articles = []
    for url in sources:
        try:
            result = os.popen(f'curl -sL "{url}"').read()
            articles.append(f"=== {url} ===\n{result[:5000]}\n")
        except Exception as e:
            print(f"Failed to fetch {url}: {e}", file=sys.stderr)
    return "\n".join(articles)

def main():
    sources = sys.argv[1:] if len(sys.argv) > 1 else []
    
    if not sources:
        print("Usage: news-agent.py <url1> <url2> ...", file=sys.stderr)
        sys.exit(1)
    
    print(f"Fetching news from {len(sources)} sources...")
    raw_content = scrape_news_sources(sources)
    
    prompt = f"""You are a news aggregation agent for Operation Epic Fury (US-Israel strikes on Iran, Feb 28 2026).

Analyze the following news sources and extract NEW military/diplomatic developments.

For each event, output JSON:
{{
  "title": "Brief headline",
  "description": "2-3 sentence summary",
  "timestamp": "ISO 8601 timestamp",
  "confidence": "confirmed|unconfirmed|disputed",
  "sources": [{{"name": "Reuters", "url": "https://..."}}],
  "sourceRegion": "us|eu|middle-east|asia|other"
}}

Only include events from the last 24 hours. Output JSON array.

NEWS CONTENT:
{raw_content[:15000]}
"""
    
    print("Calling Ollama...")
    response = call_ollama(prompt)
    
    # Extract JSON from response
    try:
        events = json.loads(response)
        print(json.dumps(events, indent=2))
    except json.JSONDecodeError:
        # LLM might wrap JSON in markdown
        if "```json" in response:
            json_str = response.split("```json")[1].split("```")[0].strip()
            events = json.loads(json_str)
            print(json.dumps(events, indent=2))
        else:
            print("Failed to parse LLM response as JSON", file=sys.stderr)
            print(response, file=sys.stderr)
            sys.exit(1)

if __name__ == "__main__":
    main()
