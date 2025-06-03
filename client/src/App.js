import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import logo from './assets/logo.png';
import Subscriptions from './components/Subscriptions';

// Smart Summary Component
const SmartSummary = ({ transcription, onClose }) => {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateSummary = async () => {
    if (!transcription) {
      setError('No transcription available to summarize');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5001/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ text: transcription }),
      });

      // Log the response for debugging
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      if (response.ok) {
        setSummary(data.summary);
      } else {
        setError(data.error || 'Failed to generate summary');
      }
    } catch (err) {
      console.error('Summary generation error:', err);
      setError('Error connecting to server. Please ensure the backend server is running at http://localhost:5001');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="smart-summary-panel">
      <div className="panel-header">
        <h3>Smart Summary</h3>
        <button onClick={onClose} className="close-button">×</button>
      </div>
      <div className="panel-content">
        {!summary && !loading && (
          <button 
            onClick={generateSummary}
            className="generate-button"
            disabled={!transcription}
          >
            Generate Summary
          </button>
        )}
        {loading && <div className="loading">Generating summary...</div>}
        {error && (
          <div className="error">
            {error}
            <div style={{ marginTop: '10px', fontSize: '0.9em', color: '#ff6b6b' }}>
              Make sure the backend server is running at http://localhost:5001
            </div>
          </div>
        )}
        {summary && (
          <div className="summary-content">
            <h4>Summary</h4>
            <p>{summary}</p>
            <button 
              onClick={() => navigator.clipboard.writeText(summary)}
              className="copy-button"
            >
              Copy to Clipboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  const [video, setVideo] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoPreview, setVideoPreview] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [statsOpen, setStatsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [displayOpen, setDisplayOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editableLines, setEditableLines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const transcriptionRef = useRef(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [languages, setLanguages] = useState({
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
  });
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [translation, setTranslation] = useState('');
  const [translationLanguage, setTranslationLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [lastTranslationLanguage, setLastTranslationLanguage] = useState('en');
  const [languageError, setLanguageError] = useState('');
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [showComplete, setShowComplete] = useState(false);

  // Status messages for the progress bar
  const statusMessages = [
    'Uploading video…',
    'Analyzing audio…',
    'Generating captions…',
    'Almost done…'
  ];

  // Animate progress bar and status messages while loading
  useEffect(() => {
    let progressInterval = null;
    let statusInterval = null;
    if (loading) {
      setProgress(0);
      setStatusIndex(0);
      setShowComplete(false);
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 95) {
            // Slow down as it gets closer to 95
            const increment = prev < 60 ? 2.5 : prev < 80 ? 1.2 : 0.5;
            return Math.min(prev + increment, 95);
          }
          return prev;
        });
      }, 60);
      statusInterval = setInterval(() => {
        setStatusIndex(prev => (prev + 1) % statusMessages.length);
      }, 1200);
    } else if (!loading && progress > 0 && progress < 100) {
      // When loading ends, fill to 100% and show 'Complete!'
      setProgress(100);
      setShowComplete(true);
      setTimeout(() => setShowComplete(false), 1200);
    }
    return () => {
      if (progressInterval) clearInterval(progressInterval);
      if (statusInterval) clearInterval(statusInterval);
    };
    // eslint-disable-next-line
  }, [loading]);

  // Calculate the number of supported languages
  const supportedLanguageCount = Object.keys(languages).length;

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (transcription) {
      setEditableLines(transcription.split('\n'));
      setShowTimestamps(false);
    }
  }, [transcription]);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        console.log('Fetching languages from server...');
        const response = await fetch('http://localhost:5001/api/languages', {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        console.log('Languages response status:', response.status);
        console.log('Languages response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server returned non-JSON response');
        }

        const data = await response.json();
        console.log('Received languages data:', data);
        
        if (data.languages) {
          setLanguages(data.languages);
          setLanguageError('');
        }
      } catch (err) {
        console.error('Error fetching languages:', err);
        // Don't show error message since we have default languages
        setLanguageError('');
      }
    };

    fetchLanguages();
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    handleFile(file);
  };

  const handleFile = (file) => {
    if (file && file.type.startsWith('video/')) {
      setVideo(file);
      setError('');
      // Create video preview and get duration
      const videoUrl = URL.createObjectURL(file);
      const videoElement = document.createElement('video');
      videoElement.src = videoUrl;
      
      videoElement.onloadedmetadata = () => {
        console.log('Video duration:', videoElement.duration);
        setVideoDuration(videoElement.duration);
      setVideoPreview(videoUrl);
      };
    } else {
      setError('Please upload a valid video file');
    }
  };

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files[0];
    handleFile(file);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!video) {
      setError('Please select a video file');
      return;
    }

    setLoading(true);
    setError(null);
    setTranscription(null);
    setTranslation(null);
    setTranslationLanguage('en');

    const formData = new FormData();
    formData.append('video', video);
    formData.append('language', selectedLanguage);

    try {
      console.log('Starting transcription request...');
      const response = await fetch('http://localhost:5001/api/transcribe', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      console.log('Received transcription data:', data);

      if (!data.transcription) {
        throw new Error('No transcription received from server');
      }

        setTranscription(data.transcription);
      setLoading(false);
      console.log('Transcription state updated:', data.transcription);

      // Scroll to transcription results after a short delay to ensure DOM is updated
        setTimeout(() => {
          if (transcriptionRef.current) {
          transcriptionRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start'
          });
          }
        }, 100);

    } catch (err) {
      console.error('Transcription error:', err);
      setError(err.message || 'Failed to transcribe video');
      setLoading(false);
    }
  };

  useEffect(() => {
    const msg = localStorage.getItem('transcribeMessage');
    if (msg) {
      setError(msg);
      localStorage.removeItem('transcribeMessage');
    }
  }, []);

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([transcription], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = 'transcription.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const formatTimestamp = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Helper to split text into sentences
  const splitIntoSentences = (text) => {
    if (!text) return [];
    // Split by sentence-ending punctuation followed by a space or end of string
    return text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];
  };

  const calculateLineTimestamps = (text) => {
    if (!text || !videoDuration) return [];
    const lines = splitIntoSentences(text);
    const totalLines = lines.length;
    const timePerLine = videoDuration / totalLines;
    return lines.map((_, index) => {
      const timestamp = index * timePerLine;
      return formatTimestamp(timestamp);
    });
  };

  const calculateDuration = () => {
    if (!transcription) return '00:00';
    const words = transcription.split(/\s+/).length;
    const estimatedSeconds = Math.floor(words * 0.3); // Assuming average speaking rate
    const minutes = Math.floor(estimatedSeconds / 60);
    const seconds = estimatedSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const calculateWordCount = () => {
    if (!transcription) return 0;
    return transcription.split(/\s+/).length;
  };

  const calculateSpeakingRate = () => {
    if (!transcription) return 0;
    const words = transcription.split(/\s+/).length;
    const duration = words * 0.3; // Estimated duration in seconds
    return Math.round((words / duration) * 60);
  };

  const togglePanel = (panelId) => {
    const panel = document.getElementById(`${panelId}Panel`);
    if (panel) {
      panel.classList.toggle('active');
    }
  };

  const handleEditTranscript = () => {
    setEditing(true);
    showNotification('Edit mode enabled - Scroll to the bottom to save your changes.');
  };

  const handleLineChange = (index, value) => {
    const newLines = [...editableLines];
    newLines[index] = value;
    setEditableLines(newLines);
  };

  const handleLineBlur = () => {
    setTranscription(editableLines.join('\n'));
  };

  const handleSaveEdit = () => {
    setTranscription(editableLines.join('\n'));
    setEditing(false);
    showNotification('Transcript saved!');
  };

  const handleSearchTranscript = () => {
    const searchTerm = prompt('Search in transcript:');
    if (searchTerm) {
      setSearchTerm(searchTerm);
      showNotification(`Searching for "${searchTerm}"...`);
    } else {
      setSearchTerm('');
    }
  };

  const handleExportFormat = (format) => {
    showNotification(`Preparing ${format.toUpperCase()} download...`);
    handleDownload();
  };

  const handleSeekTo = (seconds, event) => {
    console.log(`Seeking to ${seconds} seconds`);
    document.querySelectorAll('.timestamp').forEach(ts => {
      ts.style.background = 'transparent';
    });
    event.target.style.background = 'rgba(139, 92, 246, 0.2)';
  };

  const changeTextSize = (size) => {
    const transcriptLines = document.querySelectorAll('.transcript-line');
    transcriptLines.forEach(line => {
      line.style.fontSize = size;
    });
  };

  const changeLineHeight = (height) => {
    const transcriptLines = document.querySelectorAll('.transcript-line');
    transcriptLines.forEach(line => {
      line.style.lineHeight = height;
    });
  };

  const changeTimestampFormat = (format) => {
    const timestamps = document.querySelectorAll('.timestamp');
    timestamps.forEach((timestamp, index) => {
      const seconds = index * 8;
      let formattedTime;
      
      switch(format) {
        case 'h:mm:ss':
          const hours = Math.floor(seconds / 3600);
          const minutes = Math.floor((seconds % 3600) / 60);
          const secs = seconds % 60;
          formattedTime = `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
          break;
        case 'seconds':
          formattedTime = `${seconds}s`;
          break;
        case 'mm:ss':
        default:
          const mins = Math.floor(seconds / 60);
          const remainingSecs = seconds % 60;
          formattedTime = `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
          break;
      }
      
      timestamp.textContent = formattedTime;
    });
  };

  const showNotification = (message) => {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--accent-gradient);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 500;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };

  // Helper to highlight search term in a line
  const highlightText = (text, term) => {
    if (!term) return text;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.split(regex).map((part, i) =>
      regex.test(part) ? <span key={i} className="highlight">{part}</span> : part
    );
  };

  const toggleSummary = () => {
    setSummaryOpen(!summaryOpen);
  };

  const handleTranslate = async () => {
    if (!transcription) return;
    
    setIsTranslating(true);
    setError('');
    try {
      console.log('Starting translation request...');
      const response = await fetch('http://localhost:5001/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          text: transcription,
          targetLanguage: translationLanguage
        }),
      });

      console.log('Translation response status:', response.status);
      console.log('Translation response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      console.log('Received translation data:', data);

      if (response.ok) {
        setTranslation(data.translation);
        setLastTranslationLanguage(translationLanguage);
        showNotification(`Translated to ${languages[translationLanguage]}`);
      } else {
        setError(data.error || 'Translation failed');
      }
    } catch (err) {
      console.error('Translation error:', err);
      setError('Error translating: ' + err.message);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header custom-header">
        <div className="header-left">
          <img src={logo} alt="Sublyze Logo" className="app-logo" />
        </div>
        <div className="header-center">
          <span className="centered-title" tabIndex={0}>Sublyze</span>
        </div>
        <div className="header-right">
          <button 
            className="theme-toggle" 
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
          </button>
          <div className="toolbar-divider"></div>
                </div>
      </header>

      <main>
        <section className="hero">
          <div className="container">
            <h1>Video Transcription Made Simple</h1>
            <p>Upload your videos and get accurate transcriptions with automated captions in minutes. Perfect for content creators, educators, and businesses.</p>
          </div>
        </section>

        <div className="App-main">
          <div className="content-wrapper">
            <div className="upload-section">
              <form onSubmit={handleSubmit} className="upload-form">
                <div 
                  className="drop-zone"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="file-input"
                    id="video-upload"
                  />
                  <label htmlFor="video-upload" className="drop-zone-label">
                    {video ? (
                      <div className="file-info">
                        <span className="file-name">{video.name}</span>
                        <span className="file-size">
                          {(video.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="upload-icon">🎥</div>
                        <div className="upload-text">Drop your video here or click to browse</div>
                        <div className="upload-hint">Supports MP4, MOV, AVI up to 500MB</div>
                      </>
                    )}
                  </label>
                </div>

                {videoPreview && (
                  <div className="video-preview">
                    <video controls src={videoPreview} />
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loading || !video} 
                  className="submit-button"
                >
                  {loading ? (
                    <div className="loading-spinner" style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '24px',
                      background: '#000000',
                      borderRadius: '12px',
                      border: '1px solid #a78bfa',
                      boxShadow: '0 0 20px #a78bfa40'
                    }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        border: '2px solid #a78bfa',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      <span style={{
                        color: '#ffffff',
                        fontSize: '1rem',
                        fontWeight: '500',
                        letterSpacing: '0.5px'
                      }}>
                        {showComplete ? 'Complete!' : statusMessages[statusIndex]}
                      </span>
                      <div style={{
                        width: '100%',
                        height: '6px',
                        background: 'rgba(167, 139, 250, 0.1)',
                        borderRadius: '3px',
                        overflow: 'hidden',
                        position: 'relative'
                      }}>
                        <div style={{
                          width: `${progress}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #a78bfa 0%, #7c3aed 50%, #a78bfa 100%)',
                          backgroundSize: '200% 100%',
                          animation: 'gradientMove 2s linear infinite',
                          transition: 'width 0.3s ease-in-out',
                          borderRadius: '3px',
                          boxShadow: '0 0 10px rgba(167, 139, 250, 0.5)'
                        }}></div>
                      </div>
                    </div>
                  ) : (
                    'Start Transcribing'
                  )}
                </button>
              </form>

              {error && (
                <div className="error-container">
                  <p className="error">{error}</p>
                </div>
              )}
            </div>

            {transcription && (
              <div ref={transcriptionRef} className="transcription-3col-row" style={{marginTop: '64px'}}>
                <div className="transcription-section-wide">
                  <div className="transcription-header-wide">
                    <h1>Transcription</h1>
                    <div className="lang-translate-toolbar">
                      <select
                        value={translationLanguage}
                        onChange={(e) => setTranslationLanguage(e.target.value)}
                        className="setting-select toolbar-select"
                      >
                        {Object.entries(languages).map(([code, name]) => (
                          <option key={code} value={code}>{name}</option>
                        ))}
                      </select>
                      <button 
                        className="btn-secondary"
                        onClick={handleTranslate}
                        disabled={!transcription || isTranslating}
                      >
                        {isTranslating ? 'Translating...' : '🌍 Translate'}
                      </button>
                    </div>
                    <div className="transcript-toolbar">
                      <button className="btn-secondary edit-btn" onClick={() => handleEditTranscript()}>✏️ Edit</button>
                      <button className="btn-secondary search-btn" onClick={() => handleSearchTranscript()}>🔍 Search</button>
                      <button 
                        className="btn-secondary summary-btn" 
                        onClick={toggleSummary}
                        disabled={!transcription}
                      >
                        📝 Smart Summary
                      </button>
                      <label className="switch-label" htmlFor="show-timestamps-toggle" style={{marginLeft: 16}}>
                        <span style={{marginRight: 10, fontWeight: 500, color: '#a78bfa', fontSize: 15}}>Show Timestamps</span>
                        <span className="switch">
                          <input
                            id="show-timestamps-toggle"
                            type="checkbox"
                            checked={showTimestamps}
                            onChange={e => setShowTimestamps(e.target.checked)}
                          />
                          <span className="slider round"></span>
                        </span>
                      </label>
                    </div>
                    <div className="toolbar-divider"></div>
                  </div>
                  {translation && (
                    <div className="translation-section">
                      <button className="translation-close-btn" onClick={() => setTranslation('')} title="Close">×</button>
                      <h3>Translation ({languages[lastTranslationLanguage]})</h3>
                      <div className="translation-text">
                        {translation}
                      </div>
                    </div>
                  )}
                  <div className="transcript-text-wide" id="transcriptText">
                    {editing ? (
                      editableLines.map((line, index) => {
                        const timestamp = calculateLineTimestamps(transcription)[index];
                        return (
                        <div
                          key={index}
                          className="timestamp-line-wide"
                        >
                          <span className="timestamp">
                              {timestamp}
                          </span>
                          <div
                            className="transcript-line editable-line"
                            contentEditable
                            suppressContentEditableWarning
                            onInput={e => handleLineChange(index, e.currentTarget.textContent)}
                            onBlur={handleLineBlur}
                            style={{outline: 'none', background: 'rgba(139,92,246,0.07)', borderRadius: 6, minHeight: 24, cursor: 'text'}}
                          >
                            {highlightText(line, searchTerm)}
                          </div>
                        </div>
                        );
                      })
                    ) : (
                      splitIntoSentences(transcription).map((line, index) => {
                        const timestamp = calculateLineTimestamps(transcription)[index];
                        return (
                        <div key={index} className="timestamp-line-wide">
                            {showTimestamps && (
                              <span className="timestamp">{timestamp}</span>
                            )}
                          <div className="transcript-line">{highlightText(line, searchTerm)}</div>
                        </div>
                        );
                      })
                    )}
                    {editing && (
                      <div style={{textAlign: 'right', marginTop: 16}}>
                        <button className="btn-secondary" onClick={handleSaveEdit} style={{padding: '8px 32px', borderRadius: 8, fontWeight: 700}}>
                          Save
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="horizontal-controls-bar">
                    <button className="display-toggle-btn stats-toggle-btn" onClick={() => setDisplayOpen((open) => !open)}>
                      ⚙️ Display Settings {displayOpen ? '▲' : '▼'}
                    </button>
                    <button className="stats-toggle-btn" onClick={() => setStatsOpen((open) => !open)}>
                      📊 Statistics {statsOpen ? '▲' : '▼'}
                    </button>
                    <button className="export-toggle-btn stats-toggle-btn" onClick={() => setExportOpen((open) => !open)}>
                      💾 Export Options {exportOpen ? '▲' : '▼'}
                    </button>
                  </div>
                  {displayOpen && (
                    <div className="display-dropdown-panel horizontal-stats-bar dropdown-animate">
                      <div className="setting-item">
                        <label className="setting-label">Text Size</label>
                        <select className="setting-select" onChange={(e) => changeTextSize(e.target.value)}>
                          <option value="0.95rem">Small</option>
                          <option value="1.05rem" selected>Medium</option>
                          <option value="1.15rem">Large</option>
                        </select>
                      </div>
                      <div className="setting-item">
                        <label className="setting-label">Line Height</label>
                        <select className="setting-select" onChange={(e) => changeLineHeight(e.target.value)}>
                          <option value="1.6">Compact</option>
                          <option value="1.8" selected>Normal</option>
                          <option value="2.2">Spacious</option>
                        </select>
                      </div>
                      <div className="setting-item">
                        <label className="setting-label">Timestamp Format</label>
                        <select className="setting-select" onChange={(e) => changeTimestampFormat(e.target.value)}>
                          <option value="mm:ss" selected>MM:SS</option>
                          <option value="h:mm:ss">H:MM:SS</option>
                          <option value="seconds">Seconds</option>
                        </select>
                      </div>
                    </div>
                  )}
                  {statsOpen && (
                    <div className="horizontal-stats-bar dropdown-animate">
                      <div className="stat-col">
                        <span className="stat-label">Duration</span>
                        <span className="stat-value">{calculateDuration()}</span>
                      </div>
                      <div className="stat-col">
                        <span className="stat-label">Word Count</span>
                        <span className="stat-value">{calculateWordCount()}</span>
                      </div>
                      <div className="stat-col">
                        <span className="stat-label">Characters</span>
                        <span className="stat-value">{transcription?.length || 0}</span>
                      </div>
                      <div className="stat-col">
                        <span className="stat-label">Accuracy</span>
                        <span className="stat-value">94%</span>
                      </div>
                      <div className="stat-col">
                        <span className="stat-label">Speaking Rate</span>
                        <span className="stat-value">{calculateSpeakingRate()} WPM</span>
                      </div>
                    </div>
                  )}
                  {exportOpen && (
                    <div className="export-dropdown-panel horizontal-stats-bar dropdown-animate">
                      <div className="export-option">
                        <div className="format-info">
                          <div className="format-name">SRT Subtitles</div>
                          <div className="format-desc">For video editing</div>
                        </div>
                        <button className="btn-secondary" onClick={() => handleExportFormat('srt')}>Download</button>
                      </div>
                      <div className="export-option">
                        <div className="format-info">
                          <div className="format-name">Plain Text</div>
                          <div className="format-desc">Clean transcript</div>
                        </div>
                        <button className="btn-secondary" onClick={() => handleExportFormat('txt')}>Download</button>
                      </div>
                      <div className="export-option">
                        <div className="format-info">
                          <div className="format-name">Word Document</div>
                          <div className="format-desc">For editing</div>
                        </div>
                        <button className="btn-secondary" onClick={() => handleExportFormat('docx')}>Download</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <section className="features" id="features">
          <div className="container">
            <h2>Why Choose Sublyze?</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">⚡</div>
                <h3>Lightning Fast</h3>
                <p>Advanced AI processes your videos quickly, delivering accurate transcriptions in minutes, not hours.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🎯</div>
                <h3>High Accuracy</h3>
                <p>State-of-the-art speech recognition technology ensures your transcriptions are precise and reliable.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🌐</div>
                <h3>Multiple Languages</h3>
                <p>Support for {supportedLanguageCount}+ languages and dialects, making your content accessible to global audiences.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📱</div>
                <h3>Easy Export</h3>
                <p>Download your transcriptions in various formats: SRT, VTT, TXT, or embed directly into your videos.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🔒</div>
                <h3>Secure & Private</h3>
                <p>Your videos are processed securely and deleted after transcription. Your privacy is our priority.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">💰</div>
                <h3>Affordable Pricing</h3>
                <p>Transparent pricing with no hidden fees. Pay only for what you use with our flexible plans.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="reviews" id="reviews">
          <div className="container">
            <h2>What Our Customers Say</h2>
            <p className="reviews-subtitle">1+ Million Customers Happy</p>
            <div className="reviews-grid">
              <div className="review-card">
                <div className="review-avatar">😊</div>
                <div className="review-content">
                  <h4>Sarah K.</h4>
                  <p>"Sublyze made transcribing my lectures effortless. The accuracy is amazing and the process is so fast!"</p>
                </div>
              </div>
              <div className="review-card">
                <div className="review-avatar">🚀</div>
                <div className="review-content">
                  <h4>James T.</h4>
                  <p>"I love how easy it is to use. The captions are spot on and exporting is a breeze. Highly recommended!"</p>
                </div>
              </div>
              <div className="review-card">
                <div className="review-avatar">🌟</div>
                <div className="review-content">
                  <h4>Priya S.</h4>
                  <p>"Sublyze helped me reach a global audience with multi-language support. Over a million happy users can't be wrong!"</p>
                </div>
              </div>
            </div>
            <div className="reviews-stats">
              <div className="stat-box">
                <div className="stat-value">2M+</div>
                <div className="stat-label">Active Users</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">$500M+</div>
                <div className="stat-label">Tracked Monthly</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">98%</div>
                <div className="stat-label">Satisfaction</div>
              </div>
            </div>
          </div>
        </section>

        <footer className="footer">
          <div className="container">
            <p>&copy; 2025 Sublyze. All rights reserved. | Privacy Policy | Terms of Service</p>
          </div>
        </footer>

        {summaryOpen && (
          <>
            <div className="smart-summary-backdrop" onClick={() => setSummaryOpen(false)} />
            <SmartSummary 
              transcription={transcription}
              onClose={() => setSummaryOpen(false)}
            />
          </>
        )}

        <Subscriptions />
      </main>
    </div>
  );
}

export default App;
 