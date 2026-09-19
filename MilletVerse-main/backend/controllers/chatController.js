import { successResponse, HTTP_STATUS } from '../utils/apiResponse.js';

/**
 * Millet AI Assistant Controller
 * Provides simple rule-based responses about millets
 */
export const handleChat = async (req, res) => {
  const { message } = req.body;
  const msg = message.toLowerCase();
  
  let response = "I'm your Millet Assistant! I can help you find the right grain for your health. Are you looking for weight loss, diabetes control, or kid's nutrition?";

  if (msg.includes('weight') || msg.includes('fat') || msg.includes('slim')) {
    response = "For weight loss, I highly recommend **Barnyard Millet** and **Ragi**. They are high in fiber and keep you full for longer. Check out our 'Weight Management' category!";
  } else if (msg.includes('diabetes') || msg.includes('sugar') || msg.includes('glucose')) {
    response = "For managing blood sugar, **Bajra** and **Foxtail Millet** are excellent choices due to their low Glycemic Index (GI). Check out our 'Glycemic Control' snacks.";
  } else if (msg.includes('kid') || msg.includes('child') || msg.includes('growth')) {
    response = "**Ragi** (Finger Millet) is the king of calcium, containing 10x more than milk! It's perfect for growing children. Try our Ragi Chocolate Delight Biscuits.";
  } else if (msg.includes('protein') || msg.includes('muscle') || msg.includes('gym')) {
    response = "Looking to bulk up? **Proso Millet** and **Mixed Millet** blends offer the highest protein density among ancient grains.";
  } else if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    response = "Namaste! I'm here to guide you through the MilletVerse. How can I help your health journey today?";
  } else if (msg.includes('price') || msg.includes('cost') || msg.includes('buy')) {
    response = "Our premium stone-ground millets start from as low as ₹99. You can browse all products in our Marketplace!";
  }

  successResponse(res, HTTP_STATUS.OK, 'Assistant responded', { response });
};
