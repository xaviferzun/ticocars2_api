const axios = require("axios");
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

//KAN-71 Check if a message contains personal information using OpenRouter
const validateMessage = async (text) => {
  try {
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: "openai/gpt-oss-120b:free",
        messages: [
          {
            role: "system",
            content: "You are a content moderator. Your duty is to detect if a message contains personal contact information like phone numbers, email addresses, social media handles, physical addreses or any other contact details. Respond with only 'BLOCKED' if contact information is found or 'ALLOWED' if the message is clean.",
          },
          {
            role: "user",
            content: text,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = response.data.choices[0].message.content.trim();
    return result === "BLOCKED";

  } catch (error) {
    console.error("OpenRouter error:", error.message);
    //If AI fails allow the message to avoid blocking corect messages
    return false;
  }
};

module.exports = {validateMessage};