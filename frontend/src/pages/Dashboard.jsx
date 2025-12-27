import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Navigation from "../components/Navigation";
import Analytics from "../components/Analytics";
import TaskCard from "../components/TaskCard";
import EvidenceModal from "../components/EvidenceModal";
import RejectionDetailsModal from "../components/RejectionDetailsModal";
import DisputeModal from "../components/DisputeModal";
import CreateTaskModal from "../components/CreateTaskModal";
import EditTaskModal from "../components/EditTaskModal";
import LoadingModal from "../components/LoadingModal";
import TaskDetailsModal from "../components/TaskDetailsModal";
import ConfirmationModal from "../components/ConfirmationModal";
import { fetchTasks, createTask, updateTask, deleteTask, submitDispute } from "../services/api";

export default function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [rejectionDetailsTask, setRejectionDetailsTask] = useState(null);
  const [disputeTask, setDisputeTask] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [detailsTask, setDetailsTask] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [sortBy, setSortBy] = useState("status"); // dueDate, stakeAmount, status

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTasks();

      // Map backend status to frontend status format
      const mappedTasks = data.map(task => ({
        ...task,
        id: task.taskId, // Map taskId to id for frontend compatibility
        status: task.status.toUpperCase() // Convert to uppercase for consistency
      }));

      // Filter to show only the next recurring instance for each series
      const filteredTasks = filterRecurringTasks(mappedTasks);

      setTasks(filteredTasks);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Filter recurring task instances to show parent task, all completed/failed instances, and next incomplete instance
  const filterRecurringTasks = (tasks) => {
    // Separate parent recurring tasks from instances and non-recurring tasks
    const parentRecurringTasks = [];
    const recurringInstances = new Map(); // Map of parentTaskId -> instances
    const nonRecurringTasks = [];

    tasks.forEach(task => {
      // If task has a parentTaskId, it's a recurring instance
      if (task.parentTaskId) {
        if (!recurringInstances.has(task.parentTaskId)) {
          recurringInstances.set(task.parentTaskId, []);
        }
        recurringInstances.get(task.parentTaskId).push(task);
      }
      // If task isRecurring, it's the parent recurring task
      else if (task.isRecurring) {
        parentRecurringTasks.push(task);
      }
      // Otherwise it's a regular non-recurring task
      else {
        nonRecurringTasks.push(task);
      }
    });

    // For each recurring group, show:
    // 1. All completed/failed instances
    // 2. Only the next incomplete instance (earliest deadline)
    const instancesToShow = [];
    recurringInstances.forEach((instances, parentId) => {
      // Separate completed/failed from incomplete
      const completedOrFailedInstances = instances.filter(
        t => t.status === 'COMPLETED' || t.status === 'FAILED'
      );
      const incompleteInstances = instances.filter(
        t => t.status !== 'COMPLETED' && t.status !== 'FAILED'
      );

      // Add all completed/failed instances
      instancesToShow.push(...completedOrFailedInstances);

      // Add only the next incomplete instance
      if (incompleteInstances.length > 0) {
        incompleteInstances.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        instancesToShow.push(incompleteInstances[0]);
      }
    });

    return [...nonRecurringTasks, ...parentRecurringTasks, ...instancesToShow];
  };

  const handleTaskAction = (task, isRetry = false) => {
    if (task.status === "PENDING" || isRetry) {
      setSelectedTask(task);
    } else if (task.status === "REJECTED") {
      setRejectionDetailsTask(task);
    } else if (task.status === "COMPLETED" || task.status === "REVIEW") {
      setDetailsTask(task);
    }
  };

  const handleSubmitEvidence = async (task, file) => {
    // Close evidence modal and show loading modal
    setSelectedTask(null);
    setUploadStatus({ message: 'Uploading Evidence', stage: 'Preparing upload...' });

    try {
      const formData = new FormData();
      formData.append("taskId", task.taskId || task.id);
      formData.append("userId", task.userId);
      formData.append("taskTitle", task.title);
      formData.append("taskDescription", task.description);
      formData.append("evidence", file);

      setUploadStatus({ message: 'Uploading Evidence', stage: 'Sending to server...' });

      const response = await fetch("http://localhost:3000/api/evidence/upload", {
        method: "POST",
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      setUploadStatus({ message: 'Processing Evidence', stage: 'Validating your submission...' });

      const data = await response.json();

      // Update task with the status returned from backend
      const statusMap = {
        "completed": "COMPLETED",
        "review": "REVIEW",
        "rejected": "REJECTED"
      };

      setTasks(prev =>
        prev.map(t =>
          t.id === task.id
            ? {
                ...t,
                status: statusMap[data.status] || "REVIEW",
                validationResult: data.validation
              }
            : t
        )
      );

      // Close loading modal after a brief delay
      setTimeout(() => {
        setUploadStatus(null);
      }, 500);
    } catch (err) {
      setUploadStatus(null);
      throw err;
    }
  };

  const handleEditTask = async (updatedTask) => {
    try {
      const taskId = updatedTask.taskId || updatedTask.id;
      await updateTask(taskId, updatedTask);

      // Update local state
      setTasks(prev =>
        prev.map(t =>
          t.id === updatedTask.id || t.taskId === updatedTask.taskId
            ? { ...t, ...updatedTask }
            : t
        )
      );
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  };

  const handleDeleteTask = async (task) => {
    try {
      const taskId = task.taskId || task.id;
      await deleteTask(taskId);

      // Remove from local state
      setTasks(prev => prev.filter(t => t.id !== task.id && t.taskId !== task.taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  };

  const handleDispute = () => {
    setRejectionDetailsTask(null);
    setDisputeTask(rejectionDetailsTask);
  };

  const handleSubmitDispute = async (task, reasoning) => {
    try {
      const taskId = task.taskId || task.id;
      const updatedTask = await submitDispute(taskId, reasoning);

      // Update local state with the response from backend
      setTasks(prev =>
        prev.map(t =>
          t.id === task.id || t.taskId === task.taskId
            ? {
                ...t,
                ...updatedTask,
                id: updatedTask.taskId,
                status: updatedTask.status.toUpperCase()
              }
            : t
        )
      );

      setModalMessage("Your dispute has been submitted for human review.");
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Failed to submit dispute:", error);
      setModalMessage("Failed to submit dispute. Please try again.");
      setShowErrorModal(true);
      throw error;
    }
  };

  const handleCreateTask = async (taskData) => {
    const response = await createTask({
      title: taskData.title,
      description: taskData.description,
      deadline: taskData.deadline,
      stakeAmount: taskData.stakeAmount,
      stakeDestination: taskData.stakeDestination,
      userId: user.userId,
      recurrenceRule: taskData.recurrenceRule,
      isRecurring: taskData.isRecurring
    });

    // Add the new task to the list
    const newTask = {
      ...response,
      id: response.taskId,
      status: response.status.toUpperCase()
    };

    setTasks(prev => [newTask, ...prev]);
  };

  // Sort tasks based on selected criteria
  const getSortedTasks = () => {
    const tasksCopy = [...tasks];

    switch (sortBy) {
      case "dueDate":
        return tasksCopy.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

      case "stakeAmount":
        return tasksCopy.sort((a, b) => b.stakeAmount - a.stakeAmount);

      case "status":
        const statusOrder = { "PENDING": 0, "REJECTED": 1, "REVIEW": 2, "COMPLETED": 3, "FAILED": 4 };
        return tasksCopy.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

      default:
        return tasksCopy;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900">
      <Navigation />

      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Your Tasks
              </h1>
              <p className="text-gray-400">Manage and track your task completion, tasks that are pending are yet to be completed.</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-white text-black font-normal rounded-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Task
            </button>
          </div>
          <div className="flex justify-end">
            <div className="flex items-center gap-2">
              <label htmlFor="sortBy" className="text-sm text-gray-400">Sort by:</label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-zinc-800 text-white border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                <option value="status">Status</option>
                <option value="dueDate">Due Date</option>
                <option value="stakeAmount">Stake Amount</option>
              </select>
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12 text-gray-400">
            Loading your tasks...
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">{error}</div>
            <button
              onClick={loadTasks}
              className="px-4 py-2 bg-white text-black rounded-md"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && tasks.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No tasks yet. Create your first task to get started!
          </div>
        )}

        {!loading && !error && tasks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {getSortedTasks().map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onAction={handleTaskAction}
                onEdit={setEditingTask}
              />
            ))}
          </div>
        )}

        {/* Analytics Section */}
        <Analytics />
      </div>

      {selectedTask && (
        <EvidenceModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSubmit={handleSubmitEvidence}
        />
      )}

      {rejectionDetailsTask && (
        <RejectionDetailsModal
          task={rejectionDetailsTask}
          onClose={() => setRejectionDetailsTask(null)}
          onDispute={handleDispute}
        />
      )}

      {disputeTask && (
        <DisputeModal
          task={disputeTask}
          onClose={() => setDisputeTask(null)}
          onSubmit={handleSubmitDispute}
        />
      )}

      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateTask}
        />
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleEditTask}
          onDelete={handleDeleteTask}
        />
      )}

      {detailsTask && (
        <TaskDetailsModal
          task={detailsTask}
          onClose={() => setDetailsTask(null)}
          onDelete={handleDeleteTask}
        />
      )}

      {uploadStatus && (
        <LoadingModal
          message={uploadStatus.message}
          stage={uploadStatus.stage}
        />
      )}

      {/* Success Modal */}
      <ConfirmationModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        onConfirm={() => setShowSuccessModal(false)}
        title="Success"
        message={modalMessage}
        confirmText="OK"
        cancelText="Close"
        confirmButtonClass="bg-green-600 hover:bg-green-700"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />

      {/* Error Modal */}
      <ConfirmationModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        onConfirm={() => setShowErrorModal(false)}
        title="Error"
        message={modalMessage}
        confirmText="OK"
        cancelText="Close"
        confirmButtonClass="bg-blue-600 hover:bg-blue-700"
        isDestructive={true}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
    </div>
  );
}