import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createSlot, listAllSlots, deleteSlot } from '../../services/parkingSlot';
import Modal from '../../UIcomponents/Modal';
import Toast from '../../UIcomponents/Toast';
import '../../stylesheets/components.css';

export default function ManageSlots() {
  const [slots, setSlots] = useState([]);
  const [slotNumber, setSlotNumber] = useState('');
  const [floor, setFloor] = useState('1');
  const [message, setMessage] = useState('');
  const [open, setOpen] = useState(false);

  async function load() {
    const data = await listAllSlots();
    setSlots(data);
  }

  useEffect(() => { load(); }, []);

  async function addSlot(e) {
    e.preventDefault();
    setMessage('');
    try {
      await createSlot({ slot_number: slotNumber, floor });
      setSlotNumber('');
      await load();
      setMessage('Created');
    } catch (e) {
      setMessage('Create failed');
    }
  }

  async function remove(id) {
    setMessage('');
    try {
      await deleteSlot(id);
      await load();
      setMessage('Deleted');
    } catch (e) {
      setMessage('Delete failed');
    }
  }

  return (
    <div>
      <h2>Manage Slots</h2>

      <div className="row" style={{ marginBottom: 8, gap: 8 }}>
        <button className="btn-primary small" onClick={() => setOpen(true)}>Add Slot</button>
        <button className="btn-outline" onClick={load}>Refresh</button>
      </div>

      <ul className="list">
        {slots.map(s => (
          <li key={s.id} className="list-item">
            <div>
              <strong>{s.slot_number}</strong> (Floor {s.floor}) {s.is_occupied ? '— Occupied' : ''}
            </div>
            <div className="row">
              <Link to={`/admin/slots/${s.id}/edit`}>Edit</Link>
              <button onClick={() => remove(s.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>

      <Modal open={open} title="Add Slot" onClose={() => setOpen(false)} footer={(
        <>
          <button className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary small" onClick={(e) => { addSlot(e); setOpen(false); }}>Save</button>
        </>
      )}>
        <form onSubmit={addSlot} className="row" style={{ display: 'grid', gap: 8 }}>
          <label>Slot number
            <input placeholder="e.g. P12" value={slotNumber} onChange={e => setSlotNumber(e.target.value)} required />
          </label>
          <label>Floor
            <input placeholder="e.g. 1" value={floor} onChange={e => setFloor(e.target.value)} required />
          </label>
        </form>
      </Modal>

      <Toast message={message} type={/Created|Deleted/.test(message) ? 'success' : message ? 'error' : 'info'} onClose={() => setMessage('')} />
    </div>
  );
}



