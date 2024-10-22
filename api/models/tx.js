const { matchModelName } = require('../utils');
const defaultRate = 6;

/** AWS Bedrock pricing */
const bedrockValues = {
  'llama2-13b': { prompt: 9.00, completion: 12.00 },
  'llama2-70b': { prompt: 23.40, completion: 30.72 },
  'llama3-8b': { prompt: 3.60, completion: 7.20 },
  'llama3-70b': { prompt: 31.80, completion: 42.00 },
  'llama3-1-8b': { prompt: 3.60, completion: 7.20 },
  'llama3-1-70b': { prompt: 31.80, completion: 42.00 },
  'llama3-1-405b': { prompt: 63.84, completion: 192.00 },
  'mistral-7b': { prompt: 1.80, completion: 2.40 },
  'mistral-small': { prompt: 1.80, completion: 2.40 },
  'mixtral-8x7b': { prompt: 5.40, completion: 8.40 },
  'mistral-large-2402': { prompt: 48.00, completion: 144.00 },
  'mistral-large-2407': { prompt: 36.00, completion: 108.00 },
  'command-text': { prompt: 18.00, completion: 24.00 },
  'command-light': { prompt: 3.60, completion: 7.20 },
  'ai21.j2-mid-v1': { prompt: 150.00, completion: 150.00 },
  'ai21.j2-ultra-v1': { prompt: 225.60, completion: 225.60 },
  'ai21.jamba-instruct-v1:0': { prompt: 6.00, completion: 8.40 },
  'amazon.titan-text-lite-v1': { prompt: 1.80, completion: 2.40 },
  'amazon.titan-text-express-v1': { prompt: 2.40, completion: 7.20 },
  'amazon.titan-text-premier-v1:0': { prompt: 6.00, completion: 18.00 },
};

/**
 * Mapping of model token sizes to their respective multipliers for prompt and completion.
 * The rates are 1 USD per 1M tokens.
 * @type {Object.<string, {prompt: number, completion: number}>}
 */
const tokenValues = Object.assign(
  {
    '8k': { prompt: 360, completion: 720 },
    '32k': { prompt: 720, completion: 1440 },
    '4k': { prompt: 18, completion: 24 },
    '16k': { prompt: 36, completion: 48 },
    'gpt-3.5-turbo-1106': { prompt: 12, completion: 24 },
    'o1-preview': { prompt: 180, completion: 720 },
    'o1-mini': { prompt: 36, completion: 144 },
    o1: { prompt: 180, completion: 720 },
    'gpt-4o-mini': { prompt: 1.80, completion: 7.20 },
    'gpt-4o': { prompt: 30.00, completion: 120.00 },
    'gpt-4o-2024-05-13': { prompt: 60.00, completion: 180.00 },
    'gpt-4-1106': { prompt: 120.00, completion: 360.00 },
    'gpt-3.5-turbo-0125': { prompt: 6.00, completion: 18.00 },
    'claude-3-opus': { prompt: 180.00, completion: 900.00 },
    'claude-3-sonnet': { prompt: 36.00, completion: 180.00 },
    'claude-3-5-sonnet': { prompt: 36.00, completion: 180.00 },
    'claude-3.5-sonnet': { prompt: 36.00, completion: 180.00 },
    'claude-3-haiku': { prompt: 3.00, completion: 15.00 },
    'claude-2.1': { prompt: 96.00, completion: 288.00 },
    'claude-2': { prompt: 96.00, completion: 288.00 },
    'claude-instant': { prompt: 9.60, completion: 28.80 },
    'claude-': { prompt: 9.60, completion: 28.80 },
    'command-r-plus': { prompt: 36.00, completion: 180.00 },
    'command-r': { prompt: 6.00, completion: 18.00 },
    /* cohere doesn't have rates for the older command models,
  so this was from https://artificialanalysis.ai/models/command-light/providers */
    command: { prompt: 4.56, completion: 4.56 },
    'gemini-1.5': { prompt: 84.00, completion: 252.00 }, // May 2nd, 2024 pricing
    gemini: { prompt: 6.00, completion: 18.00 }, // May 2nd, 2024 pricing
  },
  bedrockValues,
);

/**
 * Mapping of model token sizes to their respective multipliers for cached input, read and write.
 * See Anthropic's documentation on this: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching#pricing
 * The rates are 1 USD per 1M tokens.
 * @type {Object.<string, {write: number, read: number }>}
 */
const cacheTokenValues = {
  'claude-3.5-sonnet': { write: 45.00, read: 3.60 },
  'claude-3-5-sonnet': { write: 45.00, read: 3.60 },
  'claude-3-haiku': { write: 3.60, read: 0.36 },
};

/**
 * Retrieves the key associated with a given model name.
 *
 * @param {string} model - The model name to match.
 * @param {string} endpoint - The endpoint name to match.
 * @returns {string|undefined} The key corresponding to the model name, or undefined if no match is found.
 */
const getValueKey = (model, endpoint) => {
  const modelName = matchModelName(model, endpoint);
  if (!modelName) {
    return undefined;
  }

  if (modelName.includes('gpt-3.5-turbo-16k')) {
    return '16k';
  } else if (modelName.includes('gpt-3.5-turbo-0125')) {
    return 'gpt-3.5-turbo-0125';
  } else if (modelName.includes('gpt-3.5-turbo-1106')) {
    return 'gpt-3.5-turbo-1106';
  } else if (modelName.includes('gpt-3.5')) {
    return '4k';
  } else if (modelName.includes('o1-preview')) {
    return 'o1-preview';
  } else if (modelName.includes('o1-mini')) {
    return 'o1-mini';
  } else if (modelName.includes('o1')) {
    return 'o1';
  } else if (modelName.includes('gpt-4o-2024-05-13')) {
    return 'gpt-4o-2024-05-13';
  } else if (modelName.includes('gpt-4o-mini')) {
    return 'gpt-4o-mini';
  } else if (modelName.includes('gpt-4o')) {
    return 'gpt-4o';
  } else if (modelName.includes('gpt-4-vision')) {
    return 'gpt-4-1106';
  } else if (modelName.includes('gpt-4-1106')) {
    return 'gpt-4-1106';
  } else if (modelName.includes('gpt-4-0125')) {
    return 'gpt-4-1106';
  } else if (modelName.includes('gpt-4-turbo')) {
    return 'gpt-4-1106';
  } else if (modelName.includes('gpt-4-32k')) {
    return '32k';
  } else if (modelName.includes('gpt-4')) {
    return '8k';
  } else if (tokenValues[modelName]) {
    return modelName;
  }

  return undefined;
};

/**
 * Retrieves the multiplier for a given value key and token type. If no value key is provided,
 * it attempts to derive it from the model name.
 *
 * @param {Object} params - The parameters for the function.
 * @param {string} [params.valueKey] - The key corresponding to the model name.
 * @param {'prompt' | 'completion'} [params.tokenType] - The type of token (e.g., 'prompt' or 'completion').
 * @param {string} [params.model] - The model name to derive the value key from if not provided.
 * @param {string} [params.endpoint] - The endpoint name to derive the value key from if not provided.
 * @param {EndpointTokenConfig} [params.endpointTokenConfig] - The token configuration for the endpoint.
 * @returns {number} The multiplier for the given parameters, or a default value if not found.
 */
const getMultiplier = ({ valueKey, tokenType, model, endpoint, endpointTokenConfig }) => {
  if (endpointTokenConfig) {
    return endpointTokenConfig?.[model]?.[tokenType] ?? defaultRate;
  }

  if (valueKey && tokenType) {
    return tokenValues[valueKey][tokenType] ?? defaultRate;
  }

  if (!tokenType || !model) {
    return 1;
  }

  valueKey = getValueKey(model, endpoint);
  if (!valueKey) {
    return defaultRate;
  }

  // If we got this far, and values[tokenType] is undefined somehow, return a rough average of default multipliers
  return tokenValues[valueKey]?.[tokenType] ?? defaultRate;
};

/**
 * Retrieves the cache multiplier for a given value key and token type. If no value key is provided,
 * it attempts to derive it from the model name.
 *
 * @param {Object} params - The parameters for the function.
 * @param {string} [params.valueKey] - The key corresponding to the model name.
 * @param {'write' | 'read'} [params.cacheType] - The type of token (e.g., 'write' or 'read').
 * @param {string} [params.model] - The model name to derive the value key from if not provided.
 * @param {string} [params.endpoint] - The endpoint name to derive the value key from if not provided.
 * @param {EndpointTokenConfig} [params.endpointTokenConfig] - The token configuration for the endpoint.
 * @returns {number | null} The multiplier for the given parameters, or `null` if not found.
 */
const getCacheMultiplier = ({ valueKey, cacheType, model, endpoint, endpointTokenConfig }) => {
  if (endpointTokenConfig) {
    return endpointTokenConfig?.[model]?.[cacheType] ?? null;
  }

  if (valueKey && cacheType) {
    return cacheTokenValues[valueKey]?.[cacheType] ?? null;
  }

  if (!cacheType || !model) {
    return null;
  }

  valueKey = getValueKey(model, endpoint);
  if (!valueKey) {
    return null;
  }

  // If we got this far, and values[cacheType] is undefined somehow, return a rough average of default multipliers
  return cacheTokenValues[valueKey]?.[cacheType] ?? null;
};

module.exports = { tokenValues, getValueKey, getMultiplier, getCacheMultiplier, defaultRate };
