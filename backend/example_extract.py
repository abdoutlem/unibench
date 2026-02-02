#!/usr/bin/env python3
"""
Example script to extract data from a file using the UniBench API.

Usage:
    python example_extract.py <file_path> [rule_ids]

Example:
    python example_extract.py document.pdf rule-total-revenue,rule-net-income
"""

import sys
import requests
import json
from pathlib import Path


def extract_from_file(file_path: str, rule_ids: str = "rule-total-revenue", method: str = "HYBRID"):
    """
    Extract data from a file using the UniBench extraction API.
    
    Args:
        file_path: Path to the file to extract data from
        rule_ids: Comma-separated list of rule IDs (default: rule-total-revenue)
        method: Extraction method - HYBRID, RULE_BASED, or AI (default: HYBRID)
    """
    url = "http://localhost:8000/api/v1/extract"
    
    # Check if file exists
    file = Path(file_path)
    if not file.exists():
        print(f"Error: File not found: {file_path}")
        return None
    
    print(f"Extracting data from: {file_path}")
    print(f"Using rules: {rule_ids}")
    print(f"Method: {method}")
    print("-" * 50)
    
    try:
        # Prepare the file and parameters
        with open(file, 'rb') as f:
            files = {
                'file': (file.name, f, 'application/octet-stream')
            }
            data = {
                'rule_ids': rule_ids,
                'method': method
            }
            
            # Make the request
            response = requests.post(url, files=files, data=data)
            response.raise_for_status()
            
            result = response.json()
            
            # Display results
            print(f"\n✅ Extraction completed!")
            print(f"Job ID: {result.get('id')}")
            print(f"Status: {result.get('status')}")
            print(f"Progress: {result.get('progress')}%")
            print("\n📊 Extraction Results:")
            print("=" * 50)
            
            if result.get('results'):
                for idx, res in enumerate(result['results'], 1):
                    print(f"\n{idx}. {res.get('metric_name', 'Unknown Metric')}")
                    print(f"   Extracted Value: {res.get('extracted_value', 'N/A')}")
                    print(f"   Normalized Value: {res.get('normalized_value', 'N/A')}")
                    print(f"   Unit: {res.get('unit', 'N/A')}")
                    print(f"   Confidence: {res.get('confidence', 0):.2%}")
                    print(f"   Status: {res.get('status', 'N/A')}")
                    
                    if res.get('source'):
                        source = res['source']
                        print(f"   Matched Pattern: {source.get('matched_pattern', 'N/A')}")
                        if source.get('context'):
                            context = source['context'][:100]
                            print(f"   Context: {context}...")
                    
                    if res.get('notes'):
                        print(f"   Notes: {res.get('notes')}")
            else:
                print("No results found.")
            
            if result.get('errors'):
                print("\n⚠️  Errors:")
                for error in result['errors']:
                    print(f"   - {error}")
            
            return result
            
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to the API server.")
        print("   Make sure the backend server is running:")
        print("   cd backend && uvicorn app.main:app --reload")
        return None
    except requests.exceptions.HTTPError as e:
        print(f"❌ HTTP Error: {e}")
        try:
            error_detail = response.json()
            print(f"   Details: {error_detail.get('detail', 'Unknown error')}")
        except:
            print(f"   Response: {response.text}")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None


def list_available_rules():
    """List all available extraction rules."""
    url = "http://localhost:8000/api/v1/rules"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        rules = response.json()
        
        print("📋 Available Extraction Rules:")
        print("=" * 50)
        for rule in rules:
            print(f"\nID: {rule['id']}")
            print(f"Name: {rule['name']}")
            print(f"Description: {rule.get('description', 'N/A')}")
            print(f"Unit: {rule.get('unit', 'N/A')}")
            print(f"Method: {rule.get('extraction_method', 'N/A')}")
        
        return rules
    except Exception as e:
        print(f"❌ Error listing rules: {e}")
        return None


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python example_extract.py <file_path> [rule_ids] [method]")
        print("\nExample:")
        print("  python example_extract.py document.pdf")
        print("  python example_extract.py document.pdf rule-total-revenue,rule-net-income")
        print("  python example_extract.py document.pdf rule-total-revenue RULE_BASED")
        print("\nTo list available rules:")
        print("  python example_extract.py --list-rules")
        sys.exit(1)
    
    if sys.argv[1] == "--list-rules":
        list_available_rules()
        sys.exit(0)
    
    file_path = sys.argv[1]
    rule_ids = sys.argv[2] if len(sys.argv) > 2 else "rule-total-revenue"
    method = sys.argv[3] if len(sys.argv) > 3 else "HYBRID"
    
    extract_from_file(file_path, rule_ids, method)
