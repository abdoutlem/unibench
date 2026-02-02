"""Main extraction orchestration service."""

import uuid
import logging
from datetime import datetime
from typing import Optional

from app.models import (
    ExtractionRule,
    ExtractionJob,
    ExtractionResult,
    ExtractionMethod,
    ResultStatus,
    AIConfig,
    FactMetric,
)
from app.services.document_parser import DocumentParser, ParsedDocument
from app.services.rule_extractor import RuleBasedExtractor
from app.services.ai_extractor import AIExtractor, MockAIExtractor
from app.services.glossary_loader import get_glossary_loader
from app.services.glossary_matcher import GlossaryMatcher
from app.services.data_storage import get_data_storage
from app.core.config import settings

logger = logging.getLogger(__name__)


class ExtractionService:
    """Orchestrates document extraction using rules and/or AI."""

    def __init__(self, ai_config: Optional[AIConfig] = None, use_mock_ai: bool = True):
        self.parser = DocumentParser()
        self.rule_extractor = RuleBasedExtractor()
        
        # Initialize glossary loader and matcher
        self.glossary_loader = get_glossary_loader()
        self.glossary_loader.load_all()  # Ensure glossary is loaded
        self.glossary_matcher = GlossaryMatcher(self.glossary_loader)
        self.data_storage = get_data_storage()
        
        # Initialize AI config with defaults from settings if not provided
        if ai_config is None:
            # Force OpenAI provider
            self.ai_config = AIConfig(
                provider="openai",  # Force OpenAI
                model=settings.default_ai_model if "gpt" in settings.default_ai_model else "gpt-4-turbo-preview"
            )
            logger.info(f"AI Config: provider=openai, model={self.ai_config.model}")
        else:
            # Override provider to OpenAI
            self.ai_config = ai_config
            self.ai_config.provider = "openai"
            logger.info(f"AI Config: provider=openai (forced), model={self.ai_config.model}")

        # Use real AI if OpenAI API key is configured, otherwise use mock
        has_openai_key = bool(settings.openai_api_key)
        if use_mock_ai or not has_openai_key:
            logger.warning("⚠️  Using MockAIExtractor - configure OPENAI_API_KEY in .env to use real AI")
            self.ai_extractor = MockAIExtractor(self.ai_config, glossary_loader=self.glossary_loader)
        else:
            logger.info(f"✅ Using real OpenAI extraction with model: {self.ai_config.model}")
            # Pass glossary loader to AI extractor
            self.ai_extractor = AIExtractor(self.ai_config, glossary_loader=self.glossary_loader)

    def create_job(
        self,
        document_ids: list[str],
        rules: list[ExtractionRule],
        method: ExtractionMethod = ExtractionMethod.HYBRID,
        template_id: Optional[str] = None
    ) -> ExtractionJob:
        """Create a new extraction job."""
        return ExtractionJob(
            id=f"job-{uuid.uuid4().hex[:8]}",
            document_ids=document_ids,
            template_id=template_id,
            rule_ids=[r.id for r in rules],
            method=method,
            status="queued",
            progress=0.0,
            started_at=datetime.utcnow()
        )

    def process_document(
        self,
        file_path: str,
        file_content: Optional[bytes],
        rules: list[ExtractionRule],
        method: ExtractionMethod,
        document_id: str,
        job_id: str,
        preview_only: bool = False
    ) -> list[ExtractionResult]:
        """Process a single document and extract values."""
        logger.info(f"Processing document: {file_path} with method: {method.value}")
        logger.info(f"Applying {len(rules)} extraction rules")
        
        results = []

        # Parse document
        logger.info("Step 1: Parsing document...")
        doc = self.parser.parse(file_path, file_content)
        
        # Log extracted data for debugging
        logger.info(f"Document parsed: {doc.filename} ({doc.file_type})")
        logger.info(f"Extracted text length: {len(doc.text)} characters")
        logger.info(f"Number of pages: {len(doc.pages)}")
        logger.info(f"Number of tables: {len(doc.tables)}")
        
        # Show preview of extracted text
        preview_length = 1000
        text_preview = doc.text[:preview_length].replace('\n', ' ')
        logger.info(f"Extracted text preview (first {preview_length} chars): {text_preview}...")
        
        if doc.tables:
            logger.info(f"Tables found: {[t.get('page', '?') for t in doc.tables]}")

        # Apply extraction rules
        logger.info("Step 2: Applying extraction rules...")
        for rule_idx, rule in enumerate(rules, 1):
            logger.info(f"Rule {rule_idx}/{len(rules)}: {rule.name} (ID: {rule.id})")
            rule_results = self._extract_with_rule(doc, rule, method, document_id, job_id, preview_only)
            logger.info(f"Rule {rule.name}: Found {len(rule_results)} results")
            results.extend(rule_results)

        logger.info(f"Extraction complete: {len(results)} total results")
        return results

    def _extract_with_rule(
        self,
        doc: ParsedDocument,
        rule: ExtractionRule,
        method: ExtractionMethod,
        document_id: str,
        job_id: str,
        preview_only: bool = False
    ) -> list[ExtractionResult]:
        """Extract using a single rule."""
        rule_results = []  # All results from this rule
        best_result = None
        best_confidence = 0.0

        # Determine which methods to use based on extraction method
        use_rules = method in [ExtractionMethod.RULE_BASED, ExtractionMethod.HYBRID]
        use_ai = method in [ExtractionMethod.AI, ExtractionMethod.HYBRID]
        
        logger.debug(f"Extraction method: {method.value}, use_rules={use_rules}, use_ai={use_ai}")

        # Try rule-based extraction
        if use_rules:
            logger.debug(f"Applying rule-based extraction for: {rule.name}")
            rule_matches = self.rule_extractor.extract(doc.text, rule)
            logger.debug(f"Rule-based extraction found {len(rule_matches)} matches")
            
            for match_idx, match in enumerate(rule_matches):
                logger.debug(f"Match {match_idx + 1}: value={match.value}, confidence={match.confidence:.2f}")
                if match.confidence > best_confidence:
                    best_confidence = match.confidence
                    rule_result = ExtractionResult(
                        id=f"res-{uuid.uuid4().hex[:8]}",
                        job_id=job_id,
                        document_id=document_id,
                        document_name=doc.filename,
                        rule_id=rule.id,
                        metric_id=rule.target_metric_id,
                        metric_name=rule.target_metric_name,
                        extracted_value=match.value,
                        normalized_value=match.normalized_value,
                        unit=rule.unit,
                        confidence=match.confidence,
                        source=match.source,
                        status=ResultStatus.PENDING_REVIEW,
                        dimensions={}
                    )
                    rule_results.append(rule_result)
                    if match.confidence > best_confidence:
                        best_confidence = match.confidence
                        best_result = rule_result
                    logger.info(f"Rule-based result: {match.value} (confidence: {match.confidence:.2f})")

        # Try AI extraction if enabled
        if use_ai:
            # In HYBRID mode, use AI if no results or low confidence
            # In AI mode, always use AI
            should_use_ai = (
                method == ExtractionMethod.AI or 
                (method == ExtractionMethod.HYBRID and (best_result is None or best_confidence < 0.8))
            )
            
            if should_use_ai:
                logger.info(f"🤖 Starting AI extraction for rule: {rule.name} (ID: {rule.id})")
                logger.info(f"   Target metric: {rule.target_metric_name} ({rule.target_metric_id})")
                logger.info(f"   Document: {doc.filename}, Text length: {len(doc.text)} chars")
                try:
                    # Get glossary metric for enhanced extraction
                    glossary_metric = self.glossary_loader.get_metric(rule.target_metric_id)
                    if glossary_metric:
                        logger.info(f"   Glossary metric found: {glossary_metric.canonical_name} (Domain: {glossary_metric.domain.value})")
                    ai_results = self.ai_extractor.extract_sync(doc.text, rule, glossary_metric=glossary_metric)
                    logger.info(f"📊 AI extraction found {len(ai_results)} results")
                    
                    # Process ALL AI results, not just the best one
                    for ai_idx, ai_res in enumerate(ai_results):
                        logger.info(f"   Processing AI result {ai_idx + 1}/{len(ai_results)}: value={ai_res.value}, confidence={ai_res.confidence:.2f}")
                        logger.info(f"      Entity: {ai_res.entity_type}/{ai_res.entity_name}")
                        logger.info(f"      Geography: {ai_res.dimensions.get('geography') if ai_res.dimensions else 'N/A'}")
                        logger.info(f"      Location: {ai_res.dimensions.get('location') if ai_res.dimensions else 'N/A'}")
                        
                        # Use structured data from AI if available
                        metric_name = ai_res.metric_name or rule.target_metric_name
                        unit = ai_res.unit or rule.unit
                        
                        # Merge dimensions from AI result
                        dimension_values = {}
                        if ai_res.dimensions:
                            dimension_values.update(ai_res.dimensions)
                        if ai_res.fiscal_year:
                            dimension_values["fiscal_year"] = ai_res.fiscal_year
                        if doc.file_type:
                            dimension_values["document_type"] = doc.file_type
                        
                        # Create ExtractionResult for each AI result
                        ai_extraction_result = ExtractionResult(
                            id=f"res-{uuid.uuid4().hex[:8]}",
                            job_id=job_id,
                            document_id=document_id,
                            document_name=doc.filename,
                            rule_id=rule.id,
                            metric_id=rule.target_metric_id,
                            metric_name=metric_name,
                            extracted_value=str(ai_res.value) if ai_res.value else None,
                            normalized_value=ai_res.value,
                            unit=unit,
                            fiscal_year=ai_res.fiscal_year,
                            confidence=ai_res.confidence,
                            source=ai_res.source,
                            status=ResultStatus.PENDING_REVIEW,
                            notes=ai_res.notes,
                            dimensions=dimension_values  # Include geography and other dimensions
                        )
                        
                        # Add to results list
                        rule_results.append(ai_extraction_result)
                        
                        # Track best result for comparison with rule-based
                        if best_result is None or ai_res.confidence > best_confidence:
                            best_confidence = ai_res.confidence
                            best_result = ai_extraction_result
                        
                        logger.info(f"   ✅ Added AI result: {ai_res.value} (confidence: {ai_res.confidence:.2f}, geography: {dimension_values.get('geography', 'N/A')})")
                except Exception as e:
                    logger.warning(f"AI extraction failed: {e}")

        # Process all results for fact storage
        if rule_results:
            logger.info(f"📊 Processing {len(rule_results)} results for rule: {rule.name}")
            if best_result:
                logger.info(f"   Best result: {best_result.extracted_value} (confidence: {best_result.confidence:.2f})")
            
            # Get glossary metric for domain classification and fact storage
            glossary_metric = self.glossary_loader.get_metric(rule.target_metric_id)
            
            # Save ALL results to fact table if glossary metric exists and not in preview mode
            if not preview_only and glossary_metric:
                for result in rule_results:
                    if result.normalized_value is not None:
                        try:
                            # Extract fiscal year from result or document
                            fiscal_year = result.fiscal_year
                            if not fiscal_year:
                                # Try to extract from document filename or metadata
                                fiscal_year = datetime.now().year  # Default to current year
                            
                            # Build dimension values including geography from result
                            dimension_values = {
                                "fiscal_year": fiscal_year,
                                "document_type": doc.file_type,
                            }
                            
                            # Add geography and location from result dimensions if available
                            if result.dimensions:
                                if "geography" in result.dimensions:
                                    dimension_values["geography"] = result.dimensions["geography"]
                                if "location" in result.dimensions:
                                    dimension_values["location"] = result.dimensions["location"]
                                # Add any other dimensions
                                for key, value in result.dimensions.items():
                                    if key not in ["fiscal_year", "document_type", "geography", "location"]:
                                        dimension_values[key] = value
                            
                            # Create fact metric
                            fact = FactMetric(
                                id=f"fact-{uuid.uuid4().hex[:12]}",
                                entity_id=document_id,
                                metric_id=rule.target_metric_id,
                                domain=glossary_metric.domain,
                                dimension_values=dimension_values,
                                value=float(result.normalized_value),
                                unit=glossary_metric.unit,
                                confidence=result.confidence,
                                source_document_id=document_id,
                                extraction_job_id=job_id,
                                validation_status="pending_review",
                                notes=result.notes
                            )
                            
                            # Save fact
                            self.data_storage.save_extracted_fact(fact)
                            logger.info(f"   ✅ Saved fact: {result.normalized_value} (confidence: {result.confidence:.2f}, domain: {glossary_metric.domain.value})")
                        except Exception as e:
                            logger.warning(f"Failed to save fact for result {result.id}: {e}")
        else:
            logger.info(f"No results found for rule: {rule.name}")

        return rule_results

    def run_job(
        self,
        job: ExtractionJob,
        documents: dict[str, tuple[str, Optional[bytes]]],  # id -> (path, content)
        rules: list[ExtractionRule]
    ) -> ExtractionJob:
        """Run a complete extraction job."""
        job.status = "processing"
        job.started_at = datetime.utcnow()
        all_results = []
        errors = []

        total_docs = len(job.document_ids)

        for idx, doc_id in enumerate(job.document_ids):
            try:
                if doc_id not in documents:
                    errors.append({
                        "document_id": doc_id,
                        "message": "Document not found"
                    })
                    continue

                file_path, content = documents[doc_id]
                doc_results = self.process_document(
                    file_path=file_path,
                    file_content=content,
                    rules=rules,
                    method=job.method,
                    document_id=doc_id,
                    job_id=job.id
                )
                all_results.extend(doc_results)

            except Exception as e:
                errors.append({
                    "document_id": doc_id,
                    "message": str(e)
                })

            # Update progress
            job.progress = (idx + 1) / total_docs * 100

        job.results = all_results
        job.errors = errors
        job.status = "completed" if not errors else "completed"  # partial success
        job.completed_at = datetime.utcnow()

        return job
