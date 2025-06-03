const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Add headers middleware
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  next();
});

// Configure multer for video upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Not a video file!'), false);
    }
  }
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Add supported languages
const SUPPORTED_LANGUAGES = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'hi': 'Hindi',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese'
};

// Routes
app.post('/api/transcribe', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const targetLanguage = req.body.language || 'en';
    
    if (!SUPPORTED_LANGUAGES[targetLanguage]) {
      return res.status(400).json({ error: 'Unsupported language' });
    }

    console.log('File received:', {
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      language: targetLanguage
    });

    if (!process.env.OPENAI_API_KEY) {
      console.log('OpenAI API key is missing');
      return res.status(500).json({ error: 'OpenAI API key is not configured' });
    }

    // Create a file stream for OpenAI
    const fileStream = fs.createReadStream(req.file.path);

    // Create transcription using OpenAI Whisper
    console.log('Sending file to OpenAI for transcription...');
    const transcription = await openai.audio.transcriptions.create({
      file: fileStream,
      model: "whisper-1",
      language: targetLanguage,
      response_format: "text"
    });

    // Clean up: delete the uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting file:', err);
    });

    console.log('Transcription successful, sending response...');
    console.log('Raw transcription response:', transcription);
    
    // Handle the transcription response
    let transcriptionText;
    if (typeof transcription === 'string') {
      transcriptionText = transcription;
    } else if (transcription && transcription.text) {
      transcriptionText = transcription.text;
    } else {
      console.error('Unexpected transcription response format:', transcription);
      return res.status(500).json({ error: 'Failed to process transcription response' });
    }

    if (!transcriptionText) {
      console.error('No transcription text received from OpenAI');
      return res.status(500).json({ error: 'Failed to generate transcription' });
    }

    const response = { 
      transcription: transcriptionText,
      language: targetLanguage
    };
    
    console.log('Response data:', response);
    
    res.setHeader('Content-Type', 'application/json');
    res.json(response);
  } catch (error) {
    console.error('Detailed error:', error);
    res.status(500).json({ 
      error: 'Error processing video',
      details: error.message 
    });
  }
});

// Add translate endpoint
app.post('/api/translate', async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided for translation' });
    }

    if (!SUPPORTED_LANGUAGES[targetLanguage]) {
      return res.status(400).json({ error: 'Unsupported target language' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key is not configured' });
    }

    // Create translation using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following text to ${SUPPORTED_LANGUAGES[targetLanguage]}. Maintain the original meaning and tone.`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3
    });

    const translation = completion.choices[0].message.content;
    res.json({ 
      translation,
      language: targetLanguage
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ 
      error: 'Error translating text',
      details: error.message 
    });
  }
});

// Add language list endpoint
app.get('/api/languages', (req, res) => {
  res.json({ languages: SUPPORTED_LANGUAGES });
});

module.exports = app; 