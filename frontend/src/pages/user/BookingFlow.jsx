import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Modal from '../../UIcomponents/Modal';
import Toast from '../../UIcomponents/Toast';
import { createBooking } from '../../services/bookingslot';
import '../../stylesheets/components.css';

export default function BookingFlow() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preselectedSlotId = params.get('slot');
  const preselectedSlotCode = params.get('slot_code');

  const steps = useMemo(() => ['Select Slot', 'Schedule', 'Review', 'Done'], []);
  const [step, setStep] = useState(0);
  const [slot, setSlot] = useState({ id: preselectedSlotId, code: preselectedSlotCode });
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('1');
  const [confirm, setConfirm] = useState(false);
  const [message, setMessage] = useState('');

  function next() { setStep(s => Math.min(s + 1, steps.length - 1)); }
  function back() { setStep(s => Math.max(s - 1, 0)); }

  async function placeBooking() {
    try {
      await createBooking({ slot: Number(slot.id) });
      setMessage('Booking confirmed!');
      setStep(3);
    } catch (e) {
      setMessage('Booking failed');
    }
  }

  return (
    <div>
      <h2>Booking</h2>

      {/* Stepper */}
      <div style={{ display: 'flex', gap: 8, margin: '8px 0 16px' }}>
        {steps.map((label, i) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 999, display: 'grid', placeItems: 'center',
              background: i <= step ? '#667eea' : '#eee', color: i <= step ? '#fff' : '#666', fontWeight: 700
            }}>{i + 1}</div>
            <div style={{ fontWeight: i === step ? 700 : 500, color: i === step ? '#333' : '#666' }}>{label}</div>
            {i < steps.length - 1 && <div style={{ width: 24, height: 2, background: '#ddd', margin: '0 6px' }} />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="card">
          <h3>Select Slot</h3>
          <label>Slot ID
            <input value={slot.id ?? ''} onChange={e => setSlot(s => ({ ...s, id: e.target.value }))} placeholder="e.g. 12" />
          </label>
          <label>Slot Code (optional)
            <input value={slot.code ?? ''} onChange={e => setSlot(s => ({ ...s, code: e.target.value }))} placeholder="e.g. P12" />
          </label>
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn-outline" onClick={() => navigate('/slots')}>Browse Slots</button>
            <button className="btn-primary small" disabled={!slot.id} onClick={next}>Continue</button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="card">
          <h3>Schedule</h3>
          <div className="row" style={{ gap: 8 }}>
            <label style={{ flex: 1 }}>Date
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </label>
            <label style={{ flex: 1 }}>Start Time
              <input type="time" value={time} onChange={e => setTime(e.target.value)} />
            </label>
            <label style={{ width: 140 }}>Duration (hrs)
              <select value={duration} onChange={e => setDuration(e.target.value)}>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </label>
          </div>
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn-outline" onClick={back}>Back</button>
            <button className="btn-primary small" onClick={next}>Continue</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <h3>Review</h3>
          <ul className="list">
            <li className="list-item"><strong>Slot:</strong> {slot.code ?? `#${slot.id}`}</li>
            <li className="list-item"><strong>Date:</strong> {date || '(today)'}</li>
            <li className="list-item"><strong>Start:</strong> {time || '(now)'}</li>
            <li className="list-item"><strong>Duration:</strong> {duration} hour(s)</li>
            <li className="list-item"><strong>Estimated:</strong> ${(5 * Number(duration)).toFixed(2)}</li>
          </ul>
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn-outline" onClick={back}>Back</button>
            <button className="btn-primary small" onClick={() => setConfirm(true)}>Place Booking</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card">
          <h3>Success 🎉</h3>
          <p>Your booking has been placed. A confirmation was sent to your email.</p>
          <div className="row">
            <button className="btn-primary small" onClick={() => navigate('/bookings')}>Go to My Bookings</button>
            <button className="btn-outline" onClick={() => navigate('/slots')}>Book Another</button>
          </div>
        </div>
      )}

      <Modal open={confirm} title="Confirm Booking" onClose={() => setConfirm(false)} footer={(
        <>
          <button className="btn-outline" onClick={() => setConfirm(false)}>Cancel</button>
          <button className="btn-primary small" onClick={() => { setConfirm(false); placeBooking(); }}>Confirm</button>
        </>
      )}>
        Confirm booking for slot {slot.code ?? `#${slot.id}`}?
      </Modal>

      <Toast message={message} type={message.includes('confirmed') ? 'success' : message ? 'error' : 'info'} onClose={() => setMessage('')} />
    </div>
  );
}


