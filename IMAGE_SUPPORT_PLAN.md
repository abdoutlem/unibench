# Image Support Implementation Plan

## Current State

**❌ Images are NOT currently processed:**
- PDF parser extracts only text (skips image blocks)
- AI API calls only send text prompts
- No image extraction or encoding

## What's Needed

### 1. Extract Images from PDFs

**Location**: `backend/app/services/document_parser.py`

**Current code** (line 88):
```python
if block[6] == 0:  # Text block (not image)
    block_texts.append(block[4])
```

**Needed**: Extract images from PDF pages:
```python
# Extract images from page
image_list = page.get_images()
for img_index, img in enumerate(image_list):
    xref = img[0]
    base_image = doc.extract_image(xref)
    image_bytes = base_image["image"]
    # Store image for AI processing
```

### 2. Update ParsedDocument Model

**Location**: `backend/app/services/document_parser.py`

**Add image storage**:
```python
@dataclass
class ParsedDocument:
    filename: str
    file_type: str
    text: str
    pages: list[str]
    tables: list[dict]
    images: list[dict]  # NEW: Store images
    metadata: dict
```

**Image structure**:
```python
{
    "page": 1,
    "index": 0,
    "data": bytes,  # Image bytes
    "format": "png",  # or "jpeg"
    "bbox": [x0, y0, x1, y1]  # Position on page
}
```

### 3. Update AI Extractor to Handle Images

**Location**: `backend/app/services/ai_extractor.py`

**For Claude (Anthropic)**:
```python
import base64

def _call_anthropic_sync(self, prompt: str, images: list[dict] = None) -> str:
    """Call Anthropic API with optional images."""
    content = [{"type": "text", "text": prompt}]
    
    # Add images if provided
    if images:
        for img in images:
            img_base64 = base64.b64encode(img["data"]).decode("utf-8")
            content.append({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": f"image/{img['format']}",
                    "data": img_base64
                }
            })
    
    message = self.anthropic_client.messages.create(
        model=self.config.model,
        max_tokens=self.config.max_tokens,
        temperature=self.config.temperature,
        system=self.config.system_prompt or "You are a precise data extraction assistant.",
        messages=[{"role": "user", "content": content}]
    )
    return message.content[0].text
```

**For OpenAI (GPT-4 Vision)**:
```python
import base64

def _call_openai_sync(self, prompt: str, images: list[dict] = None) -> str:
    """Call OpenAI API with optional images."""
    content = [{"type": "text", "text": prompt}]
    
    # Add images if provided
    if images:
        for img in images:
            img_base64 = base64.b64encode(img["data"]).decode("utf-8")
            content.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/{img['format']};base64,{img_base64}"
                }
            })
    
    response = self.openai_client.chat.completions.create(
        model="gpt-4-vision-preview",  # Use vision model
        max_tokens=self.config.max_tokens,
        temperature=self.config.temperature,
        messages=[
            {"role": "system", "content": self.config.system_prompt or "You are a precise data extraction assistant."},
            {"role": "user", "content": content}
        ]
    )
    return response.choices[0].message.content
```

### 4. Update Extraction Flow

**Location**: `backend/app/services/extraction_service.py`

**Pass images to AI extractor**:
```python
# In _extract_with_rule method
if should_use_ai:
    # Get images from document for the current page/chunk
    relevant_images = [
        img for img in doc.images 
        if img.get("page") == current_page
    ]
    
    ai_results = self.ai_extractor.extract_sync(
        doc.text, 
        rule, 
        glossary_metric=glossary_metric,
        images=relevant_images  # NEW: Pass images
    )
```

### 5. Update Prompt Template

**Location**: `backend/app/models/extraction.py`

**Enhance prompt to mention images**:
```python
extraction_prompt_template: str = Field(
    default="""Extract the following metric from the document.

Metric to extract: {metric_name}
Description: {metric_description}
Expected unit: {unit}

Known variations of this metric:
{variations}

Document text:
{text}

{image_context}

Instructions:
1. Analyze both the text AND any images provided
2. Look for charts, graphs, tables in images that contain the metric
3. Extract the numeric value from text or images
4. Return the numeric value only
5. If the value is in millions/billions, convert to full number
6. If not found, return null
7. Include the exact text or image location where you found this value

Respond in JSON format:
{{
    "value": <number or null>,
    "raw_text": "<exact text matched or image description>",
    "confidence": <0.0-1.0>,
    "fiscal_year": <year if found, else null>,
    "notes": "<any relevant notes>",
    "source_type": "<text|image|both>"
}}"""
)
```

## Implementation Steps

1. **Extract images from PDFs** (document_parser.py)
   - Use PyMuPDF's `get_images()` method
   - Store images with page number and position

2. **Update ParsedDocument model** (document_parser.py)
   - Add `images: list[dict]` field

3. **Update AI extractor** (ai_extractor.py)
   - Modify `_call_anthropic_sync()` and `_call_openai_sync()` to accept images
   - Encode images as base64
   - Use vision-capable models (Claude Sonnet 4, GPT-4 Vision)

4. **Update extraction service** (extraction_service.py)
   - Pass images from document to AI extractor
   - Match images to relevant pages/chunks

5. **Update prompt template** (extraction.py)
   - Add instructions for analyzing images
   - Include image context in prompt

6. **Test with sample PDFs**
   - PDFs with charts/graphs
   - PDFs with scanned images
   - PDFs with tables in images

## Benefits

✅ Extract data from charts and graphs  
✅ Process scanned documents (with OCR)  
✅ Extract from image-based tables  
✅ Better accuracy for visual data  
✅ Support for PDFs with embedded images  

## Limitations

⚠️ **Cost**: Vision models are more expensive than text-only  
⚠️ **Token limits**: Images consume more tokens  
⚠️ **Processing time**: Image encoding/decoding adds latency  
⚠️ **Model requirements**: Must use vision-capable models  

## Example Use Cases

1. **Financial statements**: Extract revenue from bar charts
2. **Enrollment reports**: Extract student counts from pie charts
3. **Scanned documents**: OCR + extraction from scanned PDFs
4. **Dashboard screenshots**: Extract metrics from dashboard images
