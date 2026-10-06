import { useState } from 'react';
import Select from './Select';

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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-black border border-white/[0.08] rounded-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08]">
          <h2 className="text-xl font-light text-white tracking-[-0.01em]">Custom Recurrence</h2>
          <button
            onClick={onClose}
            className="p-1 -mr-1 text-gray-500 hover:text-white transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-8">
          {/* Repeat Every */}
          <div>
            <label className="block text-[13px] font-normal text-gray-300 mb-2">
              Repeat every
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="w-20 tabular-nums px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[15px] text-white font-light focus:outline-none focus:border-white/[0.25] transition-colors duration-200 [color-scheme:dark]"
              />
              <Select
                id="frequency"
                value={frequency}
                onChange={setFrequency}
                options={[
                  { value: 'days', label: interval == 1 ? 'day' : 'days' },
                  { value: 'weeks', label: interval == 1 ? 'week' : 'weeks' },
                ]}
                className="flex-1 px-3 py-2 text-[15px]"
              />
            </div>
          </div>

          {/* Repeat On (for weeks only) */}
          {frequency === 'weeks' && (
            <div>
              <label className="block text-[13px] font-normal text-gray-300 mb-3">
                Repeat on
              </label>
              <div className="flex gap-2">
                {daysOfWeek.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`w-9 h-9 rounded-full text-[13px] font-normal transition-all duration-200 ${
                      selectedDays.includes(day.value)
                        ? 'bg-white text-black'
                        : 'border border-white/[0.08] text-gray-400 hover:text-white hover:border-white/[0.15]'
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
            <label className="block text-[13px] font-normal text-gray-300 mb-3">
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
                  className="w-4 h-4 accent-white cursor-pointer"
                />
                <span className="text-[14px] text-gray-300 font-light group-hover:text-white transition-colors duration-200">
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
                  className="w-4 h-4 accent-white cursor-pointer"
                />
                <span className="text-[14px] text-gray-300 font-light group-hover:text-white transition-colors duration-200">
                  On
                </span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setEndType('date');
                  }}
                  className="flex-1 px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[15px] text-white font-light focus:outline-none focus:border-white/[0.25] transition-colors duration-200 [color-scheme:dark]"
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
                  className="w-4 h-4 accent-white cursor-pointer"
                />
                <span className="text-[14px] text-gray-300 font-light group-hover:text-white transition-colors duration-200">
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
                  className="w-20 tabular-nums px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[15px] text-white font-light focus:outline-none focus:border-white/[0.25] transition-colors duration-200 [color-scheme:dark]"
                />
                <span className="text-[14px] text-gray-300 font-light group-hover:text-white transition-colors duration-200">
                  occurrences
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-5 py-2.5 bg-white/[0.03] text-white text-sm font-normal rounded-lg border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 px-5 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-100 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
