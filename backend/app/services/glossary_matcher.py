"""Service for matching extracted text to glossary metrics."""

import logging
from typing import List, Optional
from rapidfuzz import fuzz, process
from app.models.glossary import GlossaryMetric, MetricDomain, GlossaryMatch
from app.services.glossary_loader import GlossaryLoader

logger = logging.getLogger(__name__)


class GlossaryMatcher:
    """Matches extracted text to glossary metric definitions."""

    def __init__(self, glossary_loader: GlossaryLoader):
        """Initialize glossary matcher."""
        self.glossary_loader = glossary_loader
        self._build_search_index()

    def _build_search_index(self) -> None:
        """Build search index for fast matching."""
        self.glossary_loader.load_all()
        self._metrics = self.glossary_loader.get_all_metrics()
        self._search_terms: List[tuple[str, GlossaryMetric]] = []
        
        for metric in self._metrics:
            if not metric.is_active:
                continue
            
            # Add canonical name
            self._search_terms.append((metric.canonical_name.lower(), metric))
            
            # Add semantic variations
            for variation in metric.semantic_variations:
                self._search_terms.append((variation.lower(), metric))
            
            # Add name
            if metric.name.lower() != metric.canonical_name.lower():
                self._search_terms.append((metric.name.lower(), metric))

    def match_text(
        self,
        text: str,
        domain: Optional[MetricDomain] = None,
        limit: int = 10,
        min_confidence: float = 0.5
    ) -> List[GlossaryMatch]:
        """Match text to glossary metrics using fuzzy matching."""
        if not text or not text.strip():
            return []
        
        text_lower = text.lower().strip()
        matches: List[GlossaryMatch] = []
        seen_metrics: set[str] = set()
        
        # Use rapidfuzz to find best matches
        # Extract potential metric names from text
        words = text_lower.split()
        
        # Try matching against all search terms
        for search_term, metric in self._search_terms:
            if domain and metric.domain != domain:
                continue
            
            if metric.id in seen_metrics:
                continue
            
            # Calculate similarity scores
            ratio = fuzz.ratio(text_lower, search_term) / 100.0
            partial_ratio = fuzz.partial_ratio(text_lower, search_term) / 100.0
            token_sort_ratio = fuzz.token_sort_ratio(text_lower, search_term) / 100.0
            
            # Use highest score
            confidence = max(ratio, partial_ratio, token_sort_ratio)
            
            # Boost confidence if search term appears in text
            if search_term in text_lower:
                confidence = min(1.0, confidence + 0.2)
            
            # Check if any word from search term appears in text
            search_words = set(search_term.split())
            text_words = set(words)
            if search_words.intersection(text_words):
                confidence = min(1.0, confidence + 0.1)
            
            if confidence >= min_confidence:
                # Determine which variation matched
                matched_variation = None
                if search_term != metric.canonical_name.lower():
                    matched_variation = search_term
                
                match = GlossaryMatch(
                    metric_id=metric.id,
                    metric_name=metric.canonical_name,
                    domain=metric.domain,
                    matched_text=text,
                    confidence=confidence,
                    matched_variation=matched_variation,
                    context=None
                )
                matches.append(match)
                seen_metrics.add(metric.id)
        
        # Sort by confidence descending
        matches.sort(key=lambda x: x.confidence, reverse=True)
        
        # Return top matches
        return matches[:limit]

    def match_metric_name(
        self,
        metric_name: str,
        domain: Optional[MetricDomain] = None,
        min_confidence: float = 0.7
    ) -> Optional[GlossaryMatch]:
        """Match a specific metric name to a glossary entry."""
        matches = self.match_text(metric_name, domain=domain, limit=1, min_confidence=min_confidence)
        return matches[0] if matches else None

    def get_best_match(
        self,
        text: str,
        domain: Optional[MetricDomain] = None,
        min_confidence: float = 0.6
    ) -> Optional[GlossaryMatch]:
        """Get the best matching metric for given text."""
        matches = self.match_text(text, domain=domain, limit=1, min_confidence=min_confidence)
        return matches[0] if matches else None

    def reload(self) -> None:
        """Reload glossary and rebuild search index."""
        self.glossary_loader.reload()
        self._build_search_index()
        logger.info("Glossary matcher reloaded and search index rebuilt")
