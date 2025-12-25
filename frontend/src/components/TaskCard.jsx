export default function TaskCard({ task }) {
  return (
    <div className="rounded-xl border p-4 shadow-sm bg-white flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-lg">{task.title}</h3>
        <span className="text-sm px-2 py-1 rounded bg-gray-100">
          {task.status}
        </span>
      </div>

      <div className="text-sm text-gray-600">
        Due: {new Date(task.deadline).toLocaleString()}
      </div>

      <div className="font-medium">
        Stake: ${task.stakeAmount}
      </div>

      <button className="mt-2 rounded-lg bg-black text-white py-2 text-sm">
        View / Submit Evidence
      </button>
    </div>
  );
}