const axios = require('axios');

/**
 * دالة للحصول على رد الذكاء الاصطناعي بناءً على رسالة المستخدم وسياق الميزانية
 * @param {string} userMessage - رسالة المستخدم
 * @param {Object} context - سياق المحادثة { budgetAmount, budgetRemaining, location }
 * @returns {string} - رد الذكاء الاصطناعي
 */
const getAIResponse = async (userMessage, context, history = []) => {
  const API_KEY = process.env.AI_API_KEY;

  const remaining = context?.budgetRemaining !== undefined && context?.budgetRemaining !== null ? context.budgetRemaining : 'Not specified';
  const amount = context?.budgetAmount !== undefined && context?.budgetAmount !== null ? context.budgetAmount : 'Not specified';
  
  const activitiesContext = context?.availableActivities && context.availableActivities.length > 0 
    ? `\nHere are some REAL available activities in our database (Explore section):\n` + 
      context.availableActivities.map(a => `- ID: "${a._id}", Title: "${a.title}", Category: "${a.category}", Price: ${a.price} EGP, City: ${a.city}`).join('\n')
    : `\nThere are no specific database activities available right now.`;

  const isArabic = /[\u0600-\u06FF]/.test(userMessage);
  const langInstruction = isArabic ? 'You MUST reply in Arabic.' : 'You MUST reply in English.';

  const systemPrompt = `You are BudgetWise AI, a helpful, friendly, and highly intelligent personal finance and outing assistant.
The user has a total budget of ${amount} EGP and their remaining budget is ${remaining} EGP.
Your goal is to converse naturally, help them manage their money, give saving tips, and suggest outings.

${activitiesContext}

CRITICAL RULES:
1. CONVERSATIONAL & SMART: Always converse naturally and understand the user's real intent.
2. STRICT RELEVANCE FOR EXPLORE: When suggesting outings or activities, FIRST check the database activities provided above. ONLY recommend them if they TRULY MATCH the user's request (e.g., if the user asks for a trip/travel, DO NOT recommend a restaurant just because it's in the database). If suitable and relevant ones exist, recommend them and include their IDs in "recommended_activities".
3. EXTERNAL SUGGESTIONS (DYNAMIC & RELEVANT): If the database activities are NOT relevant to the user's specific request, you MUST use your vast AI knowledge to generate highly specific, creative, and relevant suggestions that MATCH exactly what the user asked for (e.g., if they ask for food, suggest famous food streets or popular restaurant types; if they ask for sports, suggest sports clubs). DO NOT use static or repetitive examples. Be creative and tailored to their exact prompt.
4. NO PRICES FOR EXTERNAL IDEAS: Do NOT mention any specific prices for your external suggestions since you do not have real-time data. Just suggest the idea/place.
5. NO WEB SEARCH OR LINKS: Do NOT include external web links like Tripadvisor or Bing. Just give a conversational, helpful idea.
6. Do NOT make up fake activities or IDs for the "recommended_activities" array. ONLY use IDs from the provided database list.

You MUST return your final response as a valid JSON object with the following structure:
{
  "reply": "Your friendly text response answering the user's query.",
  "recommended_activities": ["ID1", "ID2"] // Array of activity IDs from the database list you want to feature. Empty array if none.
}
Do not include markdown code blocks like \`\`\`json, just return the raw JSON object.
${langInstruction}`;

  const formattedHistory = history.map(msg => ({
    role: msg.role === 'ai' ? 'assistant' : msg.role,
    content: msg.content
  }));

  const messagesPayload = [
    { role: 'system', content: systemPrompt },
    ...formattedHistory,
    { role: 'user', content: userMessage }
  ];

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-4o-mini',
        response_format: { type: "json_object" },
        messages: messagesPayload
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'BudgetWise'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    try {
      const parsed = JSON.parse(content);
      return {
        reply: parsed.reply || content,
        recommendedActivities: parsed.recommended_activities || []
      };
    } catch (parseError) {
      console.error('Failed to parse AI JSON:', content);
      return { reply: content, recommendedActivities: [] };
    }
  } catch (error) {
    console.error('AI Service API Error:', error.response ? error.response.data : error.message);
    
    // Fallback in case of API failure
    const replyText = isArabic 
      ? `عذراً، أواجه مشكلة في الاتصال حالياً. متبقي لديك ${remaining} من ميزانيتك. كيف أساعدك؟`
      : `Sorry, network issue. You have ${remaining} EGP left. How can I help?`;

    return { reply: replyText, recommendedActivities: [] };
  }
};

module.exports = { getAIResponse };
