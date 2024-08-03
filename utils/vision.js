const vision = require('@google-cloud/vision');
const sharp = require('sharp');
require('dotenv').config();

const client = new vision.ImageAnnotatorClient();

const localizeObject = async (imageData) => {
  try {
    const buffer = Buffer.from(imageData.split(',')[1], 'base64');

    const [result] = await client.objectLocalization({ image: { content: buffer } });
    const objects = result.localizedObjectAnnotations;
    console.log('Objects detected:', objects);
    return objects;
  } catch (error) {
    console.error('Error localizing object:', error);
    throw error;
  }
};

const cropImageToBoundingBox = async (imageData, boundingBox) => {
  const buffer = Buffer.from(imageData.split(',')[1], 'base64');
  const { left, top, right, bottom } = boundingBox;

  const metadata = await sharp(buffer).metadata();
  const width = metadata.width;
  const height = metadata.height;

  const extractRegion = {
    left: Math.floor(left * width),
    top: Math.floor(top * height),
    width: Math.floor((right - left) * width),
    height: Math.floor((bottom - top) * height)
  };

  const croppedImageBuffer = await sharp(buffer)
    .extract(extractRegion)
    .toBuffer();

  return `data:image/jpeg;base64,${croppedImageBuffer.toString('base64')}`;
};

module.exports = { localizeObject, cropImageToBoundingBox };

// const vision = require('@google-cloud/vision');
// require('dotenv').config();

// const client = new vision.ImageAnnotatorClient();

// const SPECIFIC_ITEMS = [
//   'apple', 'banana', 'tomato', 'mango', 'orange', 'grape', 'peach',
//   'carrot', 'cucumber', 'potato', 'onion', 'broccoli', 'shampoo', 'bottle',
//   'milk', 'bread', 'butter', 'cheese', 'egg', 'juice', 'snack', 'yogurt',
//   'meat', 'fish', 'chicken', 'pasta', 'rice', 'cereal', 'coffee', 'tea', 'oil'
// ];

// const classifyImage = async (imageData) => {
//   try {
//     const [result] = await client.labelDetection({ image: { content: imageData } });
//     const labels = result.labelAnnotations;
//     console.log('Labels detected:', labels);
//     const relevantLabels = labels
//       .map(label => label.description.toLowerCase())
//       .filter(name => SPECIFIC_ITEMS.some(item => name.includes(item)));
//     console.log('Relevant labels:', relevantLabels);
//     return relevantLabels;
//   } catch (error) {
//     console.error('Error classifying image:', error);
//     throw error;
//   }
// };

// module.exports = { classifyImage };
