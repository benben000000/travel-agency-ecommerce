'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditPackagePage() {
  const { id } = useParams();
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    slug: '',
    short_description: '',
    description: '',
    destination: '',
    country: '',
    region: 'Asia',
    category: '',
    activity_type: '',
    duration_days: 1,
    duration_nights: 0,
    max_guests: 10,
    price_amount: 100,
    price_currency: 'USD',
    price_per: 'person',
    cancellation_days: 7,
    inclusions: '',
    exclusions: '',
    highlights: '',
    meeting_point: '',
    difficulty_level: 'easy',
    min_age: 0,
    status: 'active',
  });

  const [itinerary, setItinerary] = useState([]);
  const [images, setImages] = useState([]);
  const [dates, setDates] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch(`/api/packages/${id}`).then((r) => r.json()),
    ])
      .then(([catData, pkgData]) => {
        if (catData.categories) setCategories(catData.categories);
        if (pkgData && !pkgData.error) {
          setForm({
            title: pkgData.title || '',
            slug: pkgData.slug || '',
            short_description: pkgData.short_description || '',
            description: pkgData.description || '',
            destination: pkgData.destination || '',
            country: pkgData.country || '',
            region: pkgData.region || 'Asia',
            category: pkgData.category || '',
            activity_type: pkgData.activity_type || '',
            duration_days: pkgData.duration_days || 1,
            duration_nights: pkgData.duration_nights || 0,
            max_guests: pkgData.max_guests || 10,
            price_amount: (pkgData.price_amount / 100) || 0,
            price_currency: pkgData.price_currency || 'USD',
            price_per: pkgData.price_per || 'person',
            cancellation_days: pkgData.cancellation_days || 7,
            inclusions: pkgData.inclusions || '',
            exclusions: pkgData.exclusions || '',
            highlights: pkgData.highlights || '',
            meeting_point: pkgData.meeting_point || '',
            difficulty_level: pkgData.difficulty_level || 'easy',
            min_age: pkgData.min_age || 0,
            status: pkgData.status || 'active',
          });

          if (pkgData.itinerary) setItinerary(pkgData.itinerary);
          if (pkgData.images) setImages(pkgData.images);
          if (pkgData.dates) {
            setDates(
              pkgData.dates.map((d) => ({
                ...d,
                price_override: d.price_override ? d.price_override / 100 : '',
              }))
            );
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load package details.');
        setLoading(false);
      });
  }, [id]);

  function addItineraryDay() {
    setItinerary((prev) => [
      ...prev,
      {
        day_number: prev.length + 1,
        title: `Day ${prev.length + 1}`,
        description: '',
        meals: '',
        accommodation: '',
      },
    ]);
  }

  function removeItineraryDay(idx) {
    setItinerary((prev) => prev.filter((_, i) => i !== idx).map((day, i) => ({ ...day, day_number: i + 1 })));
  }

  function updateItineraryDay(idx, field, val) {
    setItinerary((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, [field]: val } : d))
    );
  }

  function addImage() {
    setImages((prev) => [...prev, { image_url: '', alt_text: '', is_primary: 0 }]);
  }

  function removeImage(idx) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateImage(idx, field, val) {
    setImages((prev) =>
      prev.map((img, i) => (i === idx ? { ...img, [field]: val } : img))
    );
  }

  function addDateSlot() {
    setDates((prev) => [...prev, { start_date: '', end_date: '', available_slots: 10, price_override: '' }]);
  }

  function removeDateSlot(idx) {
    setDates((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateDateSlot(idx, field, val) {
    setDates((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, [field]: val } : d))
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        ...form,
        price_amount: Math.round(parseFloat(form.price_amount) * 100),
        duration_days: parseInt(form.duration_days) || 1,
        duration_nights: parseInt(form.duration_nights) || 0,
        max_guests: parseInt(form.max_guests) || 10,
        cancellation_days: parseInt(form.cancellation_days) || 7,
        min_age: parseInt(form.min_age) || 0,
        itinerary: itinerary.filter((d) => d.title.trim()),
        images: images.filter((img) => img.image_url.trim()),
        dates: dates.filter((d) => d.start_date.trim()).map((d) => ({
          ...d,
          available_slots: parseInt(d.available_slots) || 10,
          price_override: d.price_override ? Math.round(parseFloat(d.price_override) * 100) : null,
        })),
      };

      const res = await fetch(`/api/packages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setSaving(false);
      } else {
        router.push('/agent/packages');
      }
    } catch (err) {
      setError('An unexpected error occurred while saving.');
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const destinationCategories = categories.filter((c) => c.type === 'destination');
  const activityCategories = categories.filter((c) => c.type === 'activity');

  return (
    <div style={{ maxWidth: '900px' }}>
      <div className="dashboard-header">
        <div>
          <Link href="/agent/packages" style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            &larr; Back to Listings
          </Link>
          <h1 style={{ marginTop: '8px' }}>Edit Package #{id}</h1>
        </div>
      </div>

      {error && (
        <div style={{ padding: '14px 20px', background: '#f8d7da', color: '#721c24', borderRadius: 'var(--radius)', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ padding: '28px', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '20px' }}>Basic Information</h3>

          <div className="form-group">
            <label className="form-label">Package Title *</label>
            <input
              type="text"
              required
              className="form-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">URL Slug *</label>
              <input
                type="text"
                required
                className="form-input"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Destination City / Location *</label>
              <input
                type="text"
                required
                className="form-input"
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Country *</label>
              <input
                type="text"
                required
                className="form-input"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Region *</label>
              <select
                className="form-select"
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
              >
                <option value="Asia">Asia</option>
                <option value="Europe">Europe</option>
                <option value="Americas">Americas</option>
                <option value="Africa">Africa</option>
                <option value="Oceania">Oceania</option>
                <option value="Middle East">Middle East</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Destination Category</label>
              <select
                className="form-select"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="">Select Category</option>
                {destinationCategories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Activity Type</label>
              <select
                className="form-select"
                value={form.activity_type}
                onChange={(e) => setForm({ ...form, activity_type: e.target.value })}
              >
                <option value="">Select Activity</option>
                {activityCategories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Short Summary</label>
            <input
              type="text"
              className="form-input"
              value={form.short_description}
              onChange={(e) => setForm({ ...form, short_description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Full Description *</label>
            <textarea
              rows={5}
              required
              className="form-textarea"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>

        <div className="card" style={{ padding: '28px', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '20px' }}>Pricing & Logistics</h3>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Base Price ($ USD) *</label>
              <input
                type="number"
                step="1"
                min="1"
                required
                className="form-input"
                value={form.price_amount}
                onChange={(e) => setForm({ ...form, price_amount: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="active">Active (Visible)</option>
                <option value="pending">Pending Review</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Duration (Days)</label>
              <input
                type="number"
                min="1"
                required
                className="form-input"
                value={form.duration_days}
                onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Duration (Nights)</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={form.duration_nights}
                onChange={(e) => setForm({ ...form, duration_nights: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Max Group Size</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={form.max_guests}
                onChange={(e) => setForm({ ...form, max_guests: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Cancellation Deadline (Days Prior)</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={form.cancellation_days}
                onChange={(e) => setForm({ ...form, cancellation_days: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Meeting Point</label>
            <input
              type="text"
              className="form-input"
              value={form.meeting_point}
              onChange={(e) => setForm({ ...form, meeting_point: e.target.value })}
            />
          </div>
        </div>

        <div className="card" style={{ padding: '28px', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '20px' }}>Inclusions, Exclusions & Highlights</h3>

          <div className="form-group">
            <label className="form-label">Key Highlights (one per line)</label>
            <textarea
              rows={3}
              className="form-textarea"
              value={form.highlights}
              onChange={(e) => setForm({ ...form, highlights: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Inclusions (one per line)</label>
              <textarea
                rows={4}
                className="form-textarea"
                value={form.inclusions}
                onChange={(e) => setForm({ ...form, inclusions: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Exclusions (one per line)</label>
              <textarea
                rows={4}
                className="form-textarea"
                value={form.exclusions}
                onChange={(e) => setForm({ ...form, exclusions: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '28px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Daily Itinerary</h3>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addItineraryDay}>
              + Add Day
            </button>
          </div>

          {itinerary.map((day, idx) => (
            <div
              key={idx}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                padding: '16px',
                marginBottom: '16px',
                background: 'var(--color-bg-alt)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <strong style={{ color: 'var(--color-primary)' }}>Day {day.day_number}</strong>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                  onClick={() => removeItineraryDay(idx)}
                >
                  Remove
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Day Title</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={day.title}
                  onChange={(e) => updateItineraryDay(idx, 'title', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  rows={2}
                  className="form-textarea"
                  value={day.description}
                  onChange={(e) => updateItineraryDay(idx, 'description', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginBottom: '40px' }}>
          <Link href="/agent/packages" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
