import { NativeModules, Platform } from 'react-native';

const PRIMARY_LAN_IPS = ['192.168.0.151', '192.168.0.158'];
const OLLAMA_PORT = '11434';

// Find IP addresses to connect to local Ollama (works on web, emulator, and physical phone)
const getHostCandidates = () => {
  const hosts = [];

  // Browser hostname (web)
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const h = window.location.hostname;
    if (h && h !== 'localhost' && h !== '127.0.0.1') {
      hosts.push(h);
    }
  }

  // Metro bundler host IP on phone (Expo Go)
  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/:\/\/([^:\/]+)/);
      if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
        hosts.push(match[1]);
      }
    }
  } catch (e) {}

  // Mac local network IPs
  hosts.push(...PRIMARY_LAN_IPS);

  // Android emulator localhost alias
  try {
    if (Platform && Platform.OS === 'android') {
      hosts.push('10.0.2.2');
    }
  } catch (e) {}

  // Localhost fallback
  hosts.push('localhost', '127.0.0.1');

  return Array.from(new Set(hosts.filter(Boolean)));
};

// Send request to Ollama with timeout
const callOllama = async (model, prompt, options = {}, timeout = 8000) => {
  const requestOptions = {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options
    })
  };

  const hosts = getHostCandidates();

  for (const host of hosts) {
    const endpoint = `http://${host}:${OLLAMA_PORT}/api/generate`;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(endpoint, {
        ...requestOptions,
        signal: controller.signal
      });
      clearTimeout(id);
      if (response.ok) {
        const json = await response.json();
        if (json && json.response) {
          return json.response;
        }
      }
    } catch (e) {
      clearTimeout(id);
    }
  }

  // If primary model failed, fallback to qwen2.5:1.5b if available
  if (model !== 'qwen2.5:1.5b') {
    return callOllama('qwen2.5:1.5b', prompt, options, timeout);
  }

  return null;
};

// Generate a polite response suggestion using Gemma
export const generatePoliteResponse = async (rudeText) => {
  const prompt = `You are a child safety assistant named Navi. The child received this rude message: "${rudeText}". The child wants to respond politely to keep the conversation kind. Write a very short, polite, child-friendly response (1 sentence, max 15 words) that sets a kind boundary. Do not repeat the rude message. Output ONLY the response text itself, no explanations, no quotes.`;
  
  const result = await callOllama('gemma:2b', prompt);
  return result ? result.trim().replace(/^["']|["']$/g, '') : null;
};

// Generate simulated friend reply for testing chat flow
export const generateContactReply = async (contactName, contactRole, contactBio, chatHistory) => {
  // Use last 6 messages for context
  const contextMsgs = chatHistory.slice(-6).map(m => {
    const senderName = m.sender === 'user' ? 'Me' : contactName;
    return `${senderName}: ${m.text}`;
  }).join('\n');

  const roleClean = contactRole.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '').trim();

  const prompt = `You are ${contactName}, a child's ${roleClean}. Your personality/bio: "${contactBio}".
Respond to your friend's chat in a very natural, friendly, kid-friendly chat style. Stay on the topic they are talking about (e.g. pickleball, Lego, drawings, school).
Keep your response short (1 to 2 sentences, maximum 25 words). Do not prefix with your name. Respond directly.

Conversation history:
${contextMsgs}

Response from ${contactName}:`;

  const result = await callOllama('gemma:2b', prompt);
  return result ? result.trim().replace(/^["']|["']$/g, '') : null;
};

// Generate 3 polite reply options for the popup
export const generatePoliteSuggestionsList = async (rudeText) => {
  const prompt = `You are a child safety assistant named Navi. The child received this rude message: "${rudeText}".
Generate exactly 3 short, distinct, polite, child-friendly reply options (max 15 words each) that set a kind boundary and keep the conversation friendly.
Do not write explanations, quotes, or markdown. Output them as a numbered list:
1. [First reply option]
2. [Second reply option]
3. [Third reply option]`;

  const result = await callOllama('gemma:2b', prompt + `\nEnsure variety. Seed: ${Math.random()}`, {
    temperature: 0.9,
    top_p: 0.9
  });

  if (result) {
    const lines = result.split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim().replace(/^["']|["']$/g, ''))
      .filter(line => line.length > 0 && !line.startsWith('Here are') && !line.includes('reply option'));
    
    if (lines.length > 0) {
      return lines.slice(0, 3);
    }
  }

  return null;
};

// Generate simulated incoming message for testing (good, personal info asking, or mean)
export const generateSimulatedMessage = async (contactName, contactBio, mood) => {
  let promptInstruction = "";
  if (mood === 'good') {
    promptInstruction = `You are roleplaying as ${contactName}, a child's friend. Personality: "${contactBio}".
Write a friendly, normal, kind chat message (1 sentence, max 15 words) about typical school, games, toys, or hobbies (e.g. "I love playing basketball" or "Let's work on our homework together!").
Do not repeat or make it mean. Do not prefix with your name. Output ONLY the text of the message, no quotes.`;
  } else if (mood === 'info') {
    promptInstruction = `You are roleplaying as ${contactName}, a child's friend.
Write a chat message (1 sentence, max 15 words) asking the child for their private/personal information (e.g., "where do you live?", "what's your phone number?", "what school do you go to?", or "are your parents home?").
Do not prefix with your name. Output ONLY the text of the message, no quotes.`;
  } else {
    promptInstruction = `You are roleplaying as ${contactName}, a child's friend.
Write a mean, rude, or insulting chat message (1 sentence, max 15 words) that makes fun of someone, calls them a loser/ugly/stupid, or tells them to go away.
Do not prefix with your name. Output ONLY the text of the message, no quotes.`;
  }

  const result = await callOllama('gemma:2b', promptInstruction + `\nEnsure this response is completely unique, creative, and different from typical responses. Random seed: ${Math.random()}`, {
    temperature: 0.95,
    top_p: 0.9,
    top_k: 40
  });

  return result ? result.trim().replace(/^["']|["']$/g, '') : null;
};

// Generate advice for support workers handling a child's request
export const generateSupportAdvice = async (situation, textingType) => {
  const prompt = `You are a child safety and mental health coach helper. A child submitted a support request because they encountered an issue online/texting.
Child's situation: "${situation}"
Context/Type: "${textingType}"
Provide 1 to 2 sentences of professional, actionable advice for a support worker/counselor on how to best respond to and help this child. Do not address the child directly. Address the support worker. Keep it under 40 words.`;

  const result = await callOllama('gemma:2b', prompt);
  return result ? result.trim().replace(/^["|']|["|']$/g, '') : "Listen actively, validate their feelings, and help them set a kind but firm boundary.";
};

// Generate Navi's answer to a child's question in the support center
export const generateNaviChildAdvice = async (situation, textingType) => {
  const cleanInput = (situation || '').trim();

  const prompt = `You are Navi, a helpful, caring, and knowledgeable AI online safety buddy for kids. You live right inside this app on the child's device.
A child asked you: "${cleanInput}" (Category: ${textingType}).

Instructions:
- Directly answer the child's message or question with clear, practical, friendly advice in 2 to 3 sentences.
- If they ask for tips, give real, practical tips (e.g. keep passwords secret, don't share personal info, tell a trusted adult).
- If they share an upsetting or mean situation, give warm encouragement and actionable steps to stay safe.
- If they ask about who/where you are, answer cheerfully as Navi.
- Keep your tone warm, encouraging, positive, and kid-friendly (under 50 words). Output only your answer.`;

  const result = await callOllama('gemma:2b', prompt, { temperature: 0.7 }, 15000);
  if (result && result.trim()) {
    return result.trim().replace(/^["|']|["|']$/g, '');
  }

  // Dynamic contextual fallback if model is busy
  const lower = cleanInput.toLowerCase();
  if (lower.includes('tip') || lower.includes('safe') || lower.includes('advice')) {
    return `Here are two big safety tips: 1. Never share your passwords or personal info online! 2. Always tell a trusted adult if something feels weird or uncomfortable. 🛡️`;
  }
  if (lower.includes('where')) {
    return `I'm right here inside your app on your device! I'm always with you to keep your chats safe and fun. 💙`;
  }
  if (lower.includes('who') || lower.includes('what are you')) {
    return `I'm Navi! Your friendly AI safety buddy. I'm here to help you navigate chats and keep things positive. 🌟`;
  }
  if (lower.includes('how many') || lower.includes('people')) {
    return `I talk with awesome kids like you every day to help everyone stay safe and happy online! 😊`;
  }
  if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey')) {
    return `Hi there! I'm Navi! I'm so happy to chat with you today! 💙`;
  }

  return `I'm right here to help you with "${cleanInput}"! What else would you like to know? 💙`;
};
