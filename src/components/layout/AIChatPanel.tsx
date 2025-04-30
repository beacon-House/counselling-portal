/**
 * AI Chat Panel component
 * Provides a chat interface for counsellors to interact with AI and tag students
 * Uses Gemini API for contextual responses and student data analysis
 */
import React, { useState, useEffect, useRef } from 'react';
import { Send, User, X, Search, Bot, Smile, AtSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { Student, Note, Subtask } from '../../types/types';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  studentId?: string;
  studentName?: string;
}

interface StudentSuggestion {
  id: string;
  name: string;
  displayText: string;
}

interface MentionedStudent {
  id: string;
  name: string;
}

interface ConversationContext {
  messages: Array<{ role: 'user' | 'model', parts: Array<{ text: string }> }>;
  studentData?: Record<string, any>;
}

export default function AIChatPanel() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMentioning, setIsMentioning] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [studentSuggestions, setStudentSuggestions] = useState<StudentSuggestion[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [mentionedStudents, setMentionedStudents] = useState<MentionedStudent[]>([]);
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    messages: []
  });
  
  // Cache for student data to reduce API calls
  const [studentDataCache, setStudentDataCache] = useState<Record<string, any>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with a welcome message
  useEffect(() => {
    const welcomeMessage = {
      id: '1',
      text: "Hello! I'm your AI assistant. How can I help you today? You can mention a student using the @ symbol.",
      sender: 'ai',
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
    
    // Initialize conversation context with welcome message
    setConversationContext({
      messages: [
        { 
          role: 'model',
          parts: [{ text: welcomeMessage.text }]
        }
      ]
    });
  }, []);

  // Monitor input for @ symbol to trigger student mention
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    const position = e.target.selectionStart || 0;
    setCursorPosition(position);
    
    // Check for @ symbol
    let inMention = false;
    let mentionStart = -1;
    let query = '';
    
    for (let i = 0; i < position; i++) {
      if (value[i] === '@' && (i === 0 || value[i-1] === ' ' || value[i-1] === '\n')) {
        inMention = true;
        mentionStart = i;
      } else if (inMention && (value[i] === ' ' || value[i] === '\n')) {
        inMention = false;
        mentionStart = -1;
      }
    }
    
    if (inMention) {
      query = value.substring(mentionStart + 1, position);
      setMentionQuery(query);
      setMentionStartIndex(mentionStart);
      
      if (!isMentioning) {
        fetchStudentSuggestions(query);
      }
      
      setIsMentioning(true);
    } else {
      setIsMentioning(false);
    }
  };

  // Fetch student suggestions when @ is typed - case insensitive
  const fetchStudentSuggestions = async (query: string) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, email, grade, curriculum')
        .ilike('name', `%${query}%`)
        .order('name')
        .limit(5);
      
      if (error) throw error;
      
      const suggestions: StudentSuggestion[] = (data || []).map(student => ({
        id: student.id,
        name: student.name,
        displayText: `${student.name} (${student.grade}, ${student.curriculum})`
      }));
      
      setStudentSuggestions(suggestions);
    } catch (error) {
      console.error('Error fetching student suggestions:', error);
      setStudentSuggestions([]);
    }
  };

  // Handler for student selection from dropdown
  const handleStudentSelect = (student: StudentSuggestion) => {
    if (mentionStartIndex < 0) return;
    
    // Replace the @query with @StudentName
    const beforeMention = inputValue.substring(0, mentionStartIndex);
    const afterMention = inputValue.substring(cursorPosition);
    const newValue = `${beforeMention}@${student.name} ${afterMention}`;
    
    setInputValue(newValue);
    setIsMentioning(false);
    
    // Add to mentioned students
    setMentionedStudents(prev => {
      // Check if already in the array to avoid duplicates
      if (!prev.some(s => s.id === student.id)) {
        return [...prev, { id: student.id, name: student.name }];
      }
      return prev;
    });
    
    // Focus and set cursor position after the inserted student name
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newPosition = mentionStartIndex + student.name.length + 2; // +2 for @ and space
        inputRef.current.selectionStart = newPosition;
        inputRef.current.selectionEnd = newPosition;
      }
    }, 0);
  };

  // Fetch student data for AI context - with caching
  const fetchStudentData = async (studentId: string) => {
    // Check cache first
    if (studentDataCache[studentId]) {
      return studentDataCache[studentId];
    }
    
    try {
      // Fetch student profile
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();
      
      if (studentError) throw studentError;
      
      // Fetch student's notes
      const { data: notes, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .eq('student_id', studentId)
        .eq('type', 'text')
        .order('created_at', { ascending: false });
      
      if (notesError) throw notesError;
      
      // Fetch student's subtasks
      const { data: subtasks, error: subtasksError } = await supabase
        .from('student_subtasks')
        .select('*, tasks:task_id(*, phases:phase_id(*))')
        .eq('student_id', studentId);
      
      if (subtasksError) throw subtasksError;
      
      const studentData = {
        student,
        notes,
        subtasks
      };
      
      // Update cache
      setStudentDataCache(prev => ({
        ...prev,
        [studentId]: studentData
      }));
      
      return studentData;
    } catch (error) {
      console.error('Error fetching student data:', error);
      return null;
    }
  };

  // Parse the input to extract mentioned students - case insensitive
  const extractMentionedStudents = async (text: string): Promise<MentionedStudent[]> => {
    // Extract all potential student names from the text
    const mentionRegex = /@(\w+)/g;
    const matches = [...text.matchAll(mentionRegex)];
    
    if (matches.length === 0) return [];
    
    // Get all mentioned names
    const mentions = matches.map(match => match[1]);
    
    // First, check if any are in our already mentionedStudents state
    const fromState = mentionedStudents.filter(student => 
      mentions.some(mention => student.name.toLowerCase().includes(mention.toLowerCase()))
    );
    
    // If we already have matches in state, return those
    if (fromState.length > 0) return fromState;
    
    // Otherwise, try to find matches in the database - case insensitive
    try {
      const results: MentionedStudent[] = [];
      
      for (const mention of mentions) {
        const { data, error } = await supabase
          .from('students')
          .select('id, name')
          .ilike('name', `%${mention}%`)
          .limit(1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          results.push({
            id: data[0].id,
            name: data[0].name
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error finding mentioned students:', error);
      return [];
    }
  };

  // Generate AI response using Gemini API
  const getAIResponse = async (query: string, studentMentions: MentionedStudent[]) => {
    try {
      let systemPrompt = `You are an AI assistant for a school counsellor portal. 
You provide helpful, clear, and concise responses to counsellors' questions about students, 
their progress, and academic tasks. Keep your answers factual and based on the available data.
Whenever a student is mentioned, try to provide relevant information about their current status, 
progress, and recent notes if available.`;
      
      // Prepare context from student data if students are mentioned
      let studentDataContext = '';
      const newContextData: Record<string, any> = {};
      
      if (studentMentions.length > 0) {
        systemPrompt += `\n\nThe following student(s) were mentioned in the query:`;
        
        for (const student of studentMentions) {
          const data = await fetchStudentData(student.id);
          if (data) {
            newContextData[student.id] = data;
            
            studentDataContext += `\n\nStudent Profile for ${data.student.name}:`;
            studentDataContext += `\nGrade: ${data.student.grade}`;
            studentDataContext += `\nCurriculum: ${data.student.curriculum}`;
            studentDataContext += `\nTarget Year: ${data.student.target_year}`;
            
            if (data.student.student_context) {
              studentDataContext += `\nContext: ${data.student.student_context}`;
            }
            
            if (data.notes && data.notes.length > 0) {
              studentDataContext += `\n\nRecent Notes:`;
              data.notes.slice(0, 3).forEach((note: Note) => {
                studentDataContext += `\n- ${note.title || 'Untitled'}: ${note.content}`;
              });
            }
            
            if (data.subtasks && data.subtasks.length > 0) {
              studentDataContext += `\n\nSubtasks and Progress:`;
              data.subtasks.forEach((subtask: Subtask) => {
                const task = subtask.tasks as any;
                const phase = task?.phases as any;
                studentDataContext += `\n- ${phase?.name || 'Unknown Phase'} > ${task?.name || 'Unknown Task'} > ${subtask.name}: ${subtask.status}`;
                if (subtask.remark) {
                  studentDataContext += ` (Remark: ${subtask.remark})`;
                }
              });
            }
          }
        }
      }
      
      // Prepare the messages for Gemini API
      // Add system prompt as the first message if it's a new conversation
      let updatedContext = { ...conversationContext };
      
      // Limit conversation history to latest 5 messages for token management
      const recentMessages = conversationContext.messages.slice(-5);
      
      // Add the current user query
      const currentMessages = [
        ...recentMessages,
        { 
          role: 'user', 
          parts: [{ text: systemPrompt + studentDataContext + "\n\nUser query: " + query }] 
        }
      ];
      
      updatedContext = {
        messages: currentMessages,
        studentData: newContextData
      };
      
      // Call Gemini API
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      
      const requestBody = {
        contents: currentMessages
      };
      
      console.log('Sending to Gemini API:', requestBody);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract the AI's response
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || null;
      
      // Update conversation context with AI response
      if (aiResponse) {
        updatedContext.messages.push({
          role: 'model',
          parts: [{ text: aiResponse }]
        });
        
        setConversationContext(updatedContext);
      }
      
      return aiResponse;
    } catch (error) {
      console.error('Error getting AI response:', error);
      return "I'm sorry, I encountered an error while processing your request. Please try again.";
    }
  };

  // Submit the query to AI
  const handleSubmit = async () => {
    if (!inputValue.trim()) return;
    
    // Get mentioned students - case insensitive now
    const mentionedStudentsInQuery = await extractMentionedStudents(inputValue);
    
    // Add user message to chat
    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
      studentId: mentionedStudentsInQuery.length > 0 ? mentionedStudentsInQuery[0].id : undefined,
      studentName: mentionedStudentsInQuery.length > 0 ? mentionedStudentsInQuery[0].name : undefined
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Get AI response with context management
      const response = await getAIResponse(inputValue, mentionedStudentsInQuery);
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response || "I'm sorry, I couldn't generate a response. Please try again.",
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error in AI response:', error);
      
      // Add error message
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, there was an error processing your request. Please try again.",
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle "Enter" key to submit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div 
            key={message.id} 
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg p-3 ${
                message.sender === 'user' 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="flex items-center mb-1">
                {message.sender === 'user' ? (
                  <User className="h-4 w-4 mr-2" />
                ) : (
                  <Bot className="h-4 w-4 mr-2" />
                )}
                <span className="text-xs opacity-70">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm">{message.text}</p>
              {message.studentName && (
                <div className="mt-1 text-xs bg-opacity-20 rounded px-1 py-0.5 inline-block">
                  @{message.studentName}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-100"></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-200"></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <div className="border-t border-gray-100 p-4">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your query here... Use @ to mention a student"
            className="w-full border border-gray-200 rounded-lg p-3 pr-12 min-h-[80px] max-h-[200px] resize-none focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
          
          <button
            onClick={handleSubmit}
            disabled={!inputValue.trim() || isLoading}
            className="absolute right-3 bottom-3 p-2 rounded-full bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
          
          {inputValue.includes('@') && (
            <div className="absolute left-3 bottom-3 flex items-center text-gray-400">
              <AtSign className="h-4 w-4 mr-1" />
              <span className="text-xs">Mention a student</span>
            </div>
          )}
        </div>
        
        {/* Student suggestions dropdown */}
        <AnimatePresence>
          {isMentioning && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute bottom-full mb-2 w-full max-w-md bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50"
            >
              <div className="p-2 border-b border-gray-100 flex items-center">
                <Search className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">
                  {mentionQuery ? `Searching for "${mentionQuery}"` : 'Mention a student'}
                </span>
              </div>
              
              {studentSuggestions.length > 0 ? (
                <ul className="max-h-[200px] overflow-y-auto">
                  {studentSuggestions.map(student => (
                    <li key={student.id}>
                      <button
                        onClick={() => handleStudentSelect(student)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-center"
                      >
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium">{student.displayText}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-3 text-sm text-gray-500 flex items-center">
                  <Smile className="h-4 w-4 mr-2 text-gray-400" />
                  {mentionQuery 
                    ? `No students found matching "${mentionQuery}"` 
                    : 'Type to search for students'}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}