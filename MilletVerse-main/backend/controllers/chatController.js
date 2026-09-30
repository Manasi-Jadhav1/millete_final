import { successResponse, HTTP_STATUS } from '../utils/apiResponse.js';
import * as Product from '../models/Product.js';

/**
 * Detailed System Prompt for MilletVerse AI Assistant (Powered by Google Gemini)
 */
const SYSTEM_PROMPT = `
You are MilletVerse AI, an AI assistant powered by Google Gemini for the MilletVerse food and millet platform.

YOUR RESPONSIBILITIES:
1. 🌾 Millet nutrition and general food information
2. 🍪 Millet products and prices from the MilletVerse catalog
3. 🍲 Millet recipes
4. 📦 Shipping, delivery, and order information
5. 👶 Age-appropriate millet food guidance

STRICT TOPIC BOUNDARY RULE:
You are exclusively dedicated to assisting users with MilletVerse, millets, ancient grains, health & nutrition, recipes, MilletVerse catalog products, prices, shipping, order tracking, and formal customer support queries.
If the user asks a question completely unrelated to millets, food, health, or MilletVerse (such as writing general code, movies, sports, or fantasy stories), formally and politely decline:
"I am **MilletVerse AI**, specifically dedicated to assisting you with millet nutrition, health guidance, recipes, and MilletVerse catalog products. I am unable to answer questions outside these topics. How can I assist you with ancient grains or your health today?"

CORE RULE:
Always consider the user's age or age group before giving personalized food, nutrition, weight-management, diabetes, or product recommendations. Do not give the same recommendation to every user.
Follow this decision flow:
Age → Age Group → Goal → Health Condition → Dietary Preference → Recommendation

If the user's age is unknown and the question requires age-specific advice, politely ask for their age or age group first.

AGE GROUPS & AGE-TO-PRODUCT MATCHING MATRIX:
- 0–2 years (Infant/Toddler): Recommend consulting a pediatrician. Suggest Stone-Ground Ragi Flour (₹99) for soft porridge. Never recommend weight-loss, restrictive diets, or Barnyard Slim Crackers.
- 3–5 years (Preschool): Focus on healthy growth & calcium. Suggest **Ragi Chocolate Delight Biscuits** (₹149). Never recommend weight-loss products.
- 6–12 years (Child): Focus on growth, school energy & bone density. Suggest **Ragi Chocolate Delight Biscuits** (₹149) and **Bajra Crunch & Spice Biscuits** (₹129). If asking about weight loss: DO NOT recommend slimming products or calorie restriction. Suggest parent/doctor consultation.
- 13–17 years (Teenager): Focus on growth, sports energy & study stamina. Suggest **Multi-Millet Energy Bites** (₹199, 12.5% protein) and **Ragi Chocolate Delight Biscuits** (₹149). Do NOT promote slimming products. Suggest parent/doctor consultation for weight concerns.
- 18–30 years (Young Adult): Suggest **Multi-Millet Energy Bites** (₹199) for fitness/workout and **Barnyard Slim & Slimmer Crackers** (₹139) for weight management.
- 31–50 years (Adult): Suggest **Barnyard Slim & Slimmer Crackers** (₹139) for weight management and **Foxtail Sugar-Free Herbal Cookies** (₹159) for low GI blood sugar care.
- 51–65 years (Older Adult): Suggest **Foxtail Sugar-Free Herbal Cookies** (₹159) for low GI & nerve health (B12) and **Bajra Crunch Crackers** (₹129) for heart health & magnesium.
- 65+ years (Senior): Suggest **Stone-Ground Ragi / Jowar Flour** (₹99) for soft easy-to-digest porridge and **Foxtail Sugar-Free Herbal Cookies** (₹159).

HEALTH CONDITIONS:
If user mentions diabetes, heart disease, allergies, pregnancy, kidney disease:
- Provide ONLY general educational information.
- NEVER claim a millet or product can cure, prevent, or treat a medical condition.
- Advise checking product ingredient/allergen information before consumption and consulting a doctor.

WEIGHT-LOSS QUESTIONS:
- Under 18: Never recommend restrictive weight-loss diets or slimming products. Focus on healthy growth and parent/doctor consultation.
- Adults (18+): Provide general healthy-eating information. Explain individual results vary. Never promise or guarantee weight loss.

PRODUCT RECOMMENDATIONS (CATALOG ONLY):
Only recommend real products in the catalog:
1. Ragi Chocolate Delight Biscuits: ₹149 (250g) - Organic Ragi, Raw Cacao, Jaggery. High Calcium (10x milk).
2. Bajra Crunch & Spice Biscuits: ₹129 (200g) - Bajra, Roasted Cumin, Sea Salt. Low GI, Iron rich.
3. Barnyard Slim & Slimmer Crackers: ₹139 (150g) - Barnyard Millet, Flaxseeds, Herbs. High fiber (10.1%).
4. Foxtail Sugar-Free Herbal Cookies: ₹159 (200g) - Foxtail Millet, Stevia, Cardamom. Low GI, Sugar-Free.
5. Multi-Millet Energy Bites: ₹199 (250g) - 5 Millets blend, Almonds, Dates. High protein (12.5%).
6. Stone-Ground Millet Flours & Breakfast Mixes: Starting from ₹99.

BUYING FLOW:
Product Search → Product Details → Price → Quantity → Cart → Shipping → Checkout → Order Confirmation

RECIPES:
Simple ingredients, step-by-step instructions, prep time. Adjust to age group. No medical claims.

SHIPPING & ORDERS:
- Free Shipping on orders over ₹499 across India.
- Standard Delivery: 3 to 5 business days.
- Returns: 7-day return policy for unopened/damaged items.

RESPONSE STYLE:
Friendly, clear, short, respectful, age-aware, evidence-conscious. Use emojis naturally.
`;

/**
 * Call Google Gemini REST API
 */
async function callGeminiApi(apiKey, userMessage, dynamicContext = '') {
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-pro'];
  let lastError = null;

  const promptText = dynamicContext 
    ? `${SYSTEM_PROMPT}\n\n[LIVE CATALOG CONTEXT]:\n${dynamicContext}\n\nUser Question: ${userMessage}`
    : `${SYSTEM_PROMPT}\n\nUser Question: ${userMessage}`;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const requestBody = {
        contents: [{ role: 'user', parts: [{ text: promptText }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 1000 }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        lastError = errJson.error?.message || response.statusText;
        continue;
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (generatedText) {
        return { success: true, text: generatedText, modelUsed: model };
      }
    } catch (err) {
      lastError = err.message;
    }
  }

  return { success: false, error: lastError || 'Gemini API call failed' };
}

/**
 * Intelligent Age-Aware Fallback NLP Engine
 */
function getSmartFallbackResponse(userMessage) {
  const msg = userMessage.toLowerCase().trim();

  // Extract Age if mentioned (e.g., "10 years old", "i am 15", "age 25")
  const ageMatch = msg.match(/\b(?:i am|age|im|i'm)?\s*(\d{1,2})\s*(?:years|yr|yrs)?\s*(?:old)?\b/);
  const age = ageMatch ? parseInt(ageMatch[1]) : null;

  // 1. Weight Loss Questions with Age Detection
  if (msg.includes('weight') || msg.includes('fat') || msg.includes('slim') || msg.includes('diet') || msg.includes('calorie')) {
    if (age !== null && age < 18) {
      if (age <= 5) {
        return `🌾 For young children under 5, weight-loss diets or slimming products are not appropriate. Focus should be on balanced meals and healthy growth. Please consult a pediatrician for personalized child feeding guidance.`;
      } else if (age <= 12) {
        return `🌾 Since you are ${age} years old and still growing, I won't recommend a restrictive weight-loss diet or slimming products. I can instead help you with balanced, nutritious millet meals and healthy snacks! Please discuss any weight concerns with a parent/guardian and a pediatrician or doctor.`;
      } else {
        return `🌾 At ${age}, your body is still growing, so restrictive weight-loss diets or slimming products aren't something I should recommend. I can help you choose nutritious millet meals that support healthy growth and energy! If you're concerned about weight, please talk with a parent/guardian and a healthcare professional.`;
      }
    } else if (age === null && !msg.includes('adult') && !msg.includes('old') && (msg.includes('i want to lose') || msg.includes('how to lose'))) {
      return `Sure 🌾 I can provide general information about healthy millet choices. Before I recommend anything, may I know your age or age group? This helps me provide age-appropriate guidance!`;
    }

    // Adult Weight Management
    return `🌾 **Healthy Weight Management for Adults:**\n\n` +
      `Millets can be part of a balanced lifestyle:\n` +
      `1. **Barnyard Millet (Sanwa):** Lowest calories & carbs among grains, high dietary fiber (10.1%).\n` +
      `2. **Ragi (Finger Millet):** High fiber keeps satiety long.\n\n` +
      `🍪 **Catalog Product:** **Barnyard Slim & Slimmer Crackers** (₹139 for 150g) – 100% baked, high fiber snack. *(Note: Results vary, millets complement a balanced diet).*`;
  }

  // Direct Age Detection for Age-Specific Product Recommendation
  if (age !== null) {
    if (age <= 2) {
      return `👶 **Age 0–2 Years (Infant/Toddler Guidance):**\n\n` +
        `For infants and toddlers, please consult a pediatrician before introducing new foods.\n\n` +
        `🥣 **Recommended Product:** **Stone-Ground Organic Ragi Flour** (₹99) for making smooth, easily digestible Ragi porridge. *(Consult pediatrician first; no weight-loss products).*`;
    } else if (age <= 5) {
      return `👶 **Age 3–5 Years (Preschool Child Guidance):**\n\n` +
        `Focus on healthy growth, bone strength, and balanced energy:\n\n` +
        `🍪 **Recommended Product:** **Ragi Chocolate Delight Biscuits** (₹149 for 250g) – Made with organic Ragi & raw cacao, delivering 10x more calcium than milk for strong bones!`;
    } else if (age <= 12) {
      return `🧒 **Age 6–12 Years (Child Guidance):**\n\n` +
        `Focus on growth, school stamina, and bone density:\n\n` +
        `🍪 **Recommended Catalog Products:**\n` +
        `1. **Ragi Chocolate Delight Biscuits** (₹149) – Calcium rich (344mg/100g) for developing bones & teeth.\n` +
        `2. **Bajra Crunch & Spice Biscuits** (₹129) – Iron rich crunchy snack for active school kids!`;
    } else if (age <= 17) {
      return `🧑 **Age 13–17 Years (Teenager Guidance):**\n\n` +
        `Focus on healthy development, study stamina, and sports energy:\n\n` +
        `⚡ **Recommended Catalog Products:**\n` +
        `1. **Multi-Millet Energy Bites** (₹199 for 250g) – High protein (12.5%), almonds, and dates for active teens.\n` +
        `2. **Ragi Chocolate Delight Biscuits** (₹149) – High calcium & iron booster!`;
    } else if (age <= 30) {
      return `💪 **Age 18–30 Years (Young Adult & Fitness Guidance):**\n\n` +
        `Focus on fitness, active energy, and healthy nutrition:\n\n` +
        `⚡ **Recommended Catalog Products:**\n` +
        `1. **Multi-Millet Energy Bites** (₹199) – High protein (12.5%) workout & muscle recovery.\n` +
        `2. **Barnyard Slim & Slimmer Crackers** (₹139) – High fiber (10.1%), zero trans-fat for healthy weight management.`;
    } else if (age <= 50) {
      return `🌾 **Age 31–50 Years (Adult Wellness Guidance):**\n\n` +
        `Focus on balanced energy, blood sugar awareness, and weight management:\n\n` +
        `🍪 **Recommended Catalog Products:**\n` +
        `1. **Barnyard Slim & Slimmer Crackers** (₹139) – Fiber rich for adult satiety & weight management.\n` +
        `2. **Foxtail Sugar-Free Herbal Cookies** (₹159) – Low GI, stevia sweetened for blood sugar care.`;
    } else if (age <= 65) {
      return `🩺 **Age 51–65 Years (Older Adult Guidance):**\n\n` +
        `Focus on fiber, easy digestion, and heart/glycemic health:\n\n` +
        `🍪 **Recommended Catalog Products:**\n` +
        `1. **Foxtail Sugar-Free Herbal Cookies** (₹159) – Low GI & Vitamin B12 for nerve health.\n` +
        `2. **Bajra Crunch & Spice Biscuits** (₹129) – High magnesium for heart health.`;
    } else {
      return `👵 **Age 65+ Years (Senior Nutrition Guidance):**\n\n` +
        `Focus on soft, easily digestible foods and hydration:\n\n` +
        `🥣 **Recommended Catalog Products:**\n` +
        `1. **Stone-Ground Ragi / Jowar Flour** (₹99) – Perfect for soft, easy-to-digest warm porridge or malt.\n` +
        `2. **Foxtail Sugar-Free Herbal Cookies** (₹159) – Gentle, low-sugar snack!`;
    }
  }

  // 2. Diabetes / Sugar / Health Conditions
  if (msg.includes('diabet') || msg.includes('sugar') || msg.includes('glucose') || msg.includes('insulin') || msg.includes('glycemic') || /\bgi\b/.test(msg)) {
    return `🩺 **General Glycemic & Diabetes Food Awareness:**\n\n` +
      `Millets generally have a **Low Glycemic Index (GI)**, meaning they release carbohydrates slowly:\n` +
      `• **Foxtail Millet:** Known for low GI properties.\n` +
      `• **Bajra (Pearl Millet):** High magnesium content.\n\n` +
      `🍪 **Catalog Product:** **Foxtail Sugar-Free Herbal Cookies** (₹159 for 200g, Foxtail millet, Stevia, Cardamom).\n\n` +
      `*Disclaimer: Millets do not cure or treat diabetes. Please consult a doctor or clinical dietitian for personal medical advice.*`;
  }

  // 3. Child / Kid Nutrition
  if (msg.includes('kid') || msg.includes('child') || msg.includes('baby') || msg.includes('grow') || msg.includes('toddler')) {
    return `👶 **Age-Appropriate Child Nutrition:**\n\n` +
      `• **For 0–2 Years:** Consult a pediatrician before introducing new solids. Ragi porridge is traditionally popular, but medical guidance is recommended.\n` +
      `• **For 3–12 Years:** **Ragi (Finger Millet)** provides **344mg Calcium per 100g** (10x milk!) to support growing bones and teeth.\n\n` +
      `🍪 **Child-Friendly Catalog Product:** **Ragi Chocolate Delight Biscuits** (₹149 for 250g) made with organic Ragi & raw cacao!`;
  }

  // 4. Recipes
  if (msg.includes('recipe') || msg.includes('cook') || msg.includes('make') || msg.includes('prepare') || msg.includes('malt') || msg.includes('upma')) {
    return `🍲 **Healthy Ragi Malt Recipe (Prep time: 5 mins):**\n\n` +
      `**Ingredients:** 2 tbsp Ragi flour, 1 cup water/milk, pinch of cardamom, jaggery to taste.\n\n` +
      `**Steps:**\n` +
      `1. Mix Ragi flour in water without lumps.\n` +
      `2. Cook on medium heat for 5 minutes stirring continuously.\n` +
      `3. Add cardamom & sweetener. Serve warm!\n\n` +
      `*Great energy drink for school children and adults!*`;
  }

  // 5. Product Purchase Flow
  if (msg.includes('want to buy') || msg.includes('buy barnyard') || msg.includes('buy ragi') || msg.includes('buy bajra') || msg.includes('buy foxtail') || msg.includes('buy cookies')) {
    return `I can help you with that! 🍪 Here is the catalog details for your request:\n\n` +
      `• **Product:** Barnyard Slim & Slimmer Crackers\n` +
      `• **Price:** ₹139\n` +
      `• **Pack Size:** 150g\n` +
      `• **Main Ingredients:** Barnyard Millet, Flaxseeds, Organic Herbs\n` +
      `• **Nutritional Info:** High dietary fiber (10.1%), 100% Baked, Zero Trans-Fat\n` +
      `• **Availability:** In Stock\n\n` +
      `Would you like to add this item to your cart and proceed to Checkout?`;
  }

  // 6. Products / Price / Catalog
  if (msg.includes('product') || msg.includes('price') || msg.includes('buy') || msg.includes('cost') || msg.includes('shop') || msg.includes('biscuit') || msg.includes('cracker')) {
    return `🛍️ **MilletVerse Catalog Products & Prices:**\n\n` +
      `1. 🍫 **Ragi Chocolate Delight Biscuits** - ₹149 (250g | Ragi, Raw Cacao, Jaggery | Calcium Rich)\n` +
      `2. 🌶️ **Bajra Crunch & Spice Biscuits** - ₹129 (200g | Bajra, Roasted Cumin, Sea Salt | Low GI)\n` +
      `3. 🌾 **Barnyard Slim & Slimmer Crackers** - ₹139 (150g | Barnyard Millet, Flaxseeds | High Fiber)\n` +
      `4. 🍪 **Foxtail Sugar-Free Herbal Cookies** - ₹159 (200g | Foxtail Millet, Stevia | Sugar-Free)\n` +
      `5. ⚡ **Multi-Millet Energy Bites** - ₹199 (250g | 5 Millets blend, Almonds, Dates | High Protein)\n\n` +
      `Would you like to add any item to your cart?`;
  }

  // 6. Shipping & Orders
  if (msg.includes('ship') || msg.includes('deliver') || msg.includes('track') || msg.includes('order') || msg.includes('return')) {
    return `📦 **Shipping & Order Information:**\n\n` +
      `• **Delivery Time:** 3 to 5 business days nationwide.\n` +
      `• **Shipping Charges:** FREE Shipping on orders above ₹499 (₹40 standard below ₹499).\n` +
      `• **Returns:** 7-day easy return policy for unopened or damaged items.`;
  }

  // 7. Strict Out-of-Topic Guardrail Check
  const isMilletTopic = msg.includes('millet') || msg.includes('ragi') || msg.includes('bajra') || msg.includes('jowar') || msg.includes('foxtail') || msg.includes('barnyard') || msg.includes('kodo') || msg.includes('proso');
  const isHealthTopic = msg.includes('weight') || msg.includes('diabet') || msg.includes('sugar') || msg.includes('health') || msg.includes('diet') || msg.includes('caloric') || msg.includes('nutrition') || msg.includes('kid') || msg.includes('child') || msg.includes('age');
  const isCatalogTopic = msg.includes('product') || msg.includes('price') || msg.includes('cost') || msg.includes('buy') || msg.includes('shop') || msg.includes('biscuit') || msg.includes('cookie') || msg.includes('cracker');
  const isRecipeTopic = msg.includes('recipe') || msg.includes('cook') || msg.includes('make') || msg.includes('prepare') || msg.includes('malt') || msg.includes('upma');
  const isOrderTopic = msg.includes('ship') || msg.includes('deliver') || msg.includes('track') || msg.includes('order') || msg.includes('return') || msg.includes('refund');
  const isGreeting = msg.includes('hi') || msg.includes('hello') || msg.includes('hey') || msg.includes('namaste') || msg.includes('who are you');

  if (!isMilletTopic && !isHealthTopic && !isCatalogTopic && !isRecipeTopic && !isOrderTopic && !isGreeting) {
    return `I am **MilletVerse AI**, specifically dedicated to assisting you with millet nutrition, health guidance, recipes, and MilletVerse catalog products.\n\nI am unable to answer questions outside these topics. How can I assist you with ancient grains or your health journey today?`;
  }

  // 8. Greeting
  return `Namaste! 🙏 I am **MilletVerse AI**, powered by Google Gemini.\n\n` +
    `I can guide you on:\n` +
    `🌾 Millets & Nutrition\n` +
    `🍪 Products & Prices\n` +
    `🍲 Delicious Millet Recipes\n` +
    `📦 Shipping & Orders\n\n` +
    `To provide age-appropriate guidance, I may ask your age or age group when needed.\n\n` +
    `What would you like to know today?`;
}

/**
 * Millet AI Assistant Controller Endpoint
 * POST /api/chat
 */
export const handleChat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Message is required'
      });
    }

    const trimmedMsg = message.trim();
    const apiKey = process.env.GEMINI_API_KEY;

    let dynamicCatalogContext = '';
    try {
      const products = await Product.getAllProducts({ is_available: true, limit: 10 });
      if (products && products.length > 0) {
        dynamicCatalogContext = products.map(p => `- ${p.name} (${p.millet_type}): ₹${p.price} [${p.description || ''}]`).join('\n');
      }
    } catch (e) {
      // Database fetch optional
    }

    // Attempt Gemini API if key is set
    if (apiKey && apiKey !== 'your_google_gemini_api_key_here' && apiKey.length > 10) {
      const geminiResult = await callGeminiApi(apiKey, trimmedMsg, dynamicCatalogContext);
      if (geminiResult.success) {
        return successResponse(res, HTTP_STATUS.OK, 'Assistant responded via Google Gemini', {
          response: geminiResult.text,
          provider: 'Google Gemini AI',
          model: geminiResult.modelUsed
        });
      }
    }

    // Fallback to Smart Age-Aware Engine
    const fallbackText = getSmartFallbackResponse(trimmedMsg);
    return successResponse(res, HTTP_STATUS.OK, 'Assistant responded', {
      response: fallbackText,
      provider: 'MilletVerse Smart Engine'
    });

  } catch (error) {
    console.error('Chat Assistant Error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER).json({
      success: false,
      message: 'Failed to generate response',
      error: error.message
    });
  }
};
