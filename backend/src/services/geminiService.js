const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Abort any Gemini call that takes longer than 30 seconds
const GEMINI_TIMEOUT_MS = 30_000;

const TUTOR_SYSTEM_PROMPT = `You are PathPilot AI Tutor - an expert programming teacher and mentor. 
Your responses MUST always follow this structure:
1. 📖 **Explanation** - Clear, simple explanation of the concept
2. 💡 **Example** - A relatable real-world analogy or scenario
3. 💻 **Code** - Working, commented code example (always use proper markdown code blocks with language)
4. 🌐 **Real-World Use Case** - How this is actually used in production/industry

Rules:
- Be encouraging and student-friendly
- Break down complex topics into simple terms
- Always provide runnable code examples
- If asked about debugging, include common mistakes and how to avoid them
- Keep responses concise but comprehensive
- Use emojis sparingly to make content engaging`;

const ROADMAP_SYSTEM_PROMPT = `You are a PathPilot curriculum designer. Generate detailed, structured learning roadmaps.
Always respond with valid JSON only. No markdown, no extra text.`;

const INTERVIEW_SYSTEM_PROMPT = `You are a senior technical interviewer at a top tech company (Google/Microsoft/Amazon level).
Your role is to conduct mock technical interviews.
- Ask ONE question at a time
- After the candidate answers, evaluate it (correctness, depth, clarity)
- Then ask the next question
- Be professional but encouraging
- Adapt difficulty based on answers
- After all questions, provide a comprehensive evaluation`;

/**
 * Race a promise against a timeout. Rejects with a clear message if Gemini is slow.
 */
const withTimeout = (promise, ms = GEMINI_TIMEOUT_MS) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI service timed out. Please try again.')), ms)
    ),
  ]);
};

/**
 * Safely parse JSON returned by Gemini. Strips any accidental markdown fences.
 * Returns null if parsing fails instead of throwing.
 */
const safeParseJSON = (text) => {
  try {
    // Gemini sometimes wraps JSON in ```json ... ``` despite being told not to
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
};

// AI Tutor — multi-turn chat
const tutorChat = async (messages, context = {}) => {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: TUTOR_SYSTEM_PROMPT,
  });

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({ history });
  const lastMessage = messages[messages.length - 1].content;

  let contextStr = '';
  if (context.topic) contextStr = `\n[Student is currently studying: ${context.topic}]`;

  const result = await withTimeout(chat.sendMessage(lastMessage + contextStr));
  return result.response.text();
};

// Generate roadmap — returns parsed object or throws with a clean message
const generateRoadmap = async ({ skill, currentLevel, dailyHours, goal }) => {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: ROADMAP_SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  const prompt = `Generate a learning roadmap for:
- Skill: ${skill}
- Current Level: ${currentLevel}
- Daily Study Hours: ${dailyHours}
- Goal: ${goal}

Return a JSON object with this exact structure:
{
  "title": "string - roadmap title",
  "totalWeeks": number,
  "estimatedCompletionDate": "ISO date string",
  "aiSummary": "string - 2-3 sentence overview",
  "weeks": [
    {
      "weekNumber": 1,
      "title": "string",
      "goals": ["goal1", "goal2"],
      "milestone": "string - what student can do by end of week",
      "tasks": [
        {
          "day": 1,
          "title": "string",
          "description": "string",
          "estimatedHours": number,
          "resourceType": "video|reading|practice|project"
        }
      ]
    }
  ],
  "resources": [
    {
      "title": "string",
      "url": "string",
      "type": "book|course|docs|video|tool"
    }
  ]
}`;

  const result = await withTimeout(model.generateContent(prompt));
  const text = result.response.text();

  const parsed = safeParseJSON(text);
  if (!parsed) {
    throw new Error('AI returned malformed roadmap data. Please try again.');
  }
  return parsed;
};

// Mock interview — multi-turn
const conductInterview = async (messages, mode, questionCount = 0) => {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: INTERVIEW_SYSTEM_PROMPT,
  });

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({ history });
  const lastMessage = messages[messages.length - 1].content;

  let contextStr = `\n[Interview Mode: ${mode.toUpperCase()}. Questions asked so far: ${questionCount}]`;
  if (questionCount === 0) {
    contextStr += `\nStart by greeting the candidate and asking the first question for a ${mode} interview.`;
  }

  const result = await withTimeout(chat.sendMessage(lastMessage + contextStr));
  return result.response.text();
};

// Generate interview report
const generateInterviewReport = async (questions) => {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' },
  });

  const prompt = `Based on these interview Q&A pairs, generate a detailed evaluation report as JSON:
${JSON.stringify(questions, null, 2)}

Return:
{
  "overallScore": number (0-100),
  "report": {
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"],
    "suggestions": ["improvement1", "improvement2"],
    "verdict": "string - hire/strong hire/no hire/needs improvement"
  }
}`;

  const result = await withTimeout(model.generateContent(prompt));
  const text = result.response.text();

  const parsed = safeParseJSON(text);
  if (!parsed) {
    // Return a safe default report rather than crashing the request
    return {
      overallScore: 0,
      report: {
        strengths: [],
        weaknesses: ['Unable to evaluate — AI response was malformed.'],
        suggestions: ['Please try generating the report again.'],
        verdict: 'needs improvement',
      },
    };
  }
  return parsed;
};

module.exports = { tutorChat, generateRoadmap, conductInterview, generateInterviewReport };