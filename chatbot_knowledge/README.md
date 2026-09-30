# MilletVerse Chatbot Knowledge Base

This directory contains the **complete knowledge base and training dataset** for the MilletVerse AI Chatbot (Step 1 of the RAG pipeline).

## Directory Structure

```
chatbot_knowledge/
├── knowledge_manifest.json                     ← Master index of all knowledge domains
│
├── 01_millet_education.json                    ← Millet types, botanical facts, daily meal inclusion
├── 02_nutrition.json                           ← Macro/micronutrient breakdown, grain comparisons
├── 03_recipes.json                             ← 5 millet recipes with full instructions and tips
├── 04_marketplace.json                         ← Product catalog, seller info (+ DB retrieval rules)
├── 05_farmer_support.json                      ← Farmer onboarding, raw grain listing, payouts
├── 06_seller_baker_support.json                ← Seller registration, FSSAI compliance, dashboard
├── 07_customer_order_support.json              ← Cart, checkout, shipping, returns (+ DB triggers)
├── 08_personalized_guidance_and_safety.json    ← Safety guardrails, age matrix, medical rules
│
└── dataset/
    ├── milletverse_qa_dataset.json             ← 36 gold-standard QA pairs across all 8 domains
    ├── milletverse_fine_tuning.jsonl           ← JSONL export for LLM fine-tuning (auto-generated)
    └── validate_dataset.js                     ← Validator + JSONL exporter script (ES module)
```

## Knowledge Domains (8 total)

| # | Domain File | Topics | DB Required |
|---|---|---|---|
| 01 | `01_millet_education.json` | 4 topic blocks | ❌ |
| 02 | `02_nutrition.json` | Macro/micro tables, comparisons | ❌ |
| 03 | `03_recipes.json` | 5 complete recipes | ❌ |
| 04 | `04_marketplace.json` | 6 products, 3 sellers | ✅ Live lookup |
| 05 | `05_farmer_support.json` | 4-step onboarding flow | ❌ |
| 06 | `06_seller_baker_support.json` | 3-step seller registration | ❌ |
| 07 | `07_customer_order_support.json` | 5-step purchase journey | ✅ Live lookup |
| 08 | `08_personalized_guidance_and_safety.json` | 5 guardrails, age matrix | ❌ |

## Training Dataset Summary

- **Total QA Pairs**: 36
- **All 8 domains covered**
- **4 questions with live database retrieval triggers** (products and orders)
- **36 pairs with guardrail quality checks** annotated
- **2 exact fallback directives** embedded in the expected responses

## Run Validator & Export JSONL

From the project root:

```bash
node chatbot_knowledge/dataset/validate_dataset.js
```

This validates all 8 domain files, checks domain coverage, and auto-generates `milletverse_fine_tuning.jsonl`.

## Core Safety Rules (enforced in guardrails domain)

1. **Never diagnose** any medical condition.
2. **Never prescribe** medicines or supplements.
3. **Never claim** millets can cure diseases.
4. **Never invent** live prices, stock, or order data — always retrieve from MySQL.
5. **Exact fallback phrase**: `"I don't have that information in the MilletVerse knowledge base yet."`

## What's Next

**Step 2** will build on this knowledge base to implement:
- Document chunking and text preprocessing
- Text embeddings (using Gemini Embeddings or sentence-transformers)
- Vector database storage (ChromaDB / Pinecone / in-memory FAISS)
- RAG retrieval pipeline
- Enhanced chatbot API endpoint in `backend/controllers/chatController.js`
