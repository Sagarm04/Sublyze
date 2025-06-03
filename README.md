# Sublyze - Video Transcription Web App

## Project Structure
```
sublyze/
├── client/
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json
│   ├── src/
│   │   ├── components/
│   │   │   └── Subscriptions.js
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.css
│   └── package.json
├── server.js
├── package.json
└── README.md
```

## Dependencies

### Root package.json
```json
{
  "name": "sublyze",
  "version": "1.0.0",
  "description": "A web application for video transcription and captioning",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "client": "cd client && npm start",
    "dev:full": "concurrently \"npm run dev\" \"npm run client\""
  },
  "dependencies": {
    "@clerk/clerk-react": "^5.31.8",
    "@clerk/nextjs": "^6.20.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1",
    "openai": "^4.0.0"
  },
  "devDependencies": {
    "concurrently": "^8.2.1",
    "nodemon": "^3.0.1"
  }
}
```

## Setup Instructions

1. Create a new project in bolt.new
2. Copy and paste the project structure and files as shown above
3. Install dependencies:
   ```bash
   npm install
   cd client
   npm install
   ```
4. Create a `.env` file in the root directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
5. Start the development server:
   ```bash
   npm run dev:full
   ```

The application will be available at http://localhost:3000

## Features

- Video upload and processing
- Automatic transcription using AI
- Modern and responsive UI
- Real-time processing status

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Click the file input to select a video file
3. Click "Transcribe Video" to start the transcription process
4. Wait for the transcription to complete
5. View the transcription results below the upload form

## Notes

- The application supports various video formats
- Processing time depends on the video length and server load
- Make sure you have a stable internet connection for optimal performance

## License

MIT 