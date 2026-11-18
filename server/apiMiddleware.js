/**
 * Server-side API middleware for WEATHERLY PRO.
 *
 * Runs inside the Vite dev server and `vite preview`. Secrets (Anthropic and
 * OpenWeatherMap keys) are read from `.env` here and NEVER reach the browser.
 *
 * Endpoints:
 *   GET  /api/config                         -> which optional features are configured
 *   POST /api/assistant                      -> AI weather assistant (Claude)
 *   GET  /api/tiles/owm/:layer/:z/:x/:y.png  -> OpenWeatherMap map-tile proxy
 *
 * For a production deployment, host these same handlers on your server or as
 * serverless functions (the request handler below has no Vite dependency).
 */
import Anthropic from '@anthropic-ai/sdk';

const OWM_LAYERS = new Set(['clouds_new', 'precipitation_new', 'wind_new', 'temp_new', 'pressure_new']);
const LANGUAGE_NAMES = { en: 'English', ru: 'Russian', ky: 'Kyrgyz' };
const MAX_BODY = 256 * 1024;

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(Object.assign(new Error('Payload too large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch {
        reject(Object.assign(new Error('Invalid JSON'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function buildSystemPrompt(lang) {
  const language = LANGUAGE_NAMES[lang] || 'English';
  return [
    'You are the weather assistant inside the WEATHERLY PRO app.',
    'You answer practical questions about weather: what to wear, whether it is a good day to travel, if it will rain, whether it is safe to go outside, and what the conditions are in a given place.',
    '',
    'Ground every statement in the WEATHER_DATA JSON the app attaches to the user message. It holds real measurements and forecasts from Open-Meteo for the selected location, several Kyrgyz cities and the user\'s saved favourites.',
    'Never invent temperatures, probabilities or forecasts. If the user asks about a place or a time range that is not in WEATHER_DATA, say that you do not have data for it and suggest searching for that city in the app.',
    'Quote concrete numbers (temperature, feels-like, precipitation probability, wind, UV, AQI) with the units given in the data. Alerts in the data are derived from forecast thresholds, not official warnings - describe them that way.',
    'For safety questions, be direct about real hazards (thunderstorms, strong gusts, extreme heat or cold, very poor air quality) without exaggerating.',
    '',
    `Always reply in ${language}${lang === 'ky' ? ' (Кыргыз тили, Cyrillic script)' : ''}, even if the data or question uses another language.`,
    'Keep answers short and scannable: 2-6 sentences or a brief bullet list. Use plain text with simple "- " bullets; no headings, no tables.',
  ].join('\n');
}

async function handleAssistant(req, res, env) {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    sendJson(res, 503, { error: 'not_configured' });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    sendJson(res, err.status || 400, { error: 'bad_request', message: err.message });
    return;
  }

  const { messages, weather, lang } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    sendJson(res, 400, { error: 'bad_request', message: 'messages[] is required' });
    return;
  }

  // Keep the last 10 turns; only plain text user/assistant messages are accepted.
  const history = messages
    .slice(-10)
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

  if (!history.length || history[history.length - 1].role !== 'user') {
    sendJson(res, 400, { error: 'bad_request', message: 'The last message must come from the user' });
    return;
  }

  // Attach the live weather context to the newest user message.
  const last = history[history.length - 1];
  last.content = `WEATHER_DATA (fetched ${new Date().toISOString()}):\n${JSON.stringify(weather ?? {})}\n\nQUESTION:\n${last.content}`;

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.beta.messages.create({
      model: env.ANTHROPIC_MODEL || 'claude-opus-5-5',
      max_tokens: 4000,
      output_config: { effort: 'low' },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: buildSystemPrompt(lang),
      messages: history,
    });

    if (response.stop_reason === 'refusal') {
      sendJson(res, 200, { error: 'refusal' });
      return;
    }

    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();

    sendJson(res, 200, { reply: text });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      sendJson(res, 401, { error: 'auth' });
    } else if (err instanceof Anthropic.RateLimitError) {
      sendJson(res, 429, { error: 'rate_limit' });
    } else if (err instanceof Anthropic.APIStatusError) {
      console.error('[assistant] API error', err.status, err.message);
      sendJson(res, 502, { error: 'upstream', status: err.status });
    } else if (err instanceof Anthropic.APIConnectionError) {
      sendJson(res, 502, { error: 'network' });
    } else {
      console.error('[assistant] unexpected error', err);
      sendJson(res, 500, { error: 'server' });
    }
  }
}

async function handleOwmTile(req, res, env, match) {
  const key = env.OPENWEATHER_API_KEY;
  if (!key) {
    res.statusCode = 404;
    res.end();
    return;
  }
  const [, layer, z, x, y] = match;
  if (!OWM_LAYERS.has(layer)) {
    res.statusCode = 400;
    res.end();
    return;
  }
  try {
    const upstream = await fetch(
      `https://tile.openweathermap.org/map/${layer}/${z}/${x}/${y}.png?appid=${encodeURIComponent(key)}`,
    );
    res.statusCode = upstream.status;
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=600');
    res.end(Buffer.from(await upstream.arrayBuffer()));
  } catch {
    res.statusCode = 502;
    res.end();
  }
}

/** Framework-agnostic request handler (Node `http` / connect style). */
export function createApiHandler(env) {
  return async function apiHandler(req, res, next) {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;

    if (path === '/api/config' && req.method === 'GET') {
      sendJson(res, 200, {
        ai: Boolean(env.ANTHROPIC_API_KEY),
        owmTiles: Boolean(env.OPENWEATHER_API_KEY),
      });
      return;
    }

    if (path === '/api/assistant') {
      if (req.method !== 'POST') {
        sendJson(res, 405, { error: 'method_not_allowed' });
        return;
      }
      await handleAssistant(req, res, env);
      return;
    }

    const tile = path.match(/^\/api\/tiles\/owm\/([a-z_]+)\/(\d{1,2})\/(\d+)\/(\d+)\.png$/);
    if (tile && req.method === 'GET') {
      await handleOwmTile(req, res, env, tile);
      return;
    }

    if (path.startsWith('/api/')) {
      sendJson(res, 404, { error: 'not_found' });
      return;
    }
    next();
  };
}

/** Vite plugin that mounts the handler in dev and preview servers. */
export function weatherlyApi(env) {
  const handler = createApiHandler(env);
  return {
    name: 'weatherly-api',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
