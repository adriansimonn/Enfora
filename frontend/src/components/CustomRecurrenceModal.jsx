import { useState } from 'react';

export default function CustomRecurrenceModal({ onClose, onSave, initialRule = null }) {
  const [frequency, setFrequency] = useState(initialRule?.frequency || 'days');
  const [interval, setInterval] = useState(initialRule?.interval || 1);
  const [selectedDays, setSelectedDays] = useState(initialRule?.byWeekday || []);
  const [endType, setEndType] = useState(
    initialRule?.until ? 'date' : initialRule?.count ? 'count' : 'never'
  );
  const [endDate, setEndDate] = useState(initialRule?.until || '');
  const [endCount, setEndCount] = useState(initialRule?.count || 1);

  const daysOfWeek = [
    { label: 'S', value: 'SU', name: 'Sunday' },
    { label: 'M', value: 'MO', name: 'Monday' },
    { label: 'T', value: 'TU', name: 'Tuesday' },
    { label: 'W', value: 'WE', name: 'Wednesday' },
    { label: 'T', value: 'TH', name: 'Thursday' },
    { label: 'F', value: 'FR', name: 'Friday' },
    { label: 'S', value: 'SA', name: 'Saturday' },
  ];

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSave = () => {
    const rule = {
      frequency,
      interval: parseInt(interval),
    };

    if (frequency === 'weeks' && selectedDays.length > 0) {
      rule.byWeekday = selectedDays;
    }

    if (endType === 'date' && endDate) {
      rule.until = endDate;
    } else if (endType === 'count' && endCount) {
      rule.count = parseInt(endCount);
    }

    onSave(rule);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">Custom Recurrence</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Repeat Every */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Repeat every
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="w-20 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="days">{interval == 1 ? 'day' : 'days'}</option>
                <option value="weeks">{interval == 1 ? 'week' : 'weeks'}</option>
              </select>
            </div>
          </div>

          {/* Repeat On (for weeks only) */}
          {frequency === 'weeks' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Repeat on
              </label>
              <div className="flex gap-2">
                {daysOfWeek.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`w-10 h-10 rounded-full font-medium transition-all ${
                      selectedDays.includes(day.value)
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                    }`}
                    title={day.name}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ends */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Ends
            </label>
            <div className="space-y-3">
              {/* Never */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="endType"
                  value="never"
                  checked={endType === 'never'}
                  onChange={(e) => setEndType(e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2 bg-zinc-800 border-zinc-600"
                />
                <span className="text-gray-300 group-hover:text-white transition-colors">
                  Never
                </span>
              </label>

              {/* On Date */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="endType"
                  value="date"
                  checked={endType === 'date'}
                  onChange={(e) => setEndType(e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2 bg-zinc-800 border-zinc-600"
                />
                <span className="text-gray-300 group-hover:text-white transition-colors">
                  On
                </span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setEndType('date');
                  }}
                  className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              {/* After Count */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="endType"
                  value="count"
                  checked={endType === 'count'}
                  onChange={(e) => setEndType(e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2 bg-zinc-800 border-zinc-600"
                />
                <span className="text-gray-300 group-hover:text-white transition-colors">
                  After
                </span>
                <input
                  type="number"
                  min="1"
                  value={endCount}
                  onChange={(e) => {
                    setEndCount(e.target.value);
                    setEndType('count');
                  }}
                  className="w-20 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-300 group-hover:text-white transition-colors">
                  occurrences
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors border border-zinc-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 px-4 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
