import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATASET_PATH = path.join(__dirname, 'milletverse_qa_dataset.json');
const JSONL_OUTPUT_PATH = path.join(__dirname, 'milletverse_fine_tuning.jsonl');
const MANIFEST_PATH = path.join(__dirname, '..', 'knowledge_manifest.json');

const SYSTEM_INSTRUCTION = `You are MilletVerse AI, the specialized assistant for the MilletVerse platform.
Your expertise covers:
1. Millet Education (varieties, nutritional properties, cultivation, dietary inclusion).
2. Nutrition (dietary fiber, plant protein, calcium, iron, clean ingredients).
3. Recipes (ingredients, prep steps, cooking/baking tips).
4. Marketplace (products, descriptions, sellers, with dynamic database lookup for live stock and prices).
5. Farmer Support (grain listing, quality standards, direct payouts).
6. Seller / Home Baker Support (onboarding, FSSAI compliance, product management, seller dashboard).
7. Customer Support (cart, checkout, payment, with dynamic database lookup for order status).
8. Personalized Guidance (age-appropriate suggestions, strictly no medical diagnosis, no prescribing medicines, no claiming to replace doctors).

Core rules:
- If an answer is not in the MilletVerse knowledge base, respond exactly: "I don't have that information in the MilletVerse knowledge base yet."
- For live product availability, current price, and order tracking, state that live data is retrieved from the database.
- For out-of-scope topics, politely decline and steer back to millets, food, recipes, and MilletVerse.`;

function validateAndExport() {
  console.log('====================================================');
  console.log('🧪 VALIDATING MILLETVERSE CHATBOT KNOWLEDGE & DATASET');
  console.log('====================================================\n');

  if (!fs.existsSync(DATASET_PATH)) {
    console.error(`❌ Dataset file not found at: ${DATASET_PATH}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(DATASET_PATH, 'utf-8');
  const dataset = JSON.parse(rawData);

  if (!dataset.qa_pairs || !Array.isArray(dataset.qa_pairs)) {
    console.error('❌ Invalid dataset structure: "qa_pairs" array missing.');
    process.exit(1);
  }

  const expectedDomains = [
    '01_millet_education',
    '02_nutrition',
    '03_recipes',
    '04_marketplace',
    '05_farmer_support',
    '06_seller_baker_support',
    '07_customer_order_support',
    '08_personalized_guidance_and_safety'
  ];

  const domainCounts = {};
  expectedDomains.forEach(d => { domainCounts[d] = 0; });

  let databaseQueriesCount = 0;
  let guardrailsTestedCount = 0;
  let exactFallbackCount = 0;

  const jsonlLines = [];

  dataset.qa_pairs.forEach((item, index) => {
    if (!item.id || !item.domain || !item.question || !item.expected_response) {
      console.warn(`⚠️ Warning: Item at index ${index} is missing required fields.`);
    }

    if (domainCounts[item.domain] !== undefined) {
      domainCounts[item.domain]++;
    } else {
      domainCounts[item.domain] = 1;
    }

    if (item.requires_database) {
      databaseQueriesCount++;
    }

    if (item.guardrail_checks && item.guardrail_checks.length > 0) {
      guardrailsTestedCount++;
    }

    if (item.expected_response.includes("I don't have that information in the MilletVerse knowledge base yet.")) {
      exactFallbackCount++;
    }

    // Format for chat fine-tuning JSONL (OpenAI / Gemini / Anthropic compatible)
    const chatEntry = {
      messages: [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        { role: 'user', content: item.question },
        { role: 'assistant', content: item.expected_response }
      ],
      metadata: {
        id: item.id,
        domain: item.domain,
        intent: item.user_intent,
        requires_database: !!item.requires_database
      }
    };

    jsonlLines.push(JSON.stringify(chatEntry));
  });

  // Verify domain coverage
  console.log('📊 Domain Coverage:');
  let allDomainsPresent = true;
  expectedDomains.forEach(domain => {
    const count = domainCounts[domain] || 0;
    const status = count > 0 ? '✅' : '❌';
    console.log(`   ${status} ${domain.padEnd(38)} : ${count} QA pairs`);
    if (count === 0) allDomainsPresent = false;
  });

  console.log('\n🛡️ Behavioral & Guardrail Checks:');
  console.log(`   ✅ Dynamic Database Lookup Triggers : ${databaseQueriesCount} questions`);
  console.log(`   ✅ Guardrails & Quality Checks       : ${guardrailsTestedCount} pairs`);
  console.log(`   ✅ Exact Fallback Directives        : ${exactFallbackCount} pairs`);
  console.log(`   ✅ Total Gold-Standard QA Pairs     : ${dataset.qa_pairs.length} pairs`);

  if (!allDomainsPresent) {
    console.error('\n❌ Validation Failed: One or more required domains are missing QA pairs.');
    process.exit(1);
  }

  // Write JSONL fine-tuning file
  fs.writeFileSync(JSONL_OUTPUT_PATH, jsonlLines.join('\n') + '\n', 'utf-8');
  console.log(`\n📁 Generated fine-tuning JSONL: ${JSONL_OUTPUT_PATH} (${jsonlLines.length} lines)`);

  // Verify knowledge base documents exist
  if (fs.existsSync(MANIFEST_PATH)) {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    console.log(`\n📚 Checking Knowledge Base Files from Manifest (${manifest.domains.length} domains):`);
    let missingDoc = false;
    manifest.domains.forEach(d => {
      const docPath = path.join(__dirname, '..', d.file);
      if (fs.existsSync(docPath)) {
        const stats = fs.statSync(docPath);
        console.log(`   ✅ ${d.file.padEnd(42)} (${stats.size} bytes)`);
      } else {
        console.log(`   ❌ MISSING: ${d.file}`);
        missingDoc = true;
      }
    });

    if (missingDoc) {
      console.error('\n❌ One or more knowledge base documents are missing!');
      process.exit(1);
    }
  }

  console.log('\n🎉 STEP 1 COMPLETED SUCCESSFULLY: Knowledge base & dataset validated.');
  console.log('====================================================\n');
}

validateAndExport();
