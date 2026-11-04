# PolicyVision AI — Insurance Explainer Visual Generator

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v3-38B2AC.svg?logo=tailwindcss)](https://tailwindcss.com)
[![Pytest & Hypothesis](https://img.shields.io/badge/Testing-Pytest%20%2B%20Hypothesis-green.svg)](https://hypothesis.readthedocs.io)

**PolicyVision AI** is a document-grounded generative AI platform that converts dense, complex insurance policy PDFs and free-text descriptions into customer-friendly, accessible visual explainers.

The system is built around a Retrieval-Augmented Generation (RAG) pipeline: every generated asset—simplified explanations, coverage infographics, claims flowcharts, and Q&A visual answers—is anchored strictly to passages retrieved from the source policy document, preventing hallucinated coverage details.

---

## Key Features

1. **Document & Text Ingestion (PyMuPDF / PyMuPDF4LLM)**:
   - Ingests PDF documents up to 50 MB and 100 pages.
   - Extracts structured Markdown preserving headings, lists, and tables.
   - Accepts free-text descriptions between 50 and 5,000 characters.

2. **RAG Grounding & Multilingual Embeddings (`bge-m3`)**:
   - Semantic retrieval using multilingual embeddings covering English and 8 Indian languages (Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati).
   - Statement-level verification: unverified factual claims are withheld to eliminate compliance risk.

3. **Three-Section Simplified Explanation (Flesch-Kincaid Grade 1–8)**:
   - Formally structured into: **What is Covered**, **What is Not Covered**, and **How to Claim**.
   - Preserves all numeric coverage limits, deductibles, percentages, and deadlines verbatim.
   - Enforces script purity (≥95%) with automatic English fallback.

4. **Multi-Style Visual Explainer Generation (≥1024×1024 Resolution)**:
   - **Professional Infographic**: Clean data visualization, high contrast, executive layout.
   - **Illustrated Cartoon**: Friendly, rounded shapes, approachable illustration.
   - **Flowchart Diagram**: Technical step-by-step workflow with dual cashless & reimbursement paths.
   - High-contrast text overlays burnt in with Pillow and Noto Sans typography.

5. **AI-Powered Policy Q&A**:
   - Multi-turn conversation with up to 10 context messages (FIFO eviction).
   - Inline clickable citation chips displaying document name, page, and section.
   - Automatic visual generation for quantifiable benefits and multi-step processes.

6. **Enterprise Export (PNG + ZIP)**:
   - Direct download of ≥150 DPI PNG explainers with embedded XMP metadata.
   - Bundled ZIP package with all images, metadata manifest, and PDF summary report.

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3.11+, FastAPI, Uvicorn |
| **Frontend** | React 18, TypeScript, Tailwind CSS, Vite |
| **Document Processing** | PyMuPDF (fitz), pymupdf4llm |
| **Embeddings & Vector Store** | Sentence-Transformers (`BAAI/bge-m3`), ChromaDB / Semantic Store |
| **Image Generation** | Diffusion / Pillow Canvas Engine (1024×1024 minimum resolution) |
| **Testing** | Pytest, Hypothesis (Property-Based Testing) |
| **Packaging & Deploy** | Docker, Docker Compose, Hugging Face Spaces |

---

## Architecture & Workflows

```
┌────────────────────────────────────────────────────────┐
│                   React + Tailwind UI                  │
│   UploadPage  │  ViewerPage  │  QAPage  │  ExportPage  │
└───────────────────────────┬────────────────────────────┘
                            │ /api/v1
┌───────────────────────────▼────────────────────────────┐
│                    FastAPI Backend                     │
│  Session Middleware  │  ThreadPoolExecutor  │  Routers │
└──────┬────────────────────┬────────────────────┬───────┘
       │                    │                    │
┌──────▼──────┐      ┌──────▼──────┐      ┌──────▼──────┐
│  Doc Parser │      │ RAG Ground  │      │ Visual Gen  │
│  (PyMuPDF)  │      │  (BGE-M3)   │      │ (Overlays)  │
└─────────────┘      └─────────────┘      └─────────────┘
```

---

## Quickstart

### 1. Backend Setup
```bash
# Navigate to backend
cd backend

# Create virtual environment and install dependencies
python -m venv venv
venv\Scripts\activate  # Windows: venv\Scripts\activate | Linux/Mac: source venv/bin/activate
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
FastAPI interactive docs will be available at: `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Install packages & start Vite dev server
npm install
npm run dev
```
Frontend application will be accessible at: `http://localhost:3000`

### 3. Docker Compose Setup
```bash
docker-compose up --build
```

---

## Testing & Correctness Properties

The test suite validates both unit contracts and formal system invariants using **Hypothesis** property-based testing:

| Property | Description | Test File |
|---|---|---|
| **Property 1** | Text validation bounds (50–5000 chars, non-whitespace) | `tests/test_document_processor.py` |
| **Property 2** | Numeric value preservation in simplified explanation | `tests/test_llm_engine.py` |
| **Property 3** | Three-section invariant ("What is Covered", "What is Not Covered", "How to Claim") | `tests/test_llm_engine.py` |
| **Property 4** | RAG grounding (no unverified factual statements) | `tests/test_rag_pipeline.py` |
| **Property 5** | Multilingual script purity (≥95% target script) | `tests/test_multilingual.py` |
| **Property 6** | Coverage visual prompt completeness (categories & amounts) | `tests/test_visual_prompt_builder.py` |
| **Property 7** | Q&A FIFO context window eviction (max 10 items) | `tests/test_session_and_qa.py` |
| **Property 8** | Export round-trip resolution preservation (≥1024×1024) | `tests/test_image_generator.py` |
| **Property 9** | Claims step ordering preserved in visual output | `tests/test_visual_prompt_builder.py` |

To run the complete test suite:
```bash
cd backend
pytest -v
```

To run end-to-end integration tests:
```bash
pytest -m integration -v
```

