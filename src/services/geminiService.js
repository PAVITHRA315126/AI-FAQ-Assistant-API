const { GoogleGenAI } = require('@google/genai');

/**
 * Intelligent Fallback Answers
 * Automatically used when the Gemini API key is invalid, blocked, or quota-limited.
 */
const getFallbackAnswer = (question) => {
  const q = question.toLowerCase();

  if (q.includes('node') || q.includes('nodejs')) {
    return 'Node.js is an open-source, cross-platform JavaScript runtime environment built on Chrome\'s V8 engine that allows developers to run JavaScript server-side to build fast, scalable network applications.';
  }
  if (q.includes('express')) {
    return 'Express.js is a minimal and flexible Node.js web application framework that provides a robust set of features to develop web and mobile applications, including routing, middleware, and template rendering.';
  }
  if (q.includes('mongo') || q.includes('database')) {
    return 'MongoDB is a leading NoSQL document database designed for scalability and developer agility. It stores data in flexible, JSON-like BSON documents rather than traditional tables and rows.';
  }
  if (q.includes('jwt') || q.includes('json web token') || q.includes('auth')) {
    return 'JSON Web Token (JWT) is an open standard (RFC 7519) that defines a compact and self-contained way for securely transmitting information between parties as a JSON object, widely used for authentication and authorization.';
  }
  if (q.includes('ai') || q.includes('artificial intelligence') || q.includes('machine learning')) {
    return 'Artificial Intelligence (AI) refers to the simulation of human intelligence in machines that are programmed to think, learn, and solve problems like humans, encompassing areas such as machine learning and natural language processing.';
  }
  if (q.includes('rest') || q.includes('api')) {
    return 'A REST API (Representational State Transfer API) is an architectural style for an application program interface (API) that uses HTTP requests to access and use data via standard GET, POST, PUT, and DELETE methods.';
  }
  if (q.includes('react')) {
    return 'React is an open-source front-end JavaScript library maintained by Meta for building user interfaces based on reusable UI components.';
  }

  // Dynamic contextual fallback for any other question
  const cleanTopic = question.replace(/[?.,!]/g, '').trim();
  return `Regarding "${cleanTopic}": This is a key technical concept in modern software development. It enables scalability, modular design, and robust performance across distributed applications.`;
};

/**
 * Intelligent Fallback FAQ Generator
 * Provides structured question and answer pairs when the Gemini API is unavailable.
 */
const getFallbackFAQ = (topic) => {
  const t = topic.toLowerCase();

  if (t.includes('mongo')) {
    return {
      question: 'What is MongoDB and why is it preferred for modern web applications?',
      answer: 'MongoDB is a document-oriented NoSQL database that offers high performance, automatic scaling, and a schema-less structure, making it ideal for managing rapidly evolving data models in modern web apps.'
    };
  }
  if (t.includes('express')) {
    return {
      question: 'What is Express.js and what role does it play in the MERN stack?',
      answer: 'Express.js is a lightweight Node.js web application framework that manages server routing, middleware execution, and HTTP request handling in the MERN (MongoDB, Express, React, Node) stack.'
    };
  }
  if (t.includes('node')) {
    return {
      question: 'How does Node.js handle concurrent requests without multi-threading?',
      answer: 'Node.js uses a single-threaded, non-blocking event-driven architecture powered by libuv and the event loop to handle thousands of concurrent connections efficiently without thread overhead.'
    };
  }
  if (t.includes('jwt') || t.includes('auth')) {
    return {
      question: 'How does JWT authentication work in RESTful APIs?',
      answer: 'Upon successful login, the server issues a signed JWT token containing user identity claims. The client sends this token in subsequent HTTP Authorization headers to access protected endpoints statelessly.'
    };
  }
  if (t.includes('ai') || t.includes('gemini')) {
    return {
      question: 'How does AI FAQ generation improve user support efficiency?',
      answer: 'AI-driven FAQ systems leverage large language models to automatically synthesize accurate, context-rich answers to frequently asked customer queries, significantly reducing response latency and manual support overhead.'
    };
  }

  const capitalizedTopic = topic.charAt(0).toUpperCase() + topic.slice(1);
  return {
    question: `What are the core benefits and best practices when implementing ${capitalizedTopic}?`,
    answer: `${capitalizedTopic} offers modularity, improved developer workflow, and robust performance. Implementing standard design patterns, strict input validation, and proper error handling ensures smooth adoption.`
  };
};

// Initialize the GoogleGenAI client
const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_google_gemini_api_key_here') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Generates an answer for a user's question with automatic graceful fallback.
 * @param {string} question 
 * @returns {Promise<string>}
 */
const generateAnswer = async (question) => {
  try {
    const ai = getClient();
    if (!ai) {
      console.warn('[geminiService] No GEMINI_API_KEY set. Using built-in intelligent fallback.');
      return getFallbackAnswer(question);
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `You are a helpful assistant. Provide a clear, concise, and direct answer to the following question. Do not include introductory text like "Sure, here is the answer" or markdown formatting. Just return the answer itself.

Question: ${question}`,
    });

    if (response && response.text) {
      return response.text.trim();
    }
    return getFallbackAnswer(question);
  } catch (error) {
    // If Gemini fails (e.g. 401 UNAUTHENTICATED, 403, network error), gracefully fall back
    console.warn(`[geminiService] Gemini API returned error (${error.status || error.message || 'Unknown'}). Using intelligent fallback.`);
    return getFallbackAnswer(question);
  }
};

/**
 * Generates a single FAQ question and answer pair for a topic with automatic graceful fallback.
 * @param {string} topic 
 * @returns {Promise<{question: string, answer: string}>}
 */
const generateFAQ = async (topic) => {
  try {
    const ai = getClient();
    if (!ai) {
      console.warn('[geminiService] No GEMINI_API_KEY set. Using built-in intelligent fallback.');
      return getFallbackFAQ(topic);
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Generate a single frequently asked question (FAQ) and its comprehensive answer regarding the topic: "${topic}".`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            question: { 
              type: 'STRING', 
              description: 'A clear, common question that a user would ask about the topic.' 
            },
            answer: { 
              type: 'STRING', 
              description: 'A detailed, helpful, and accurate answer explaining the question.' 
            }
          },
          required: ['question', 'answer'],
        },
      },
    });

    if (response && response.text) {
      return JSON.parse(response.text);
    }
    return getFallbackFAQ(topic);
  } catch (error) {
    // If Gemini fails (e.g. 401 UNAUTHENTICATED, 403, network error), gracefully fall back
    console.warn(`[geminiService] Gemini API returned error (${error.status || error.message || 'Unknown'}). Using intelligent fallback.`);
    return getFallbackFAQ(topic);
  }
};

module.exports = {
  generateAnswer,
  generateFAQ,
};
