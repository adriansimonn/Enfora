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
import ReliabilityScoreModal from "../components/ReliabilityScoreModal";
import Select from "../components/Select";
import { fetchTasks, createTask, updateTask, deleteTask, submitDispute } from "../services/api";
import { get2FAStatus } from "../services/twoFactor";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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

      setTasks(mappedTasks);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
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

        const response = await fetch(`${API_BASE}/evidence/upload`, {
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

      const response = await fetch(`${API_BASE}/evidence/upload`, {
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
      repeatsUntil: taskData.repeatsUntil,
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
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <Navigation />

      {show2FABanner && (
        <TwoFactorEncouragementBanner onDismiss={handleDismissBanner} />
      )}

      <div className="max-w-6xl mx-auto px-6 pt-16 pb-28">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <h1 className="text-4xl font-light text-white mb-3 tracking-[-0.02em] leading-[1.1]">
              Your Tasks
            </h1>
            <p className="text-[15px] text-gray-400 font-light leading-relaxed max-w-xl">Manage and track your task completion, tasks that are pending are yet to be completed.</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <label htmlFor="sortBy" className="sr-only">Sort by</label>
            <Select
              id="sortBy"
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: 'status', label: 'Sort by status' },
                { value: 'dueDate', label: 'Sort by due date' },
                { value: 'stakeAmount', label: 'Sort by stake' },
              ]}
              className="px-4 py-2.5 text-sm"
            />
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 bg-white text-black text-sm font-medium rounded-lg flex items-center gap-2 hover:bg-gray-100 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create Task
            </button>
          </div>
        </div>

        {loading && (
          <p className="py-6 text-[15px] text-gray-500 font-light">
            Loading your tasks...
          </p>
        )}

        {error && (
          <div className="flex items-center justify-between gap-6 border-l border-red-400/60 pl-4">
            <p className="text-[13px] text-red-400 font-light">{error}</p>
            <button
              onClick={loadTasks}
              className="px-4 py-2 bg-white/[0.03] text-white text-sm font-normal rounded-lg border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && tasks.length === 0 && (
          <div className="border-t border-white/[0.15] pt-6">
            <p className="text-[15px] text-gray-400 font-light">
              No tasks yet. Create your first task to get started!
            </p>
          </div>
        )}

        {!loading && !error && tasks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12">
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
        <div className="mt-28">
          <Analytics
            onShowReliabilityModal={(score) => {
              setReliabilityScore(score)
              setShowReliabilityModal(true)
            }}
          />
        </div>
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
        confirmButtonClass="bg-white text-black hover:bg-gray-100"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
        confirmButtonClass="bg-white text-black hover:bg-gray-100"
        isDestructive={true}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
