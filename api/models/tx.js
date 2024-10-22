const { matchModelName } = require('../utils');
const defaultRate = 6;

/** AWS Bedrock pricing */
const bedrockValues = {
  'llama2-13b': { prompt: 0.825, completion: 1.1 },
  'llama2-70b': { prompt: 2.145, completion: 2.816 },
  'llama3-8b': { prompt: 0.33, completion: 0.66 },
  'llama3-70b': { prompt: 2.915, completion: 3.85 },
  'llama3-1-8b': { prompt: 0.33, completion: 0.66 },
  'llama3-1-70b': { prompt: 2.915, completion: 3.85 },
  'llama3-1-405b': { prompt: 5.852, completion: 16.8 },
  'mistral-7b': { prompt: 0.165, completion: 0.22 },
  'mistral-small': { prompt: 0.165, completion: 0.22 },
  'mixtral-8x7b': { prompt: 0.495, completion: 0.77 },
  'mistral-large-2402': { prompt: 4.4, completion: 13.2 },
  'mistral-large-2407': { prompt: 3.3, completion: 9.9 },
  'command-text': { prompt: 1.65, completion: 2.2 },
  'command-light': { prompt: 0.33, completion: 0.66 },
  'ai21.j2-mid-v1': { prompt: 13.75, completion: 13.75 },
  'ai21.j2-ultra-v1': { prompt: 20.68, completion: 20.68 },
  'ai21.jamba-instruct-v1:0': { prompt: 0.55, completion: 0.77 },
  'amazon.titan-text-lite-v1': { prompt: 0.165, completion: 0.22 },
  'amazon.titan-text-express-v1': { prompt: 0.22, completion: 0.66 },
  'amazon.titan-text-premier-v1:0': { prompt: 0.55, completion: 1.65 },
};

/**
 * Mapping of model token sizes to their respective multipliers for prompt and completion.
 * The rates are 1 USD per 1M tokens.
 * @type {Object.<string, {prompt: number, completion: number}>}
 */
const tokenValues = Object.assign(
  {
    '8k': { prompt: 33, completion: 66 },
    '32k': { prompt: 66, completion: 132 },
    '4k': { prompt: 1.65, completion: 2.2 },
    '16k': { prompt: 3.3, completion: 4.4 },
    'gpt-3.5-turbo-1106': { prompt: 1.1, completion: 2.2 },
    'o1-preview': { prompt: 16.5, completion: 66 },
    'o1-mini': { prompt: 3.3, completion: 13.2 },
    o1: { prompt: 16.5, completion: 66 },
    'gpt-4o-mini': { prompt: 0.165, completion: 0.66 },
    'gpt-4o': { prompt: 2.75, completion: 11 },
    'gpt-4o-2024-05-13': { prompt: 5.5, completion: 16.5 },
    'gpt-4-1106': { prompt: 11, completion: 33 },
    'gpt-3.5-turbo-0125': { prompt: 0.55, completion: 1.65 },
    'claude-3-opus': { prompt: 16.5, completion: 82.5 },
    'claude-3-sonnet': { prompt: 3.3, completion: 16.5 },
    'claude-3-5-sonnet': { prompt: 3.3, completion: 16.5 },
    'claude-3.5-sonnet': { prompt: 3.3, completion: 16.5 },
    'claude-3-haiku': { prompt: 0.275, completion: 1.375 },
    'claude-2.1': { prompt: 8.8, completion: 26.4 },
    'claude-2': { prompt: 8.8, completion: 26.4 },
    'claude-instant': { prompt: 0.88, completion: 2.64 },
    'claude-': { prompt: 0.88, completion: 2.64 },
    'command-r-plus': { prompt: 3.3, completion: 16.5 },
    'command-r': { prompt: 0.55, completion: 1.65 },
    command: { prompt: 0.418, completion: 0.418 },
    'gemini-1.5': { prompt: 7.7, completion: 23.1 }, // May 2nd, 2024 pricing
    gemini: { prompt: 0.55, completion: 1.65 }, // May 2nd, 2024 pricing
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
  'claude-3.5-sonnet': { write: 4.125, read: 0.33 },
  'claude-3-5-sonnet': { write: 4.125, read: 0.33 },
  'claude-3-haiku': { write: 0.33, read: 0.033 },
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
