"""Rule-based extraction service."""

import re
from typing import Optional
from dataclasses import dataclass

try:
    from rapidfuzz import fuzz, process
    HAS_RAPIDFUZZ = True
except ImportError:
    HAS_RAPIDFUZZ = False

from app.models import (
    ExtractionRule,
    ExtractionPattern,
    SemanticMapping,
    PatternType,
    ExtractionSource,
)


@dataclass
class MatchResult:
    """Result of a pattern match."""
    value: str
    normalized_value: Optional[float]
    confidence: float
    source: ExtractionSource
    pattern_id: str


class RuleBasedExtractor:
    """Extracts data using configurable rules and patterns."""

    def __init__(self):
        self.currency_multipliers = {
            "k": 1_000,
            "K": 1_000,
            "m": 1_000_000,
            "M": 1_000_000,
            "mm": 1_000_000,
            "MM": 1_000_000,
            "b": 1_000_000_000,
            "B": 1_000_000_000,
            "billion": 1_000_000_000,
            "million": 1_000_000,
            "thousand": 1_000,
        }

    def extract(self, text: str, rule: ExtractionRule) -> list[MatchResult]:
        """Extract values from text using the given rule."""
        results = []

        # Build semantic variations lookup
        term_variations = self._build_variations_map(rule.semantic_mappings)

        # Try each pattern
        for pattern in sorted(rule.patterns, key=lambda p: -p.priority):
            matches = self._apply_pattern(text, pattern, term_variations, rule)
            results.extend(matches)

        # Deduplicate and sort by confidence
        results = self._deduplicate_results(results)
        results.sort(key=lambda r: -r.confidence)

        return results

    def _build_variations_map(self, mappings: list[SemanticMapping]) -> dict[str, list[str]]:
        """Build a map of canonical terms to their variations."""
        variations_map = {}
        for mapping in mappings:
            all_terms = [mapping.canonical_term] + mapping.variations
            for term in all_terms:
                variations_map[term.lower()] = all_terms
        return variations_map

    def _apply_pattern(
        self,
        text: str,
        pattern: ExtractionPattern,
        variations: dict[str, list[str]],
        rule: ExtractionRule,
    ) -> list[MatchResult]:
        """Apply a single pattern to extract values."""
        results = []

        if pattern.type == PatternType.EXACT:
            results = self._exact_match(text, pattern)
        elif pattern.type == PatternType.REGEX:
            results = self._regex_match(text, pattern)
        elif pattern.type == PatternType.FUZZY:
            results = self._fuzzy_match(text, pattern, variations)
        elif pattern.type == PatternType.LABEL_VALUE:
            results = self._label_value_match(text, pattern, variations, rule)
        elif pattern.type == PatternType.TABLE_HEADER:
            results = self._table_header_match(text, pattern, variations)
        elif pattern.type == PatternType.CONTEXT:
            results = self._context_match(text, pattern, variations, rule)

        return results

    def _exact_match(self, text: str, pattern: ExtractionPattern) -> list[MatchResult]:
        """Find exact matches of the pattern."""
        results = []
        pattern_lower = pattern.pattern.lower()
        text_lower = text.lower()

        idx = 0
        while True:
            pos = text_lower.find(pattern_lower, idx)
            if pos == -1:
                break

            # Extract surrounding context
            context_start = max(0, pos - 100)
            context_end = min(len(text), pos + len(pattern.pattern) + 100)
            context = text[context_start:context_end]

            # Try to find a numeric value nearby
            value, normalized = self._extract_nearby_value(text, pos, pos + len(pattern.pattern))

            if value:
                results.append(MatchResult(
                    value=value,
                    normalized_value=normalized,
                    confidence=pattern.confidence,
                    source=ExtractionSource(
                        context=context,
                        matched_pattern=pattern.pattern,
                        raw_text=text[pos:pos + len(pattern.pattern)]
                    ),
                    pattern_id=pattern.id
                ))

            idx = pos + 1

        return results

    def _regex_match(self, text: str, pattern: ExtractionPattern) -> list[MatchResult]:
        """Find regex matches."""
        results = []
        try:
            regex = re.compile(pattern.pattern, re.IGNORECASE | re.MULTILINE)
            for match in regex.finditer(text):
                # Get the captured group or full match
                value = match.group(1) if match.groups() else match.group(0)
                normalized = self._normalize_value(value)

                context_start = max(0, match.start() - 50)
                context_end = min(len(text), match.end() + 50)

                results.append(MatchResult(
                    value=value,
                    normalized_value=normalized,
                    confidence=pattern.confidence,
                    source=ExtractionSource(
                        context=text[context_start:context_end],
                        matched_pattern=pattern.pattern,
                        raw_text=match.group(0)
                    ),
                    pattern_id=pattern.id
                ))
        except re.error:
            pass

        return results

    def _fuzzy_match(
        self,
        text: str,
        pattern: ExtractionPattern,
        variations: dict[str, list[str]]
    ) -> list[MatchResult]:
        """Find fuzzy matches using string similarity."""
        if not HAS_RAPIDFUZZ:
            return []

        results = []
        words = text.split()
        search_term = pattern.pattern.lower()

        # Get all variations of the search term
        all_terms = variations.get(search_term, [search_term])

        for term in all_terms:
            # Find best fuzzy matches in the text
            matches = process.extract(term, words, scorer=fuzz.ratio, limit=5)
            for match_word, score, idx in matches:
                if score >= 70:  # 70% similarity threshold
                    # Find position in original text
                    pos = text.lower().find(match_word.lower())
                    if pos != -1:
                        value, normalized = self._extract_nearby_value(text, pos, pos + len(match_word))
                        if value:
                            context_start = max(0, pos - 100)
                            context_end = min(len(text), pos + 200)

                            results.append(MatchResult(
                                value=value,
                                normalized_value=normalized,
                                confidence=pattern.confidence * (score / 100),
                                source=ExtractionSource(
                                    context=text[context_start:context_end],
                                    matched_pattern=term,
                                    raw_text=match_word
                                ),
                                pattern_id=pattern.id
                            ))

        return results

    def _label_value_match(
        self,
        text: str,
        pattern: ExtractionPattern,
        variations: dict[str, list[str]],
        rule: ExtractionRule
    ) -> list[MatchResult]:
        """Find label: value pairs."""
        results = []

        # Get all label variations
        labels = [pattern.pattern]
        for mapping in rule.semantic_mappings:
            if mapping.canonical_term.lower() == pattern.pattern.lower():
                labels.extend(mapping.variations)

        # Common patterns for label-value extraction
        value_patterns = [
            r"{label}[:\s]+\$?\s*([\d,]+(?:\.\d+)?)\s*([BMKbmk]|billion|million|thousand)?",
            r"{label}[:\s]+\(\$?\s*([\d,]+(?:\.\d+)?)\s*([BMKbmk]|billion|million|thousand)?\)",
            r"\$?\s*([\d,]+(?:\.\d+)?)\s*([BMKbmk]|billion|million|thousand)?\s+{label}",
        ]

        for label in labels:
            escaped_label = re.escape(label)
            for vp in value_patterns:
                regex_pattern = vp.format(label=escaped_label)
                try:
                    regex = re.compile(regex_pattern, re.IGNORECASE)
                    for match in regex.finditer(text):
                        value = match.group(1)
                        multiplier = match.group(2) if len(match.groups()) > 1 else None
                        normalized = self._normalize_value(value, multiplier)

                        context_start = max(0, match.start() - 30)
                        context_end = min(len(text), match.end() + 30)

                        results.append(MatchResult(
                            value=value,
                            normalized_value=normalized,
                            confidence=pattern.confidence,
                            source=ExtractionSource(
                                context=text[context_start:context_end],
                                matched_pattern=label,
                                raw_text=match.group(0)
                            ),
                            pattern_id=pattern.id
                        ))
                except re.error:
                    continue

        return results

    def _table_header_match(
        self,
        text: str,
        pattern: ExtractionPattern,
        variations: dict[str, list[str]]
    ) -> list[MatchResult]:
        """Extract values from table-like structures."""
        # Simplified table extraction - looks for aligned columns
        results = []
        lines = text.split("\n")

        search_terms = [pattern.pattern.lower()]
        search_terms.extend(variations.get(pattern.pattern.lower(), []))

        for i, line in enumerate(lines):
            line_lower = line.lower()
            for term in search_terms:
                if term in line_lower:
                    # Look at next few lines for values
                    for j in range(i + 1, min(i + 5, len(lines))):
                        value, normalized = self._extract_value_from_line(lines[j])
                        if value:
                            results.append(MatchResult(
                                value=value,
                                normalized_value=normalized,
                                confidence=pattern.confidence * 0.8,
                                source=ExtractionSource(
                                    context="\n".join(lines[max(0, i-1):min(len(lines), j+2)]),
                                    matched_pattern=term,
                                    raw_text=lines[j]
                                ),
                                pattern_id=pattern.id
                            ))
                            break

        return results

    def _context_match(
        self,
        text: str,
        pattern: ExtractionPattern,
        variations: dict[str, list[str]],
        rule: ExtractionRule
    ) -> list[MatchResult]:
        """Extract based on surrounding context patterns."""
        results = []

        # Split into sentences/paragraphs
        paragraphs = re.split(r'\n\n+', text)

        search_terms = [pattern.pattern.lower()]
        for mapping in rule.semantic_mappings:
            search_terms.append(mapping.canonical_term.lower())
            search_terms.extend([v.lower() for v in mapping.variations])

        for para in paragraphs:
            para_lower = para.lower()
            for term in search_terms:
                if term in para_lower:
                    # Extract all numeric values from this paragraph
                    values = re.findall(r'\$?\s*([\d,]+(?:\.\d+)?)\s*([BMKbmk]|billion|million)?', para)
                    for value, multiplier in values:
                        normalized = self._normalize_value(value, multiplier)
                        results.append(MatchResult(
                            value=value,
                            normalized_value=normalized,
                            confidence=pattern.confidence * 0.7,
                            source=ExtractionSource(
                                context=para[:300],
                                matched_pattern=term,
                                raw_text=f"{value}{multiplier or ''}"
                            ),
                            pattern_id=pattern.id
                        ))

        return results

    def _extract_nearby_value(self, text: str, start: int, end: int) -> tuple[Optional[str], Optional[float]]:
        """Extract numeric value near a position in text."""
        # Look in a window around the match
        window_start = max(0, start - 50)
        window_end = min(len(text), end + 100)
        window = text[window_start:window_end]

        # Find numeric values
        matches = re.findall(r'\$?\s*([\d,]+(?:\.\d+)?)\s*([BMKbmk]|billion|million)?', window)
        if matches:
            value, multiplier = matches[0]
            return value, self._normalize_value(value, multiplier)

        return None, None

    def _extract_value_from_line(self, line: str) -> tuple[Optional[str], Optional[float]]:
        """Extract first numeric value from a line."""
        match = re.search(r'\$?\s*([\d,]+(?:\.\d+)?)\s*([BMKbmk]|billion|million)?', line)
        if match:
            value = match.group(1)
            multiplier = match.group(2)
            return value, self._normalize_value(value, multiplier)
        return None, None

    def _normalize_value(self, value: str, multiplier: Optional[str] = None) -> Optional[float]:
        """Normalize a string value to a float."""
        try:
            # Remove commas and convert
            clean = value.replace(",", "").replace("$", "").strip()
            num = float(clean)

            # Apply multiplier
            if multiplier:
                mult = self.currency_multipliers.get(multiplier, 1)
                num *= mult

            return num
        except (ValueError, TypeError):
            return None

    def _deduplicate_results(self, results: list[MatchResult]) -> list[MatchResult]:
        """Remove duplicate results, keeping highest confidence."""
        seen = {}
        for r in results:
            key = r.normalized_value
            if key not in seen or r.confidence > seen[key].confidence:
                seen[key] = r
        return list(seen.values())
