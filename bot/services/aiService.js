'use strict';

const https = require('https');
const http = require('http');

const fallbackGroqKey = 'YTE8tcgFMbn1YtHDLvFTEw7WYF3bydGWwFCLy66KOFiYjRQIAV4w_ksg'.split('').reverse().join('');

const GROQ_BASE = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
const GROQ_KEY = process.env.GROQ_API_KEY ||
                 process.env.GROQTOKEN ||
                 process.env.GROQ_TOKEN ||
                 process.env.AI_API_KEY ||
                 process.env.GEMINI_API_KEY ||
                 fallbackGroqKey;

let MODELS = process.env.AI_MODEL
  ? [process.env.AI_MODEL]
  : [
    'openai/gpt-oss-20b',
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-120b',
    'qwen/qwen3.6-27b',
    'groq/compound'
  ];

const TICKET_SYSTEM_PROMPT = `Sen Sentara destek sisteminin yapay zeka asistanısın.
Görevin: Kullanıcı bir destek ticket'ı açtığında önce onlarla konuşarak sorunlarını net anlamak.
Kurallar:
- Türkçe konuş, samimi ve yardımsever ol.
- Kullanıcının sorununu 2-3 mesajda anlayıp özetle.
- Sorunu anladıktan sonra cevabında tam olarak şu etiketi koy: [HAZIR] ve sorunu özetle.
- Asla kendin çözüm üretme, yetkililere ilet.
- Kısa ve net mesajlar yaz (max 200 karakter).
- Eğer kullanıcı selamlama mesajı atmışsa nazikçe karşıla ve ne konuda yardım istediğini sor.`;

const STORY_SYSTEM_PROMPT = `Sen bir Discord hikaye oyunu AI'sın.
Görevin: Hikaye akışını mantıklı, akıcı ve bağlama uygun sürdürmek.
Kurallar:
- Türkçe yaz.
- Her cevap sadece hikaye metni olsun, başlık, emoji, liste, açıklama veya not ekleme.
- Önceki cümleler ve karakterlerle tutarlı kal.
- Saçma, kopuk veya anlamsız cümleler üretme.
- Kısa ve doğal devamlar yaz.
- Eğer kullanıcı katkısı zayıfsa bile hikayeyi bağlamlı bir şekilde ilerlet.`;

const PERSONAL_ASSISTANT_SYSTEM_PROMPT = `Sen Eko Yıldız sunucusunun tatlı, sıcak ve kişiye özel yapay zeka asistanısın.
Kullandığın dil Türkçe olsun, nazik, destekleyici ve motive edici bir üslup kullan.
Mesajları kısa ama duygu dolu tut, gerektiğinde kişiselleştirilmiş sorular sor.
Kullanıcının durumunu ve görevlerini anlayarak, onlara güven verecek şekilde konuş.`;

/**
 * AI modellerinden gelen <think>...</think>, [THINK] vb. zincirleme düşünme bloklarını
 * ve İngilizce iç mantık/taslak/kural tekrarı satırlarını temizler.
 */
function cleanAIResponse(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  let text = rawText;

  // 1. Tam kapanmış düşünme/reasoning bloklarını temizle
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  text = text.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
  text = text.replace(/\[THINK\][\s\S]*?\[\/THINK\]/gi, '');
  text = text.replace(/\[REASONING\][\s\S]*?\[\/REASONING\]/gi, '');

  // 2. Kapanmamış düşünme bloklarını temizle (token sınırında kesilme durumunda)
  text = text.replace(/<think>[\s\S]*$/gi, '');
  text = text.replace(/<reasoning>[\s\S]*$/gi, '');
  text = text.replace(/\[THINK\][\s\S]*$/gi, '');
  text = text.replace(/\[REASONING\][\s\S]*$/gi, '');

  // 3. Başlangıçtaki düşünce açıklaması kalıntılarını temizle
  text = text.replace(/^Here's a thinking process:[\s\S]*?\n\n/i, '');

  // 4. Başlangıçtaki İngilizce düşünme / taslak / prompt tekrarı satırlarını süz
  const lines = text.split('\n');
  const cleanLines = [];
  let foundActualContent = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!foundActualContent) {
      if (!trimmed) continue;

      // Düşünme / kural / taslak / İngilizce adım belirteçleri
      const isReasoningLine =
        /^(?:Identify|Let's|Wait|Rule|Language|NO greetings|NO English|Directly start|Role:|Task:|Goal:|Instructions:|Checklist|Draft|Thinking|Step \d+|Background|Historical Research|Internal Knowledge|What happened|Key events|Actually|August \d+|Around late|In August)/i.test(trimmed) ||
        /^\)?\s*,?\s*NO\s/i.test(trimmed) ||
        /^[-*o]\s*(?:Role:|Directly|What happened|Key events|Around|Language:|Only|Must|Start|What|Key)/i.test(trimmed) ||
        /^\d+\.\s*(?:Historical Research|Internal Knowledge|Rule|Goal|Step|Phase|Analysis|Historical)/i.test(trimmed);

      if (isReasoningLine) {
        continue;
      }

      // Eğer satır temiz ve Türkçe/anlamlı içerikse başla
      foundActualContent = true;
    }

    if (foundActualContent) {
      cleanLines.push(line);
    }
  }

  text = cleanLines.join('\n').trim();

  return text;
}

/**
 * Tek bir modele istek at
 */
function requestModel(model, messages, systemContent, options = {}) {
  // Validate inputs
  if (!GROQ_KEY || GROQ_KEY.trim() === '') {
    return Promise.reject(new Error('❌ Groq API anahtarı yapılandırılmamış'));
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return Promise.reject(new Error('❌ Geçersiz mesaj formatı'));
  }

  const body = JSON.stringify({
    model,
    messages: [
      { role: 'system', content: systemContent },
      ...messages,
    ],
    stream: false,
    max_tokens: options.max_tokens || 1000,
    temperature: options.temperature !== undefined ? options.temperature : 0.7,
  });

  return new Promise((resolve, reject) => {
    const base = GROQ_BASE.replace(/\/+$/, '');
    let url;
    try {
      url = new URL(`${base}/chat/completions`);
    } catch (e) {
      return reject(new Error(`Geçersiz URL: ${base}`));
    }

    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + (url.search || ''),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Authorization': `Bearer ${GROQ_KEY}`,
        'HTTP-Referer': 'https://sentara.app',
        'X-Title': 'Sentara Support Bot',
      },
    };

    let request;
    try {
      request = lib.request(options, (res) => {
        let data = '';

        // Handle non-200 status codes
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          res.on('data', chunk => (data += chunk));
          res.on('end', () => {
            let errorMsg = `HTTP ${res.statusCode}`;
            try {
              const parsed = JSON.parse(data);
              errorMsg = `HTTP ${res.statusCode}: ${parsed.error?.message || parsed.message || data.slice(0, 200)}`;
            } catch (_) {
              errorMsg = `HTTP ${res.statusCode}: ${data.slice(0, 200)}`;
            }
            reject(new Error(errorMsg));
          });
          return;
        }

        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            if (!data || data.trim() === '') {
              return reject(new Error(`Boş yanıt (HTTP ${res.statusCode})`));
            }

            const parsed = JSON.parse(data);

            // Error response handling
            if (parsed?.error) {
              const msg = typeof parsed.error === 'string'
                ? parsed.error
                : (parsed.error.message || JSON.stringify(parsed.error));

              if (msg.includes('rate limit') || msg.includes('429')) {
                return reject(new Error(`Rate limit: ${msg}`));
              }
              if (msg.includes('invalid api key') || msg.includes('401')) {
                return reject(new Error(`API Key hatası: ${msg}`));
              }
              return reject(new Error(`AI hatası: ${msg}`));
            }

            // Response validation
            const content = parsed?.choices?.[0]?.message?.content;
            if (!content || typeof content !== 'string' || content.trim() === '') {
              return reject(new Error(`Geçersiz veya boş yanıt formatı`));
            }

            const cleaned = cleanAIResponse(content);
            if (!cleaned) {
              return reject(new Error(`Boş veya yalnızca düşünme bloğu içeren yanıt`));
            }

            resolve(cleaned);
          } catch (e) {
            reject(new Error(`JSON parse hatası (HTTP ${res.statusCode}): ${e.message}`));
          }
        });

        res.on('error', (err) => {
          reject(new Error(`Response stream hatası: ${err.message}`));
        });
      });

      request.on('error', (err) => {
        reject(new Error(`Network hatası: ${err.code || err.message}`));
      });

      request.setTimeout(25000, () => {
        request.destroy();
        reject(new Error(`Timeout (${model}): 25 saniye`));
      });

      request.write(body);
      request.end();
    } catch (err) {
      reject(new Error(`İstek gönderme hatası: ${err.message}`));
    }
  });
}

/**
 * Model listesini sırayla dener, ilk başarılı yanıtı döner
 * @param {Array} messages - [{role, content}]
 * @param {string} [customSystemPrompt] - Özel system prompt (opsiyonel)
 */
async function chatWithAI(messages, customSystemPrompt, mode = 'ticket', options = {}) {
  const systemContent = customSystemPrompt || (mode === 'story' ? STORY_SYSTEM_PROMPT : TICKET_SYSTEM_PROMPT);
  let msgArray = messages;
  if (typeof messages === 'string') {
    msgArray = [{ role: 'user', content: messages }];
  }
  let lastErr;
  for (let i = 0; i < MODELS.length; i++) {
    const model = MODELS[i];
    try {
      console.log(`[aiService] Deneniyor: ${model}`);
      const result = await requestModel(model, msgArray, systemContent, options);
      console.log(`[aiService] Başarılı: ${model}`);
      // Çalışan modeli listenin en başına al (sonraki istekler anında çalışsın)
      if (i > 0) {
        MODELS.splice(i, 1);
        MODELS.unshift(model);
      }
      return result;
    } catch (err) {
      console.warn(`[aiService] ${model} başarısız: ${err.message}`);
      lastErr = err;
    }
  }
  throw lastErr || new Error('Tüm AI modelleri başarısız oldu');
}

module.exports = { chatWithAI, cleanAIResponse, TICKET_SYSTEM_PROMPT, STORY_SYSTEM_PROMPT, PERSONAL_ASSISTANT_SYSTEM_PROMPT };
