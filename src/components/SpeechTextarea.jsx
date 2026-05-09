import React, { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

const SpeechTextarea = ({ value, onChange, placeholder, rows = 3, name }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-IN';

      rec.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          onChange({ target: { name, value: value + (value ? ' ' : '') + finalTranscript } });
        }
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, [value, onChange, name]);

  const toggleListen = () => {
    if (isListening) {
      recognition?.stop();
      setIsListening(false);
    } else {
      recognition?.start();
      setIsListening(true);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <textarea
        className="form-control"
        name={name}
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
      {recognition && (
        <button
          type="button"
          onClick={toggleListen}
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            background: isListening ? 'var(--danger)' : 'var(--primary-light)',
            color: isListening ? 'white' : 'var(--primary)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
          title={isListening ? 'Stop recording' : 'Start speech-to-text'}
        >
          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
      )}
    </div>
  );
};

export default SpeechTextarea;
