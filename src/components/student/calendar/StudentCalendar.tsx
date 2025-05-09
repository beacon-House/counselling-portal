/**
 * Student Calendar component
 * Displays a calendar view of student subtasks with Gantt-like visualization
 * Inspired by Apple Calendar design with phase color-coding and export options
 */
import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Views, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../../../styles/calendar.css'; // Custom calendar styles
import { format, parseISO, isValid, endOfDay, addMonths } from 'date-fns';
import { supabase } from '../../../lib/supabase';
import { Student, Phase, Task } from '../../../types/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader,
  Calendar as CalendarIcon,
  Filter,
  Download,
  Search,
  RefreshCw,
  AlertTriangle,
  X,
  ChevronDown,
  Check,
  FileText,
  Clock,
  Play,
  AlertCircle,
  User,
  MessageSquare
} from 'lucide-react';
import moment from 'moment';

// Create a moment localizer for the calendar
const localizer = momentLocalizer(moment);

// Event interface for calendar
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  phase: string;
  task: string;
  status: string;
  owner: string[] | null;
  phaseId: string;
  taskId: string;
  color: string;
  allDay: boolean;
  remark?: string | null;
  resource?: any;
}

// Props interface
interface StudentCalendarProps {
  studentId: string;
  student: Student;
}

export default function StudentCalendar({ studentId, student }: StudentCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeView, setActiveView] = useState(Views.MONTH);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [calendarHeight, setCalendarHeight] = useState<number>(700);
  // State for event tooltip
  const [hoveredEvent, setHoveredEvent] = useState<CalendarEvent | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  
  const exportRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  // Phase color mapping - visually pleasing colors for each phase
  const phaseColors: {[key: string]: string} = {
    'Interest Exploration': '#E9D8FD', // light purple
    'Academic Enrichment & Research': '#FEEBC8', // light orange
    'Innovation Capstone Project': '#C4F1F9', // light cyan
    'Extracurriculars': '#FEFCBF', // light yellow
    'Standardized Testing': '#B2F5EA', // light teal
    'Essays': '#FED7D7', // light red
    'Letters of Recommendation': '#D6BCFA', // light purple
    'College Research': '#FBD38D', // light orange
    'Application Prep': '#BEE3F8', // light blue
  };

  // Default color for phases not in the mapping
  const defaultColor = '#EDF2F7'; // light gray

  // Check if we're on a touch device
  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice('ontouchstart' in window || 
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0);
    };
    
    checkTouch();
    window.addEventListener('resize', checkTouch);
    
    return () => {
      window.removeEventListener('resize', checkTouch);
    };
  }, []);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExportOptions(false);
      }
      
      // Close tooltip when clicking outside
      if (hoveredEvent && tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setHoveredEvent(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [hoveredEvent]);

  // Adjust calendar height based on viewport
  useEffect(() => {
    const updateCalendarHeight = () => {
      if (calendarContainerRef.current) {
        // Set height based on viewport and container position
        const container = calendarContainerRef.current;
        const containerRect = container.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const topPosition = containerRect.top;
        
        // Leave some bottom padding
        const bottomPadding = 40;
        
        // Calculate available height
        const availableHeight = viewportHeight - topPosition - bottomPadding;
        
        // Set minimum height
        const calculatedHeight = Math.max(availableHeight, 500);
        
        setCalendarHeight(calculatedHeight);
      }
    };

    // Initial height calculation
    updateCalendarHeight();
    
    // Update on resize
    window.addEventListener('resize', updateCalendarHeight);
    
    // Cleanup
    return () => window.removeEventListener('resize', updateCalendarHeight);
  }, []);

  // Generate a color for a phase
  const getPhaseColor = (phaseName: string) => {
    return phaseColors[phaseName] || defaultColor;
  };

  useEffect(() => {
    // Fetch phases and tasks
    fetchPhases();
    
    // Fetch subtasks with ETAs
    fetchSubtasks();
  }, [studentId]);

  // Fetch all phases and tasks
  const fetchPhases = async () => {
    try {
      // Fetch phases
      const { data: phasesData, error: phasesError } = await supabase
        .from('phases')
        .select('*')
        .order('sequence');

      if (phasesError) throw phasesError;
      setPhases(phasesData as Phase[]);
    } catch (error) {
      console.error('Error fetching phases:', error);
      setError('Failed to load phases. Please try again.');
    }
  };
  
  // Fetch subtasks with ETAs
  const fetchSubtasks = async () => {
    setLoading(true);
    try {
      // Fetch subtasks with task and phase information
      const { data, error } = await supabase
        .from('student_subtasks')
        .select(`
          id,
          name,
          eta,
          owner,
          status,
          remark,
          task_id,
          tasks:task_id (
            id,
            name,
            phase_id,
            phases:phase_id (
              id,
              name
            )
          )
        `)
        .eq('student_id', studentId);

      if (error) throw error;

      // Filter subtasks to only those with ETAs
      const subtasksWithEta = data.filter(subtask => subtask.eta);
      
      // Convert subtasks to calendar events
      const calendarEvents = subtasksWithEta.map(subtask => {
        const phaseName = subtask.tasks?.phases?.name || 'Unknown Phase';
        const phaseId = subtask.tasks?.phases?.id || '';
        const taskName = subtask.tasks?.name || 'Unknown Task';
        const taskId = subtask.tasks?.id || '';
        
        const startDate = subtask.eta ? parseISO(subtask.eta) : new Date();
        // If not valid date, use today
        const validStartDate = isValid(startDate) ? startDate : new Date();
        
        // End date is end of the same day
        const endDate = endOfDay(validStartDate);
        
        return {
          id: subtask.id,
          title: subtask.name,
          start: validStartDate,
          end: endDate,
          phase: phaseName,
          task: taskName,
          status: subtask.status || 'yet_to_start',
          owner: subtask.owner,
          phaseId: phaseId,
          taskId: taskId,
          color: getPhaseColor(phaseName),
          allDay: true, // All events are all-day events
          remark: subtask.remark,
          resource: {
            remark: subtask.remark,
            status: subtask.status
          }
        };
      });
      
      setEvents(calendarEvents);
    } catch (err) {
      console.error('Error fetching subtasks:', err);
      setError('Failed to load calendar data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filter events based on search term
  const filteredEvents = events.filter(event => {
    return event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.phase.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.task.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Handle refresh button
  const handleRefresh = () => {
    setRefreshing(true);
    fetchSubtasks();
  };

  // Export calendar as PDF
  const handleExport = (format: 'pdf' | 'csv') => {
    setShowExportOptions(false);
    
    if (format === 'pdf') {
      alert('Exporting as PDF. This functionality will be implemented fully in the next iteration.');
      // Implementation for PDF export would go here
    } else {
      alert('Exporting as CSV. This functionality will be implemented fully in the next iteration.');
      // Implementation for CSV export would go here
    }
  };

  // Get status icon based on status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Play className="h-4 w-4 text-blue-600" />;
      case 'blocked':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'not_applicable':
        return <X className="h-4 w-4 text-gray-600" />;
      default: // yet_to_start
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'yet_to_start':
        return 'Yet to Start';
      case 'in_progress':
        return 'In Progress';
      case 'done':
        return 'Done';
      case 'blocked':
        return 'Blocked';
      case 'not_applicable':
        return 'Not Applicable';
      default:
        return status;
    }
  };

  // Custom event component to style the events
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    // Status indicator styling
    const getStatusIndicator = () => {
      switch (event.status) {
        case 'done':
          return 'bg-green-500';
        case 'in_progress':
          return 'bg-blue-500';
        case 'blocked':
          return 'bg-red-500';
        case 'not_applicable':
          return 'bg-gray-500';
        default: // yet_to_start
          return 'bg-yellow-500';
      }
    };

    // Handle event hover or tap to show tooltip
    const handleEventInteraction = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      e.stopPropagation();

      // Set the selected event for touch devices
      if (isTouchDevice) {
        if (selectedEvent?.id === event.id) {
          setSelectedEvent(null); // Toggle off if tapping the same event
        } else {
          setSelectedEvent(event);
        }
        return;
      }
      
      const rect = e.currentTarget.getBoundingClientRect();
      
      // Calculate position based on screen size and available space
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      let tooltipWidth = 300; // default tooltip width
      let tooltipHeight = 200; // approximate tooltip height
      
      // For mobile devices, adjust tooltip dimensions
      if (screenWidth < 768) {
        tooltipWidth = Math.min(300, screenWidth - 40);
      }
      
      let left, top;
      
      // First try to position the tooltip to the right of the event
      left = rect.right + 10;
      top = rect.top;
      
      // If tooltip would go off the right edge, position to the left
      if (left + tooltipWidth > screenWidth - 10) {
        left = Math.max(10, rect.left - tooltipWidth - 10);
      }
      
      // If still would go off screen (for very narrow screens), position below the event
      if (left < 10 || left + tooltipWidth > screenWidth - 10) {
        left = Math.max(10, rect.left);
        top = rect.bottom + 10;
      }
      
      // If tooltip would go off the bottom, position it above the event
      if (top + tooltipHeight > screenHeight - 10) {
        top = Math.max(10, rect.top - tooltipHeight - 10);
      }
      
      // If no good position found (rare case), center on screen
      if (top < 10 || left < 10) {
        top = screenHeight / 2 - tooltipHeight / 2;
        left = screenWidth / 2 - tooltipWidth / 2;
      }
      
      setTooltipPosition({ top, left });
      setHoveredEvent(event);
    };

    return (
      <motion.div
        whileHover={{ y: -1, boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }}
        className={`calendar-event ${activeView.toLowerCase()}-view-event overflow-hidden rounded-md shadow-sm`}
        style={{ 
          backgroundColor: event.color,
          borderLeft: `3px solid ${event.color.replace(')', ', 0.8)')}`
        }}
        onMouseEnter={handleEventInteraction}
        onTouchStart={handleEventInteraction}
      >
        <div className="flex items-center truncate">
          <div className={`h-2 w-2 rounded-full ${getStatusIndicator()} mr-1.5 flex-shrink-0`} />
          <span className="truncate font-medium event-title">{event.title}</span>
        </div>
        {activeView !== Views.AGENDA && (
          <div className="text-xs opacity-80 truncate mt-0.5 event-details">
            {event.phase} &gt; {event.task}
          </div>
        )}
        {event.owner && event.owner.length > 0 && activeView !== Views.MONTH && (
          <div className="text-xs opacity-80 truncate mt-0.5 event-owner">
            Owner: {event.owner.join(', ')}
          </div>
        )}
      </motion.div>
    );
  };

  // Tooltip component to show detailed event information
  const EventTooltip = () => {
    // Use hoveredEvent for mouse devices, selectedEvent for touch devices
    const event = isTouchDevice ? selectedEvent : hoveredEvent;
    
    if (!event) return null;
    
    // Generate status badge color
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'done':
          return 'bg-green-100 text-green-700 border-green-200';
        case 'in_progress':
          return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'blocked':
          return 'bg-red-100 text-red-700 border-red-200';
        case 'not_applicable':
          return 'bg-gray-100 text-gray-500 border-gray-200';
        default: // yet_to_start
          return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      }
    };
    
    // Close tooltip for touch devices
    const handleCloseTooltip = () => {
      setSelectedEvent(null);
    };
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-100 p-4 event-tooltip"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          maxWidth: isTouchDevice ? (window.innerWidth < 768 ? '85vw' : '350px') : '300px',
        }}
        ref={tooltipRef}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button for touch devices */}
        {isTouchDevice && (
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCloseTooltip}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </motion.button>
        )}
        
        <div className="flex items-start mb-3">
          <div 
            className="w-2.5 h-2.5 rounded-full mt-1.5 mr-2.5 flex-shrink-0"
            style={{ backgroundColor: event.color }}
          />
          <h3 className="font-medium text-gray-900 line-clamp-2">{event.title}</h3>
        </div>
        
        <div className="mb-3 pb-3 border-b border-gray-100">
          <div className="flex items-center mb-2">
            <CalendarIcon className="h-3.5 w-3.5 text-gray-400 mr-2" />
            <span className="text-sm text-gray-700">
              {format(event.start, 'MMMM d, yyyy')}
            </span>
          </div>
          
          <div className="flex items-center mb-2">
            <span className="text-sm text-gray-700 flex items-center">
              <motion.span 
                whileHover={{ y: -1 }}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${getStatusColor(event.status)}`}
              >
                <span className="mr-1">{getStatusIcon(event.status)}</span>
                {getStatusText(event.status)}
              </motion.span>
            </span>
          </div>
          
          {event.owner && event.owner.length > 0 && (
            <div className="flex items-start mb-2">
              <User className="h-3.5 w-3.5 text-gray-400 mr-2 mt-0.5" />
              <span className="text-sm text-gray-700">
                {event.owner.join(', ')}
              </span>
            </div>
          )}
        </div>
        
        <div className="mb-3">
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-1.5">Location</h4>
          <div className="text-sm text-gray-800 mb-1 break-words">
            {event.phase} &gt; {event.task}
          </div>
        </div>
        
        {event.remark && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase flex items-center mb-1.5">
              <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
              Notes
            </h4>
            <p className="text-sm text-gray-700 italic break-words">{event.remark}</p>
          </div>
        )}
      </motion.div>
    );
  };

  // On calendar event click for touch devices
  const handleEventClick = (event: CalendarEvent) => {
    if (isTouchDevice) {
      // Determine the position for the tooltip
      const eventElements = document.querySelectorAll('.calendar-event');
      let targetElement = null;
      
      // Find the element that corresponds to this event
      for (const elem of eventElements) {
        if ((elem as HTMLElement).innerText.includes(event.title)) {
          targetElement = elem;
          break;
        }
      }
      
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        
        // Position below the event on mobile
        if (window.innerWidth < 768) {
          setTooltipPosition({
            top: rect.bottom + window.scrollY + 10,
            left: window.innerWidth / 2 - 150 // Center on screen
          });
        } else {
          // Desktop positioning
          setTooltipPosition({
            top: rect.top + window.scrollY,
            left: rect.right + window.scrollX + 10
          });
        }
        
        setSelectedEvent(event);
      }
    }
  };

  // Search input animation
  const searchVariants = {
    focus: {
      boxShadow: "0 0 0 3px rgba(66, 153, 225, 0.15)",
      scale: 1.01,
      y: -1
    }
  };
  
  // Button animation
  const buttonVariants = {
    hover: { scale: 1.05, y: -1 },
    tap: { scale: 0.95, y: 0 }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <motion.h2 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-lg md:text-xl font-light text-gray-800"
        >
          Calendar for {student.name}
        </motion.h2>
        <motion.button
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
          title="Refresh calendar"
        >
          <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>
      
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center justify-between"
        >
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
            {error}
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
      
      {/* Search and Export */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <motion.div className="relative flex-1">
          <motion.input
            whileFocus="focus"
            variants={searchVariants}
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white shadow-sm"
          />
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
        </motion.div>
        
        <div className="flex gap-2">
          {/* Export Dropdown */}
          <div className="relative" ref={exportRef}>
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="px-4 py-3 rounded-lg bg-gray-800 text-white flex items-center hover:bg-gray-700 transition-colors whitespace-nowrap shadow-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
              <motion.div
                animate={{ rotate: showExportOptions ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="ml-2 h-4 w-4" />
              </motion.div>
            </motion.button>
            
            <AnimatePresence>
              {showExportOptions && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg z-10 border border-gray-200 overflow-hidden"
                >
                  <motion.div className="py-1">
                    <motion.button
                      whileHover={{ backgroundColor: "#f3f4f6" }}
                      onClick={() => handleExport('pdf')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <FileText className="h-4 w-4 mr-2 text-gray-500" />
                      Export as PDF
                    </motion.button>
                    <motion.button
                      whileHover={{ backgroundColor: "#f3f4f6" }}
                      onClick={() => handleExport('csv')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <FileText className="h-4 w-4 mr-2 text-gray-500" />
                      Export as CSV
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Calendar View */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden calendar-container" 
        ref={calendarContainerRef}
        style={{ height: `${calendarHeight}px` }}
        onClick={() => {
          setHoveredEvent(null);
          setSelectedEvent(null);
        }}
      >
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader className="animate-spin h-8 w-8 text-gray-300" />
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="h-full flex flex-col" ref={calendarRef}>
            <Calendar
              localizer={localizer}
              events={filteredEvents}
              startAccessor="start"
              endAccessor="end"
              defaultView={Views.MONTH}
              views={['month', 'week', 'day', 'agenda']}
              style={{ height: '100%' }}
              components={{
                event: EventComponent,
              }}
              onView={(view: string) => setActiveView(view as any)}
              eventPropGetter={(event: any) => ({
                className: `event-${event.status}`,
              })}
              // Show more count
              showAllEvents={false}
              popup
              popupOffset={30}
              onSelectEvent={handleEventClick}
              tooltipAccessor={null} // Disable default tooltips
            />
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 flex items-center justify-center h-full"
          >
            <div>
              <motion.div 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex justify-center mb-4"
              >
                <CalendarIcon className="h-12 w-12 text-gray-300" />
              </motion.div>
              <motion.h3 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600 font-medium mb-2"
              >
                No Tasks with Due Dates
              </motion.h3>
              <motion.p 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-500 max-w-md mx-auto"
              >
                {searchTerm
                  ? "No tasks match your search criteria."
                  : "No tasks with due dates found. Add due dates to tasks to see them in the calendar."}
              </motion.p>
            </div>
          </motion.div>
        )}
      </motion.div>
      
      {/* Legend */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="mt-6"
      >
        <h3 className="text-sm font-medium text-gray-700 mb-3">Legend</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {phases.map(phase => (
            <div key={phase.id} className="flex items-center">
              <div
                className="w-4 h-4 rounded-sm mr-2 flex-shrink-0 shadow-sm"
                style={{ backgroundColor: getPhaseColor(phase.name) }}
              ></div>
              <span className="text-xs text-gray-600 truncate">{phase.name}</span>
            </div>
          ))}
        </div>
        
        <div className="w-full mt-3 border-t border-gray-100 pt-3"></div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <motion.div whileHover={{ y: -1 }} className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-yellow-500 mr-2 flex-shrink-0"></div>
            <span className="text-xs text-gray-600">Yet to Start</span>
          </motion.div>
          <motion.div whileHover={{ y: -1 }} className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-blue-500 mr-2 flex-shrink-0"></div>
            <span className="text-xs text-gray-600">In Progress</span>
          </motion.div>
          <motion.div whileHover={{ y: -1 }} className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-green-500 mr-2 flex-shrink-0"></div>
            <span className="text-xs text-gray-600">Done</span>
          </motion.div>
          <motion.div whileHover={{ y: -1 }} className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-red-500 mr-2 flex-shrink-0"></div>
            <span className="text-xs text-gray-600">Blocked</span>
          </motion.div>
          <motion.div whileHover={{ y: -1 }} className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-gray-500 mr-2 flex-shrink-0"></div>
            <span className="text-xs text-gray-600">Not Applicable</span>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Event Tooltip */}
      <AnimatePresence>
        {(hoveredEvent || selectedEvent) && <EventTooltip />}
      </AnimatePresence>
    </div>
  );
}