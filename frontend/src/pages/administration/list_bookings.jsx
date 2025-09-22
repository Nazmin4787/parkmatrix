import { useEffect, useState } from 'react';
import { listAllSlots } from '../../services/parkingSlot';
import { listAllBookings, adminCancelBooking } from '../../services/bookingslot';
import '../../stylesheets/components.css';

// Simple admin-facing list that shows active bookings and slot occupancy
export default function AdminListBookings() {
  const [bookings, setBookings] = useState([]);
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [email, setEmail] = useState('');
  const [slot, setSlot] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pageInfo, setPageInfo] = useState({ count: 0, next: null, previous: null });
  const [startAfter, setStartAfter] = useState(''); // yyyy-MM-dd or datetime-local
  const [startBefore, setStartBefore] = useState('');

  async function load() {
      try {
        const [b, s] = await Promise.all([
          listAllBookings({ active: activeOnly ? true : undefined, email: email || undefined, slot: slot || undefined, page, page_size: pageSize, start_after: startAfter || undefined, start_before: startBefore || undefined }),
          listAllSlots(),
        ]);
        if (Array.isArray(b?.results)) {
          setBookings(b.results);
          setPageInfo({ count: b.count ?? 0, next: b.next, previous: b.previous });
        } else {
          setBookings(Array.isArray(b) ? b : []);
          setPageInfo({ count: Array.isArray(b) ? b.length : 0, next: null, previous: null });
        }
        setSlots(Array.isArray(s) ? s : []);
      } catch (e) {
        setError('Failed to load');
      }
  }

  useEffect(() => { load(); }, [activeOnly, email, slot, page, pageSize, startAfter, startBefore]);

  async function adminCancel(id) {
    await adminCancelBooking(id);
    await load();
  }

  return (
    <div>
      <h2>Bookings (Admin)</h2>
      {error && <div className="error">{error}</div>}

      <h3>All Bookings</h3>
      <div className="row" style={{ alignItems: 'center' }}>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={activeOnly} onChange={e => setActiveOnly(e.target.checked)} />
          Active only
        </label>
        <input placeholder="Filter by email" value={email} onChange={e => { setPage(1); setEmail(e.target.value); }} />
        <input placeholder="Filter by slot" value={slot} onChange={e => { setPage(1); setSlot(e.target.value); }} />
        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          From
          <input type="date" value={startAfter} onChange={e => { setPage(1); setStartAfter(e.target.value); }} />
        </label>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          To
          <input type="date" value={startBefore} onChange={e => { setPage(1); setStartBefore(e.target.value); }} />
        </label>
        <select value={pageSize} onChange={e => { setPage(1); setPageSize(Number(e.target.value)); }}>
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>
      </div>
      <ul className="list">
        {bookings.map(b => (
          <li key={b.id} className="list-item">
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={`badge ${b.is_active ? 'badge-green' : 'badge-gray'}`}>{b.is_active ? 'Active' : 'Completed'}</span>
                <strong>User:</strong> {b.user?.username} ({b.user?.email})
              </div>
              <div>
                <strong>Slot:</strong> {b.slot_number ?? b.slot_detail?.slot_number ?? `#${b.slot}`} (Floor {b.floor ?? b.slot_detail?.floor ?? '?'}) — <strong>Start:</strong> {new Date(b.start_time).toLocaleString()}
              </div>
            </div>
            {b.is_active && <button className="btn-outline" onClick={() => adminCancel(b.id)}>Cancel</button>}
          </li>
        ))}
      </ul>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <button disabled={!pageInfo.previous} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
        <div>Page {page}</div>
        <button disabled={!pageInfo.next} onClick={() => setPage(p => p + 1)}>Next</button>
      </div>

      <h3>All Slots</h3>
      <ul className="list">
        {slots.map(s => (
          <li key={s.id} className="list-item">
            <div>
              <strong>{s.slot_number}</strong> (Floor {s.floor}) — {s.is_occupied ? 'Occupied' : 'Free'}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}


