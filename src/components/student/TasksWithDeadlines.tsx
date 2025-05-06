/**
 * Tasks with Deadlines component
 * Displays a list of tasks with deadlines and owners
 */
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, User, AlertTriangle, Search, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, isPast, isToday } from 'date-fns';

interface TasksWithDeadlinesProps {
  studentId: string;
}

interface TaskWithDeadline {
  id: string;
  name: string;
  task_name: string;
  phase_name: string;
  eta: string | null;
  owner: string[] | null;
  status: string;
}

export default function TasksWithDeadlines({ studentId }: TasksWithDeadlinesProps) {
  const [tasks, setTasks] = useState<TaskWithDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTasks();
  }, [studentId]);

  const fetchTasks = async () => {
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
          tasks:task_id (
            name,
            phases:phase_id (
              name
            )
          )
        `)
        .eq('student_id', studentId)
        .order('eta', { ascending: true, nullsLast: true });

      if (error) throw error;

      // Transform the data to a more usable format
      const transformedData = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        task_name: item.tasks?.name || 'Unknown Task',
        phase_name: item.tasks?.phases?.name || 'Unknown Phase',
        eta: item.eta,
        owner: item.owner,
        status: item.status
      }));

      setTasks(transformedData);
    } catch (err) {
      console.error('Error fetching tasks with deadlines:', err);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter tasks by search term
  const filteredTasks = tasks.filter(task => 
    (task.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.task_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.phase_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.owner?.some(o => o.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  // Group tasks by deadline status: Overdue, Today, Upcoming, No Deadline
  const groupedTasks = {
    overdue: filteredTasks.filter(task => task.eta && isPast(new Date(task.eta)) && !isToday(new Date(task.eta)) && task.status !== 'done'),
    today: filteredTasks.filter(task => task.eta && isToday(new Date(task.eta)) && task.status !== 'done'),
    upcoming: filteredTasks.filter(task => task.eta && !isPast(new Date(task.eta)) && !isToday(new Date(task.eta)) && task.status !== 'done'),
    noDeadline: filteredTasks.filter(task => !task.eta && task.status !== 'done'),
    completed: filteredTasks.filter(task => task.status === 'done')
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No deadline';
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'blocked':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'not_applicable':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      default: // yet_to_start
        return 'bg-gray-100 text-gray-600 border border-gray-200';
    }
  };

  // Get status display text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'yet_to_start': return 'Yet to Start';
      case 'in_progress': return 'In Progress';
      case 'done': return 'Done';
      case 'blocked': return 'Blocked';
      case 'not_applicable': return 'Not Applicable';
      default: return status;
    }
  };

  // Render task group section
  const renderTaskGroup = (title: string, tasks: TaskWithDeadline[], icon: React.ReactNode, colorClass: string) => {
    if (tasks.length === 0) return null;

    return (
      <div className="mb-8">
        <h3 className={`text-sm font-medium ${colorClass} mb-4 flex items-center`}>
          {icon}
          <span className="ml-2">{title} ({tasks.length})</span>
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phase/Task</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tasks.map(task => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-800">{task.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {task.phase_name} &gt; {task.task_name}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {task.eta ? (
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {formatDate(task.eta)}
                      </span>
                    ) : (
                      <span className="text-gray-400">No deadline</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {task.owner && task.owner.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {task.owner.map((owner, idx) => (
                          <span key={idx} className="inline-flex items-center bg-gray-100 rounded-full px-2 py-1 text-xs">
                            <User className="h-3 w-3 mr-1 text-gray-400" />
                            {owner}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(task.status)}`}>
                      {getStatusText(task.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg md:text-xl font-light text-gray-800">Tasks with Deadlines</h2>
      </div>
      
      {error && (
        <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start">
          <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search tasks, phases, or owners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-gray-50"
          />
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-300"></div>
        </div>
      ) : (
        <div>
          {/* Render task groups */}
          {renderTaskGroup(
            "Overdue Tasks", 
            groupedTasks.overdue, 
            <AlertTriangle className="h-4 w-4 text-red-500" />, 
            "text-red-600"
          )}
          
          {renderTaskGroup(
            "Due Today", 
            groupedTasks.today, 
            <Calendar className="h-4 w-4 text-amber-500" />, 
            "text-amber-600"
          )}
          
          {renderTaskGroup(
            "Upcoming Tasks", 
            groupedTasks.upcoming, 
            <Calendar className="h-4 w-4 text-blue-500" />, 
            "text-blue-600"
          )}
          
          {renderTaskGroup(
            "Tasks without Deadline", 
            groupedTasks.noDeadline, 
            <Clock className="h-4 w-4 text-gray-500" />, 
            "text-gray-600"
          )}
          
          {renderTaskGroup(
            "Completed Tasks", 
            groupedTasks.completed, 
            <CheckCircle className="h-4 w-4 text-green-500" />, 
            "text-green-600"
          )}
          
          {/* No tasks message */}
          {filteredTasks.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-10 bg-gray-50 rounded-lg border border-gray-100"
            >
              <h3 className="text-gray-600 font-medium mb-1">No tasks found</h3>
              <p className="text-gray-500">
                {searchTerm ? 
                  "No tasks match your search. Try different keywords." : 
                  "There are no tasks with deadlines. Add ETA dates to tasks to see them here."}
              </p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}