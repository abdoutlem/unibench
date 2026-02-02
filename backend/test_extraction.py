#!/usr/bin/env python3
"""
Test script for PDF extraction functionality.
This script demonstrates the extraction flow and shows extracted data before applying rules.
"""

import sys
import logging
from pathlib import Path

# Add the app directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.document_parser import DocumentParser
from app.services.extraction_service import ExtractionService
from app.services.rule_extractor import RuleBasedExtractor
from app.models import ExtractionMethod
from app.api.mock_data import MOCK_RULES

# Configure logging to see extraction details
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

logger = logging.getLogger(__name__)


def test_pdf_extraction(file_path: str):
    """Test PDF extraction with detailed logging."""
    print("=" * 80)
    print("PDF EXTRACTION TEST")
    print("=" * 80)
    
    file_path = Path(file_path)
    if not file_path.exists():
        print(f"ERROR: File not found: {file_path}")
        return
    
    print(f"\nFile: {file_path}")
    print(f"Size: {file_path.stat().st_size / 1024:.2f} KB")
    
    # Step 1: Parse the PDF
    print("\n" + "=" * 80)
    print("STEP 1: PARSING PDF")
    print("=" * 80)
    
    parser = DocumentParser()
    
    try:
        with open(file_path, "rb") as f:
            content = f.read()
        
        doc = parser.parse(file_path.name, content)
        
        print(f"\n✓ Document parsed successfully!")
        print(f"  - Filename: {doc.filename}")
        print(f"  - File type: {doc.file_type}")
        print(f"  - Pages: {len(doc.pages)}")
        print(f"  - Tables: {len(doc.tables)}")
        print(f"  - Total characters: {len(doc.text)}")
        print(f"  - Metadata: {doc.metadata}")
        
        # Show extracted text preview
        print("\n" + "-" * 80)
        print("EXTRACTED TEXT PREVIEW (first 1000 characters):")
        print("-" * 80)
        preview = doc.text[:1000].replace('\n', ' ')
        print(preview)
        if len(doc.text) > 1000:
            print(f"\n... ({len(doc.text) - 1000} more characters)")
        
        # Show pages
        if doc.pages:
            print(f"\n" + "-" * 80)
            print(f"PAGE BREAKDOWN:")
            print("-" * 80)
            for i, page_text in enumerate(doc.pages[:3], 1):  # Show first 3 pages
                print(f"\nPage {i} ({len(page_text)} characters):")
                print(page_text[:300].replace('\n', ' '))
                if len(page_text) > 300:
                    print("...")
        
        # Show tables
        if doc.tables:
            print(f"\n" + "-" * 80)
            print(f"TABLES FOUND:")
            print("-" * 80)
            for i, table in enumerate(doc.tables[:2], 1):  # Show first 2 tables
                print(f"\nTable {i} (Page {table.get('page', '?')}):")
                if table.get('data'):
                    print(f"  Rows: {len(table['data'])}")
                    if table['data']:
                        print(f"  First row: {table['data'][0]}")
        
    except Exception as e:
        print(f"\n✗ Error parsing PDF: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Step 2: Test extraction with different methods
    print("\n" + "=" * 80)
    print("STEP 2: TESTING EXTRACTION METHODS")
    print("=" * 80)
    
    # Get a test rule
    test_rule = MOCK_RULES[0] if MOCK_RULES else None
    if not test_rule:
        print("No extraction rules available")
        return
    
    print(f"\nUsing rule: {test_rule.name}")
    print(f"  - Target metric: {test_rule.target_metric_name}")
    print(f"  - Unit: {test_rule.unit}")
    print(f"  - Patterns: {len(test_rule.patterns)}")
    
    extraction_service = ExtractionService(use_mock_ai=True)
    
    # Test RULE_BASED method
    print("\n" + "-" * 80)
    print("METHOD: RULE_BASED")
    print("-" * 80)
    
    try:
        results = extraction_service.process_document(
            file_path=str(file_path),
            file_content=None,
            rules=[test_rule],
            method=ExtractionMethod.RULE_BASED,
            document_id="test",
            job_id="test-job-1"
        )
        
        print(f"\n✓ Rule-based extraction completed!")
        print(f"  - Results found: {len(results)}")
        for result in results:
            print(f"\n  Result:")
            print(f"    - Metric: {result.metric_name}")
            print(f"    - Extracted value: {result.extracted_value}")
            print(f"    - Normalized value: {result.normalized_value}")
            print(f"    - Confidence: {result.confidence:.2%}")
            print(f"    - Source pattern: {result.source.matched_pattern if result.source else 'N/A'}")
    except Exception as e:
        print(f"\n✗ Error in rule-based extraction: {e}")
        import traceback
        traceback.print_exc()
    
    # Test HYBRID method
    print("\n" + "-" * 80)
    print("METHOD: HYBRID")
    print("-" * 80)
    
    try:
        results = extraction_service.process_document(
            file_path=str(file_path),
            file_content=None,
            rules=[test_rule],
            method=ExtractionMethod.HYBRID,
            document_id="test",
            job_id="test-job-2"
        )
        
        print(f"\n✓ Hybrid extraction completed!")
        print(f"  - Results found: {len(results)}")
        for result in results:
            print(f"\n  Result:")
            print(f"    - Metric: {result.metric_name}")
            print(f"    - Extracted value: {result.extracted_value}")
            print(f"    - Normalized value: {result.normalized_value}")
            print(f"    - Confidence: {result.confidence:.2%}")
            print(f"    - Source pattern: {result.source.matched_pattern if result.source else 'N/A'}")
    except Exception as e:
        print(f"\n✗ Error in hybrid extraction: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 80)
    print("TEST COMPLETE")
    print("=" * 80)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_extraction.py <path_to_pdf_file>")
        print("\nExample:")
        print("  python test_extraction.py sample.pdf")
        sys.exit(1)
    
    test_pdf_extraction(sys.argv[1])
