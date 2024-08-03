// pages/api/classifyImage.js
import { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
require("dotenv").config();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }

  const { imageData } = req.body;

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: [
            {
              type: "text",
              text: "You are a pantry item predictor that can predict an item I am holding in my hand in the image. Return only the name of the item that I am holding in the image. If it is not a pantry item, then reply 'false' as an answer.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: imageData,
              },
            },
          ],
        },
      ],
    });

    const result = response.choices[0].message.content;
    res.status(200).json({ label: result });
  } catch (error) {
    console.error('Error classifying image:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
