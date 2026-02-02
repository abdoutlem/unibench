#!/usr/bin/env python3
"""
Test script to verify the extract endpoint works correctly.
"""

import requests
import sys

API_URL = "http://localhost:8000/api/v1"

def test_extract_with_file_id():
    """Test extraction using file_id."""
    print("Testing extraction with file_id...")
    
    # First, upload a test file
    print("\n1. Uploading test file...")
    with open("test.txt", "w") as f:
        f.write("Financial Report 2024\nTotal Operating Revenue: $1,234,567,890\nNet Income: $500,000,000")
    
    with open("test.txt", "rb") as f:
        files = {"file": ("test.txt", f, "text/plain")}
        response = requests.post(f"{API_URL}/upload", files=files)
    
    if response.status_code != 200:
        print(f"Upload failed: {response.status_code}")
        print(response.text)
        return False
    
    uploaded_file = response.json()
    file_id = uploaded_file["id"]
    print(f"✓ File uploaded: {file_id}")
    
    # Now extract using file_id
    print("\n2. Extracting data using file_id...")
    form_data = {
        "rule_ids": "rule-total-revenue",
        "method": "hybrid",
        "file_id": file_id
    }
    
    response = requests.post(f"{API_URL}/extract", data=form_data)
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"✓ Extraction successful!")
        print(f"  Job ID: {result['id']}")
        print(f"  Results: {len(result.get('results', []))}")
        return True
    else:
        print(f"✗ Extraction failed:")
        print(response.text)
        return False

def test_extract_with_file():
    """Test extraction with direct file upload."""
    print("\nTesting extraction with direct file upload...")
    
    with open("test.txt", "rb") as f:
        files = {"file": ("test.txt", f, "text/plain")}
        form_data = {
            "rule_ids": "rule-total-revenue",
            "method": "hybrid"
        }
        response = requests.post(f"{API_URL}/extract", files=files, data=form_data)
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"✓ Extraction successful!")
        print(f"  Job ID: {result['id']}")
        print(f"  Results: {len(result.get('results', []))}")
        return True
    else:
        print(f"✗ Extraction failed:")
        print(response.text)
        return False

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "file":
        test_extract_with_file()
    elif len(sys.argv) > 1 and sys.argv[1] == "file_id":
        test_extract_with_file_id()
    else:
        print("Testing both methods...")
        test_extract_with_file()
        test_extract_with_file_id()
