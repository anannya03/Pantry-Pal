// import { NextApiRequest, NextApiResponse } from 'next';
// import OpenAI from 'openai';
// import { localizeObject, cropImageToBoundingBox } from '../../utils/vision';
// require('dotenv').config();

// export default async function handler(req, res) {
//   if (req.method !== 'POST') {
//     res.status(405).json({ message: 'Method not allowed' });
//     return;
//   }

//   const { imageData } = req.body;
//   console.log('Received image data:', imageData);

//   try {
//     const objects = await localizeObject(imageData);
//     if (objects.length === 0) {
//       res.status(200).json({ label: 'false' });
//       return;
//     }

//     const boundingBox = objects[0].boundingPoly.normalizedVertices;
//     const cropBox = {
//       left: boundingBox[0].x,
//       top: boundingBox[0].y,
//       right: boundingBox[2].x,
//       bottom: boundingBox[2].y,
//     };

//     const croppedImageData = await cropImageToBoundingBox(imageData, cropBox);

//     const client = new OpenAI({
//       apiKey: process.env.OPENAI_API_KEY,
//     });

//     const response = await client.chat.completions.create({
//       model: 'gpt-4',
//       messages: [
//         {
//           role: 'system',
//           content: 'You are a grocery item predictor that can predict an item I am holding in the image. Return only the name of the item that I am holding in the image. If it is not a pantry item, then reply "false" as an answer.',
//         },
//         {
//           role: 'user',
//           content: [
//             {
//               type: 'image_url',
//               image_url: {
//                 url: croppedImageData,
//               },
//             },
//           ],
//         },
//       ],
//     });

//     const result = response.choices[0].message.content;
//     res.status(200).json({ label: result });
//   } catch (error) {
//     console.error('Error classifying image:', error);
//     res.status(500).json({ message: 'Internal server error', error: error.message });
//   }
// }




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
              text: "You are a grocery item predictor that can predict an item I am holding in the image. It can be a fruit, vegetable, snacks, grocery, bakery items, cosmetic, shampoo etc. Ignore background noise and focus on the object in the hand. Also try to read the fine print at times to identify the product. Return only the name of the item that I am holding in the image. If it is not a pantry item, then reply 'false' as an answer.",
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
