import React, { useState, useEffect } from 'react';
import { RRule } from 'rrule';

const timeZones = [
  "America/Chicago",
  "Pacific/Honolulu",
  "America/Anchorage",
  "America/Los_Angeles",
  "America/Denver",
  "America/New_York",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const getOrdinalSuffix = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

const getWeekdayOccurrence = (date) => {
  const day = date.getDay();
  const month = date.getMonth();
  const year = date.getFullYear();
  let count = 0;
  let currentDate = new Date(year, month, 1);

  while (currentDate.getMonth() === month) {
    if (currentDate.getDay() === day) {
      count++;
      if (currentDate.getDate() === date.getDate()) {
        return count;
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return count;
};

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const EditEventPopup = ({ event, onClose, onSave }) => {
  const [formState, setFormState] = useState({
    title: '',
    start: '',
    end: '',
    location: '',
    description: '',
    timeZone: '',
    recurrencePreset: 'none',
    customInterval: 1,
    customUnit: 'days',
    customDays: [],
    customEndType: 'never',
    customEndDate: '',
    customOccurrences: 1,
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (event) {
      const toLocalDateTime = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
      };

      setFormState({
        title: event.title || '',
        start: toLocalDateTime(event.start),
        end: toLocalDateTime(event.end),
        location: event.location || '',
        description: event.description || '',
        timeZone: event.timeZone || timeZones[0],
        recurrencePreset: 'none',
        customInterval: 1,
        customUnit: 'days',
        customDays: [],
        customEndType: 'never',
        customEndDate: '',
        customOccurrences: 1,
      });
    }
  }, [event]);

  const generateRecurrence = () => {
    const ruleOptions = getRuleOptions();
    if (!ruleOptions.freq) return '';

    try {
      const rule = new RRule({
        ...ruleOptions,
        dtstart: new Date(formState.start),
      });
      return rule.toString().replace('RRULE:', '');
    } catch (error) {
      console.error('Error generating recurrence rule:', error);
      return '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (new Date(formState.start) >= new Date(formState.end)) {
      alert('End time must be after start time');
      return;
    }

    const ruleString = generateRecurrence();

    const dataToSend = {
      ...formState,
      recurrence: ruleString ? [`RRULE:${ruleString}`] : [],
      id: event.id,
      timeZone: formState.timeZone,
    };

    try {
      setIsSaving(true);
      await onSave(dataToSend);
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to edit');
    } finally {
      setIsSaving(false);
    }
  };

  const getRuleOptions = () => {
    const startDate = new Date(formState.start);

    switch (formState.recurrencePreset) {
      case 'daily':
        return { freq: RRule.DAILY, interval: 1 };

      case 'weekly':
        return {
          freq: RRule.WEEKLY,
          interval: 1,
          byweekday: [RRule[['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][startDate.getDay()]]],
        };

      case 'monthly':
        return {
          freq: RRule.MONTHLY,
          interval: 1,
          byweekday: [RRule[['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][startDate.getDay()]]
            .nth(getWeekdayOccurrence(startDate))],
        };

      case 'yearly':
        return {
          freq: RRule.YEARLY,
          interval: 1,
          bymonth: startDate.getMonth() + 1,
          bymonthday: startDate.getDate(),
        };

      case 'weekday':
        return {
          freq: RRule.WEEKLY,
          interval: 1,
          byweekday: [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR],
        };

      case 'custom':
        const rule = {
          freq: RRule[formState.customUnit.toUpperCase()],
          interval: formState.customInterval,
        };

        if (formState.customUnit === 'weeks') {
          const startDay = startDate
            ? ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][startDate.getDay()]
            : 'MO';

          rule.byweekday = formState.customDays?.length > 0
            ? formState.customDays.map(day =>
              RRule[day.substring(0, 2).toUpperCase()]
            )
            : [RRule[startDay]];
        }

        if (formState.customEndType === 'date') {
          rule.until = new Date(formState.customEndDate);
        } else if (formState.customEndType === 'count') {
          rule.count = formState.customOccurrences;
        }

        return rule;

      default:
        return {};
    }
  };

  const startDate = formState.start ? new Date(formState.start) : null;
  const eventDayName = startDate?.toLocaleDateString('en-US', { weekday: 'long' }) || '';
  const eventMonthName = startDate?.toLocaleDateString('en-US', { month: 'long' }) || '';
  const eventMonthDay = startDate?.getDate() || '';
  const ordinal = startDate
    ? `${getWeekdayOccurrence(startDate)}${getOrdinalSuffix(getWeekdayOccurrence(startDate))}`
    : '';

  // When a new start date is selected, update the end date to have the same day (but keep its original time)
  const handleStartChange = (e) => {
    const newStart = e.target.value;
    let newEnd = formState.end;
    if (newStart && formState.end) {
      const newDatePart = newStart.split('T')[0];
      const endTimePart = formState.end.split('T')[1] || '';
      newEnd = `${newDatePart}T${endTimePart}`;
    }
    setFormState({
      ...formState,
      start: newStart,
      end: newEnd,
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-[90%] max-w-2xl shadow-lg relative max-h-[80vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-3 right-3 text-2xl">&times;</button>
        <h3 className="text-xl font-semibold mb-4">Edit Event</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic event fields */}
          <div>
            <label className="block">Title</label>
            <input
              type="text"
              value={formState.title}
              onChange={(e) => setFormState({ ...formState, title: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block">Start</label>
            <input
              type="datetime-local"
              value={formState.start}
              onChange={handleStartChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block">End</label>
            <input
              type="datetime-local"
              value={formState.end}
              onChange={(e) => setFormState({ ...formState, end: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block">Location</label>
            <input
              type="text"
              value={formState.location}
              onChange={(e) => setFormState({ ...formState, location: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block">Description</label>
            <textarea
              value={formState.description}
              onChange={(e) => setFormState({ ...formState, description: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          {/* Time Zone dropdown */}
          <div>
            <label className="block">Time Zone</label>
            <select
              value={formState.timeZone}
              onChange={(e) => setFormState({ ...formState, timeZone: e.target.value })}
              className="w-full p-2 border rounded"
            >
              {timeZones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
          {/* Recurrence section */}
          <div className="border-t pt-4">
            <h4 className="text-lg font-semibold mb-2">Recurrence</h4>
            <select
              value={formState.recurrencePreset}
              onChange={(e) => setFormState({ ...formState, recurrencePreset: e.target.value })}
              className="w-full p-2 border rounded"
            >
              <option value="none">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly on {eventDayName}</option>
              <option value="monthly">Monthly on {ordinal} {eventDayName}</option>
              <option value="yearly">Annually on {eventMonthName} {eventMonthDay}</option>
              <option value="weekday">Every weekday (Monday to Friday)</option>
              <option value="custom">Custom</option>
            </select>
            {formState.recurrencePreset === 'custom' && (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <span>Repeat every</span>
                  <input
                    type="number"
                    min="1"
                    value={formState.customInterval}
                    onChange={(e) =>
                      setFormState({ ...formState, customInterval: parseInt(e.target.value) })
                    }
                    className="w-16 p-1 border rounded"
                  />
                  <select
                    value={formState.customUnit}
                    onChange={(e) =>
                      setFormState({ ...formState, customUnit: e.target.value })
                    }
                    className="p-1 border rounded"
                  >
                    <option value="days">day(s)</option>
                    <option value="weeks">week(s)</option>
                    <option value="months">month(s)</option>
                    <option value="years">year(s)</option>
                  </select>
                </div>
                {formState.customUnit === 'weeks' && (
                  <div>
                    <label>Repeat on</label>
                    <div className="grid grid-cols-7 gap-2 mt-1">
                      {dayNames.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const newDays = formState.customDays.includes(day)
                              ? formState.customDays.filter(d => d !== day)
                              : [...formState.customDays, day];
                            setFormState({ ...formState, customDays: newDays });
                          }}
                          className={`p-2 rounded ${formState.customDays.includes(day)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200'
                            }`}
                        >
                          {day.substring(0, 1)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label>Ends</label>
                  <div className="space-y-2 mt-1">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="customEndType"
                        value="never"
                        checked={formState.customEndType === 'never'}
                        onChange={() => setFormState({ ...formState, customEndType: 'never' })}
                      />
                      Never
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="customEndType"
                        value="date"
                        checked={formState.customEndType === 'date'}
                        onChange={() => setFormState({ ...formState, customEndType: 'date' })}
                      />
                      On
                      <input
                        type="date"
                        value={formState.customEndDate}
                        onChange={(e) =>
                          setFormState({ ...formState, customEndDate: e.target.value })
                        }
                        className="p-1 border rounded"
                        disabled={formState.customEndType !== 'date'}
                      />
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="customEndType"
                        value="count"
                        checked={formState.customEndType === 'count'}
                        onChange={() => setFormState({ ...formState, customEndType: 'count' })}
                      />
                      After
                      <input
                        type="number"
                        min="1"
                        value={formState.customOccurrences}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            customOccurrences: parseInt(e.target.value),
                          })
                        }
                        className="w-20 p-1 border rounded"
                        disabled={formState.customEndType !== 'count'}
                      />
                      occurrences
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className={`w-full p-2 rounded text-white ${isSaving ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
            >
              {isSaving ? 'Loading...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEventPopup;
