import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSlot, updateSlot } from '../../services/parkingSlot';

export default function EditSlot() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ slot_number: '', floor: '', is_occupied: false });

  useEffect(() => {
    async function load() {
      try {
        const data = await getSlot(id);
        setForm({
          slot_number: data.slot_number ?? '',
          floor: String(data.floor ?? ''),
          is_occupied: Boolean(data.is_occupied),
        });
      } catch (e) {
        setError('Failed to load slot');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await updateSlot(id, {
        slot_number: form.slot_number,
        floor: form.floor,
        is_occupied: form.is_occupied,
      });
      setMessage('Saved');
      setTimeout(() => navigate('/admin/slots'), 600);
    } catch (e) {
      setError('Save failed');
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Edit Slot</h2>
      <form onSubmit={onSubmit} className="card">
        <label>Slot number
          <input
            value={form.slot_number}
            onChange={e => setForm({ ...form, slot_number: e.target.value })}
            required
          />
        </label>
        <label>Floor
          <input
            value={form.floor}
            onChange={e => setForm({ ...form, floor: e.target.value })}
            required
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={form.is_occupied}
            onChange={e => setForm({ ...form, is_occupied: e.target.checked })}
          />
          Occupied
        </label>
        {message && <div className="note">{message}</div>}
        {error && <div className="error">{error}</div>}
        <div className="row">
          <button type="submit">Save</button>
          <button type="button" onClick={() => navigate('/admin/slots')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}


