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
import TwoFactorEncouragementBanner from "../components/TwoFactorEncouragementBanner";
import { fetchTasks, createTask, updateTask, deleteTask, submitDispute } from "../services/api";
import { get2FAStatus } from "../services/twoFactor";

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
  const [showReliabilityModal, setShowReliabilityModal] = useState(false);
  const [reliabilityScore, setReliabilityScore] = useState(0);
  const [show2FABanner, setShow2FABanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    document.title = 'Enfora | Dashboard';
    loadTasks();
  }, []);

  useEffect(() => {
    // Check 2FA status after user is loaded
    if (user) {
      check2FAStatus();
    }
  }, [user]);

  const check2FAStatus = async () => {
    try {
      const status = await get2FAStatus();
      // Show banner if 2FA is not enabled and not dismissed in this session
      if (!status.twoFactorEnabled && !bannerDismissed) {
        setShow2FABanner(true);
      }
    } catch (err) {
      // Silently fail - banner is not critical
      console.error('Failed to check 2FA status:', err);
    }
  };

  const handleDismissBanner = () => {
    setShow2FABanner(false);
    setBannerDismissed(true);
  };

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
    } else if (task.status === "COMPLETED" || task.status === "REVIEW" || task.status === "FAILED") {
      setDetailsTask(task);
    }
  };

  const handleSubmitEvidence = async (task, file, isExpired = false) => {
    // If task is expired, update it to failed state
    if (isExpired) {
      // Close evidence modal first
      setSelectedTask(null);

      try {
        const formData = new FormData();
        formData.append("taskId", task.taskId || task.id);
        formData.append("userId", task.userId);
        formData.append("taskTitle", task.title);
        formData.append("taskDescription", task.description);
        formData.append("isExpiredCheck", "true");

        const response = await fetch("http://localhost:3000/api/evidence/upload", {
          method: "POST",
          body: formData,
          credentials: 'include'
        });

        await response.json();

        // Update task to failed status
        setTasks(prev =>
          prev.map(t =>
            t.id === task.id
              ? {
                  ...t,
                  status: "FAILED",
                }
              : t
          )
        );
      } catch (err) {
        console.error("Failed to update expired task:", err);
      }
      return;
    }

    try {
      const formData = new FormData();
      formData.append("taskId", task.taskId || task.id);
      formData.append("userId", task.userId);
      formData.append("taskTitle", task.title);
      formData.append("taskDescription", task.description);
      formData.append("evidence", file);

      const response = await fetch("http://localhost:3000/api/evidence/upload", {
        method: "POST",
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();

      // Check if backend detected task expiration
      if (data.isExpired) {
        setSelectedTask(null);
        setTasks(prev =>
          prev.map(t =>
            t.id === task.id
              ? {
                  ...t,
                  status: "FAILED",
                }
              : t
          )
        );
        setModalMessage("Task deadline has passed. Evidence cannot be submitted.");
        setShowErrorModal(true);
        return;
      }

      // Check if backend rejected due to metadata validation (outdated evidence)
      if (!response.ok) {
        // Throw error with the backend message so EvidenceModal can catch it
        throw new Error(data.error || "Upload failed");
      }

      // Close evidence modal and show loading modal only after validation passes
      setSelectedTask(null);
      setUploadStatus({ message: 'Uploading Evidence', stage: 'Processing your submission...' });

      setUploadStatus({ message: 'Processing Evidence', stage: 'Validating your submission...' });

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
    <div className="min-h-screen bg-black">
      <Navigation />

      {show2FABanner && (
        <TwoFactorEncouragementBanner onDismiss={handleDismissBanner} />
      )}

      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-light text-white mb-2 tracking-[-0.01em]">
                Your Tasks
              </h1>
              <p className="text-gray-400 font-light text-[15px]">Manage and track your task completion, tasks that are pending are yet to be completed.</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2.5 bg-white text-black font-medium rounded-lg flex items-center gap-2 hover:bg-gray-100 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create Task
            </button>
          </div>
          <div className="flex justify-end">
            <div className="flex items-center gap-2">
              <label htmlFor="sortBy" className="text-sm text-gray-400 font-light">Sort by:</label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-white/[0.03] text-white border border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/[0.12] font-light transition-all duration-200"
              >
                <option value="status">Status</option>
                <option value="dueDate">Due Date</option>
                <option value="stakeAmount">Stake Amount</option>
              </select>
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12 text-gray-400 font-light">
            Loading your tasks...
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <div className="text-red-400 mb-4 font-light">{error}</div>
            <button
              onClick={loadTasks}
              className="px-6 py-2.5 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-all duration-200"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && tasks.length === 0 && (
          <div className="text-center py-12 text-gray-400 font-light">
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
        <Analytics
          onShowReliabilityModal={(score) => {
            setReliabilityScore(score)
            setShowReliabilityModal(true)
          }}
        />
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

      {/* Reliability Score Modal - Rendered at root level for proper centering */}
      {showReliabilityModal && (
        <ReliabilityScoreModal
          score={reliabilityScore}
          onClose={() => setShowReliabilityModal(false)}
        />
      )}
    </div>
  );
}

// ReliabilityScoreModal Component
function ReliabilityScoreModal({ score, onClose }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const getTierInfo = (score) => {
    if (score >= 3500) return { name: "Platinum", range: "3500+", color: "from-purple-400 via-pink-400 to-purple-400" };
    if (score >= 2000) return { name: "Elite", range: "2000-3499", color: "from-blue-400 to-blue-500" };
    if (score >= 1000) return { name: "Reliable", range: "1000-1999", color: "from-green-400 to-green-500" };
    if (score >= 300) return { name: "Building Discipline", range: "300-999", color: "from-yellow-400 to-yellow-500" };
    return { name: "Inconsistent or Beginner", range: "<300", color: "from-red-400 to-red-500" };
  };

  const getReliabilityScoreColor = (score) => {
    // Color definitions (RGB values)
    const colors = {
      red: { r: 248, g: 113, b: 113 },
      orange: { r: 251, g: 146, b: 60 },
      yellow: { r: 250, g: 204, b: 21 },
      green: { r: 74, g: 222, b: 128 },
      blue: { r: 96, g: 165, b: 250 },
    };

    const interpolateColor = (value, min, mid, max, colorMin, colorMid, colorMax) => {
      const clampedValue = Math.max(min, Math.min(max, value));
      let t, color1, color2;

      if (clampedValue <= mid) {
        t = (clampedValue - min) / (mid - min);
        color1 = colorMin;
        color2 = colorMid;
      } else {
        t = (clampedValue - mid) / (max - mid);
        color1 = colorMid;
        color2 = colorMax;
      }

      const r = Math.round(color1.r + (color2.r - color1.r) * t);
      const g = Math.round(color1.g + (color2.g - color1.g) * t);
      const b = Math.round(color1.b + (color2.b - color1.b) * t);

      return `rgb(${r}, ${g}, ${b})`;
    };

    if (score >= 3500) return null;
    if (score >= 2000) return 'rgb(96, 165, 250)';

    if (score < 1000) {
      if (score <= 300) {
        return interpolateColor(score, 0, 150, 300, colors.red, colors.red, colors.orange);
      } else if (score <= 600) {
        return interpolateColor(score, 300, 450, 600, colors.orange, colors.orange, colors.yellow);
      } else {
        return interpolateColor(score, 600, 800, 1000, colors.yellow, colors.yellow, colors.green);
      }
    }

    return interpolateColor(score, 1000, 1500, 2000, colors.green, colors.green, colors.blue);
  };

  const currentTier = getTierInfo(score);

  const tiers = [
    { name: "Inconsistent or Beginner", range: "<300", color: "from-red-400 to-red-500", isCurrent: score < 300 },
    { name: "Building Discipline", range: "300-999", color: "from-yellow-400 to-yellow-500", isCurrent: score >= 300 && score < 1000 },
    { name: "Reliable", range: "1000-1999", color: "from-green-400 to-green-500", isCurrent: score >= 1000 && score < 2000 },
    { name: "Elite", range: "2000-3499", color: "from-blue-400 to-blue-500", isCurrent: score >= 2000 && score < 3500 },
    { name: "Platinum", range: "3500+", color: "from-purple-400 via-white-400 to-blue-400", isCurrent: score >= 3500 },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/[0.06] rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06] flex-shrink-0">
          <h2 className="text-xl font-light text-white tracking-[-0.01em]">Reliability Score</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-all duration-200 p-1 hover:bg-white/[0.06] rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Description */}
          <div>
            <p className="text-sm text-gray-300 mb-3 font-light">
              The Reliability Score is Enfora's flagship metric that measures your consistency and discipline
              in creating and completing tasks.
            </p>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-400 font-light">Current score:</span>
              <span
                className={`text-2xl font-light ${score >= 3500 ? 'bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent' : ''}`}
                style={score >= 3500 ? {} : { color: getReliabilityScoreColor(score) }}
              >
                {score}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${currentTier.color} text-white`}>
                {currentTier.name}
              </span>
            </div>
          </div>

          {/* Tiers */}
          <div>
            <h3 className="text-base font-normal text-white mb-3">Score Tiers</h3>
            <div className="space-y-2.5">
              {tiers.map((tier, index) => (
                <div
                  key={index}
                  className={`border rounded-xl p-4 transition-all ${
                    tier.isCurrent
                      ? 'border-white/[0.12] bg-white/[0.04]'
                      : 'border-white/[0.06] bg-white/[0.015]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        tier.name === "Platinum"
                          ? 'platinum-badge-gradient border-2 border-transparent'
                          : `bg-gradient-to-r ${tier.color}`
                      }`}>
                        {tier.isCurrent && (
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`text-sm ${
                            tier.name === "Platinum"
                              ? 'platinum-text-gradient font-black'
                              : 'text-white font-normal'
                          }`}>{tier.name}</h4>
                          {tier.isCurrent && (
                            <span className="text-xs text-green-400 font-normal">Current</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 font-light">{tier.range} points</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}