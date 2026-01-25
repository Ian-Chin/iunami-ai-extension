import React, { useState } from 'react';
import { Mic, Loader2, CheckCircle2 } from 'lucide-react';

export default function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAction, setLastAction] = useState('');

  const parseCommand = (text: string) => {
    const input = text.toLowerCase();
    
    // Regex Patterns for Iunami Logic
    const nameMatch = input.match(/name of meeting is (.*?)(?=,|$|location|duration)/);
    const timeMatch = input.match(/at (\d+)\s*(am|pm)/);
    const locMatch = input.match(/location is (.*?)(?=,|$|duration|name)/);
    const durMatch = input.match(/duration (?:will be|is) (\d+)\s*(hour|min|minute)/);

    // Date Logic: Default to Today
    let startDate = new Date();
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const ampm = timeMatch[2];
      if (ampm === 'pm' && hours < 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;
      startDate.setHours(hours, 0, 0, 0);
    }

    // Duration Logic: Default to 30 mins if not found
    let durationMinutes = 30;
    if (durMatch) {
      const val = parseInt(durMatch[1]);
      durationMinutes = durMatch[2].includes('hour') ? val * 60 : val;
    }
    
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

    return {
      title: nameMatch ? nameMatch[1].trim() : "New Meeting",
      location: locMatch ? locMatch[1].trim() : "Not specified",
      start: startDate.toISOString(),
      end: endDate.toISOString()
    };
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      await executeNotionTask(transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  const executeNotionTask = async (text: string) => {
    setIsProcessing(true);
    const data = parseCommand(text);

    chrome.storage.local.get(['notionToken', 'databaseId'], async (store) => {
      const response = await chrome.runtime.sendMessage({
        type: 'NOTION_API_CALL',
        endpoint: '/pages',
        method: 'POST',
        token: store.notionToken,
        body: {
          parent: { database_id: store.databaseId },
          properties: {
            "Name": { "title": [{ "text": { "content": data.title } }] },
            "Date": { "date": { "start": data.start, "end": data.end } },
            "Location": { "rich_text": [{ "text": { "content": data.location } }] }
          }
        }
      });

      if (response.success) {
        setLastAction(`Scheduled: ${data.title}`);
      } else {
        setLastAction('Failed to sync to Notion.');
      }
      setIsProcessing(false);
    });
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full px-4">
      <button
        onMouseDown={startListening}
        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
          isListening ? 'bg-red-500 animate-pulse' : 'bg-blue-600 hover:bg-blue-700 shadow-lg'
        } text-white`}
      >
        {isProcessing ? <Loader2 className="animate-spin" /> : <Mic size={32} />}
      </button>

      <div className="text-center">
        <p className="text-sm font-semibold text-gray-700">
          {isListening ? "Listening..." : isProcessing ? "Iunami is thinking..." : "Hold to speak"}
        </p>
        {lastAction && (
          <div className="mt-2 flex items-center justify-center gap-1 text-green-600 text-xs font-medium">
            <CheckCircle2 size={14} /> {lastAction}
          </div>
        )}
      </div>
    </div>
  );
}