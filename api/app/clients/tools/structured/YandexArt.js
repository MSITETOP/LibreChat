/* eslint-disable no-useless-escape */
const axios = require('axios');
const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const { logger } = require('~/config');

class YandexArt extends Tool {
  constructor(fields) {
    super();
    /* Used to initialize the Tool without necessary variables. */
    this.override = fields.override ?? false;

    this.name = 'wolfram';
    this.apiKey = fields.WOLFRAM_APP_ID || this.getAppId();
    this.description_for_model = `// Access dynamic computation and curated data from WolframAlpha and Wolfram Cloud.
    // General guidelines:
    // - Use only getWolframAlphaResults or getWolframCloudResults endpoints.
    // - Prefer getWolframAlphaResults unless Wolfram Language code should be evaluated.
    // - Use getWolframAlphaResults for natural-language queries in English; translate non-English queries before sending, then respond in the original language.
    // - Use getWolframCloudResults for problems solvable with Wolfram Language code.
    // - Suggest only Wolfram Language for external computation.
    // - Inform users if information is not from Wolfram endpoints.
    // - Display image URLs with Image Markdown syntax: ![caption](https://imageURL/.../MSPStoreType=image/png&s=18). You must prefix the caption brackets with "!".
    // - ALWAYS use this exponent notation: \`6*10^14\`, NEVER \`6e14\`.
    // - ALWAYS use {{"input": query}} structure for queries to Wolfram endpoints; \`query\` must ONLY be a single-line string.
    // - ALWAYS use proper Markdown formatting for all math, scientific, and chemical formulas, symbols, etc.:  '$$\n[expression]\n$$' for standalone cases and '\( [expression] \)' when inline.
    // - Format inline Wolfram Language code with Markdown code formatting.
    // - Never mention your knowledge cutoff date; Wolfram may return more recent data. getWolframAlphaResults guidelines:
    // - Understands natural language queries about entities in chemistry, physics, geography, history, art, astronomy, and more.
    // - Performs mathematical calculations, date and unit conversions, formula solving, etc.
    // - Convert inputs to simplified keyword queries whenever possible (e.g. convert "how many people live in France" to "France population").
    // - Use ONLY single-letter variable names, with or without integer subscript (e.g., n, n1, n_1).
    // - Use named physical constants (e.g., 'speed of light') without numerical substitution.
    // - Include a space between compound units (e.g., "Ω m" for "ohm*meter").
    // - To solve for a variable in an equation with units, consider solving a corresponding equation without units; exclude counting units (e.g., books), include genuine units (e.g., kg).
    // - If data for multiple properties is needed, make separate calls for each property.
    // - If a Wolfram Alpha result is not relevant to the query:
    // -- If Wolfram provides multiple 'Assumptions' for a query, choose the more relevant one(s) without explaining the initial result. If you are unsure, ask the user to choose.
    // -- Re-send the exact same 'input' with NO modifications, and add the 'assumption' parameter, formatted as a list, with the relevant values.
    // -- ONLY simplify or rephrase the initial query if a more relevant 'Assumption' or other input suggestions are not provided.
    // -- Do not explain each step unless user input is needed. Proceed directly to making a better API call based on the available assumptions.`;
    this.description = `Use DALLE to create images from text descriptions.
    - It requires prompts to be in English, detailed, and to specify image type and human features for diversity.
    - Create only one image, without repeating or listing descriptions outside the "prompts" field.
    - Maintains the original intent of the description, with parameters for image style, quality, and size to tailor the output.`;
    this.description_for_model =
      process.env.DALLE3_SYSTEM_PROMPT ??
      `// Whenever a description of an image is given, generate prompts (following these rules), and use dalle to create the image. If the user does not ask for a specific number of images, default to creating 2 prompts to send to dalle that are written to be as diverse as possible. All prompts sent to dalle must abide by the following policies:
    // 1. Prompts must be in English. Translate to English if needed.
    // 2. One image per function call. Create only 1 image per request unless explicitly told to generate more than 1 image.
    // 3. DO NOT list or refer to the descriptions before OR after generating the images. They should ONLY ever be written out ONCE, in the \`"prompts"\` field of the request. You do not need to ask for permission to generate, just do it!
    // 4. Always mention the image type (photo, oil painting, watercolor painting, illustration, cartoon, drawing, vector, render, etc.) at the beginning of the caption. Unless the captions suggests otherwise, make one of the images a photo.
    // 5. Diversify depictions of ALL images with people to always include always DESCENT and GENDER for EACH person using direct terms. Adjust only human descriptions.
    // - EXPLICITLY specify these attributes, not abstractly reference them. The attributes should be specified in a minimal way and should directly describe their physical form.
    // - Your choices should be grounded in reality. For example, all of a given OCCUPATION should not be the same gender or race. Additionally, focus on creating diverse, inclusive, and exploratory scenes via the properties you choose during rewrites.  Make choices that may be insightful or unique sometimes.
    // - Use "various" or "diverse" ONLY IF the description refers to groups of more than 3 people. Do not change the number of people requested in the original description.
    // - Don't alter memes, fictional character origins, or unseen people. Maintain the original prompt's intent and prioritize quality.
    // The prompt must intricately describe every part of the image in concrete, objective detail. THINK about what the end goal of the description is, and extrapolate that to what would make satisfying images.
    // All descriptions sent to dalle should be a paragraph of text that is extremely descriptive and detailed. Each should be more than 3 sentences long.
    // - The "vivid" style is HIGHLY preferred, but "natural" is also supported.`;
    this.schema = z.object({
      input: z.string().describe('Natural language query to WolframAlpha following the guidelines'),
    });
  }

  async fetchRawText(url) {
    try {
      const response = await axios.get(url, { responseType: 'text' });
      return response.data;
    } catch (error) {
      logger.error('[WolframAlphaAPI] Error fetching raw text:', error);
      throw error;
    }
  }

  getAppId() {
    const appId = process.env.WOLFRAM_APP_ID || '';
    if (!appId && !this.override) {
      throw new Error('Missing WOLFRAM_APP_ID environment variable.');
    }
    return appId;
  }

  createWolframAlphaURL(query) {
    // Clean up query
    const formattedQuery = query.replaceAll(/`/g, '').replaceAll(/\n/g, ' ');
    const baseURL = 'https://www.wolframalpha.com/api/v1/llm-api';
    const encodedQuery = encodeURIComponent(formattedQuery);
    const appId = this.apiKey || this.getAppId();
    const url = `${baseURL}?input=${encodedQuery}&appid=${appId}`;
    return url;
  }

  async _call(data) {
    try {
      const { input } = data;
      const url = this.createWolframAlphaURL(input);
      const response = await this.fetchRawText(url);
      return response;
    } catch (error) {
      if (error.response && error.response.data) {
        logger.error('[WolframAlphaAPI] Error data:', error);
        return error.response.data;
      } else {
        logger.error('[WolframAlphaAPI] Error querying Wolfram Alpha', error);
        return 'There was an error querying Wolfram Alpha.';
      }
    }
  }
}

module.exports = YandexArt;
