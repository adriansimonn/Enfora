import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import TaskCard from "../components/TaskCard";
import EvidenceModal from "../components/EvidenceModal";
import RejectionDetailsModal from "../components/RejectionDetailsModal";
import DisputeModal from "../components/DisputeModal";
import { mockTasks } from "../data/mockTasks";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState(mockTasks);
  const [selectedTask, setSelectedTask] = useState(null);
  const [rejectionDetailsTask, setRejectionDetailsTask] = useState(null);
  const [disputeTask, setDisputeTask] = useState(null);

  const handleTaskAction = (task) => {
    if (task.status === "PENDING") {
      setSelectedTask(task);
    } else if (task.status === "REJECTED") {
      setRejectionDetailsTask(task);
    }
  };

  const handleSubmitEvidence = async (task, file) => {
    const formData = new FormData();
    formData.append("taskId", task.id);
    formData.append("userId", task.userId);
    formData.append("taskDescription", task.description);
    formData.append("evidence", file);

    const response = await fetch("/api/evidence/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const data = await response.json();

    // Update task with the status returned from backend
    const statusMap = {
      "completed": "COMPLETED",
      "review": "REVIEW",
      "failed": "REJECTED"
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

    setSelectedTask(null);
  };

  const handleDispute = () => {
    setRejectionDetailsTask(null);
    setDisputeTask(rejectionDetailsTask);
  };

  const handleSubmitDispute = async (task, reasoning) => {
    // TODO: Send dispute to backend for human review
    console.log("Dispute submitted for task:", task.id);
    console.log("Reasoning:", reasoning);

    // Update task status to indicate it's under dispute
    setTasks(prev =>
      prev.map(t =>
        t.id === task.id
          ? { ...t, status: "REVIEW", disputeReasoning: reasoning }
          : t
      )
    );

    alert("Your dispute has been submitted for human review.");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">
          Your Tasks
        </h1>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-gray-400 text-sm">{user.email}</span>
          )}
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onAction={handleTaskAction}
          />
        ))}
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
    </div>
  );
}