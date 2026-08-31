'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreatePackagePage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
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
    duration_days: 3,
    duration_nights: 2,
    max_guests: 12,
    price_amount: 499,
    price_currency: 'USD',
    price_per: 'person',
    cancellation_days: 7,
    inclusions: 'Professional English-speaking tour guide\nAll ground transportation\nDaily breakfast & hotel accommodations\nEntrance tickets to all itinerary sites',
    exclusions: 'International flights\nPersonal travel insurance\nGratuities and tips\nAlcoholic beverages',
    highlights: 'Breathtaking scenic sights\nAuthentic local culinary tasting\nComfortable 4-star boutique hotel stay',
    meeting_point: 'Hotel lobby or designated central train station at 08:00 AM',
    difficulty_level: 'easy',
    min_age: 5,
    status: 'active',
  });

  const [itinerary, setItinerary] = useState([
    { day_number: 1, title: 'Arrival & Welcome Dinner', description: 'Meet your guide, check into the hotel, and enjoy a curated local culinary dinner.', meals: 'Dinner', accommodation: 'Boutique Hotel' },
    { day_number: 2, title: 'Full Day Cultural Exploration', description: 'Guided walking tour through historic landmarks and panoramic viewpoints.', meals: 'Breakfast, Lunch', accommodation: 'Boutique Hotel' },
    { day_number: 3, title: 'Farewell & Departure', description: 'Morning market visit followed by private transfer back to the airport or station.', meals: 'Breakfast', accommodation: 'None' },
  ]);

  const [images, setImages] = useState([
    { image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', alt_text: 'Scenic destination view', is_primary: 1 },
    { image_url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80', alt_text: 'Traveler landmark exploration', is_primary: 0 },
  ]);

  const [dates, setDates] = useState([
    { start_date: '2026-10-15', end_date: '2026-10-18', available_slots: 10, price_override: '' },
    { start_date: '2026-11-05', end_date: '2026-11-08', available_slots: 12, price_override: '' },
  ]);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
      })
      .catch(() => {});
  }, []);

  function handleTitleChange(val) {
    const generatedSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setForm((f) => ({ ...f, title: val, slug: generatedSlug }));
  }

  function addItineraryDay() {
    setItinerary((prev) => [
      ...prev,
      {
        day_number: prev.length + 1,
        title: `Day ${prev.length + 1} Activity`,
        description: 'Description of the daily schedule...',
        meals: 'Breakfast',
        accommodation: 'Hotel',
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
    setLoading(true);

    try {
      const payload = {
        ...form,
        price_amount: Math.round(parseFloat(form.price_amount) * 100), // convert to cents
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

      const res = await fetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setLoading(false);
      } else {
        router.push('/agent/packages');
      }
    } catch (err) {
      setError('An unexpected error occurred while saving the listing.');
      setLoading(false);
    }
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
          <h1 style={{ marginTop: '8px' }}>Create Travel Package</h1>
        </div>
      </div>

      {error && (
        <div style={{ padding: '14px 20px', background: '#f8d7da', color: '#721c24', borderRadius: 'var(--radius)', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Details */}
        <div className="card" style={{ padding: '28px', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '20px' }}>Basic Information</h3>

          <div className="form-group">
            <label className="form-label">Package Title *</label>
            <input
              type="text"
              required
              className="form-input"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. 5-Day Kyoto Cultural Heritage & Tea Experience"
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
                placeholder="e.g. Kyoto, Japan"
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
                placeholder="e.g. Japan"
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
            <label className="form-label">Short Summary (for listing card)</label>
            <input
              type="text"
              className="form-input"
              value={form.short_description}
              onChange={(e) => setForm({ ...form, short_description: e.target.value })}
              placeholder="Brief 1-2 sentence overview shown in search results..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Full Package Description *</label>
            <textarea
              rows={5}
              required
              className="form-textarea"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Provide a comprehensive narrative about this tour package..."
            />
          </div>
        </div>

        {/* Pricing & Logistics */}
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
              <label className="form-label">Price Unit</label>
              <select
                className="form-select"
                value={form.price_per}
                onChange={(e) => setForm({ ...form, price_per: e.target.value })}
              >
                <option value="person">Per Person</option>
                <option value="group">Per Group</option>
                <option value="couple">Per Couple</option>
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
              <label className="form-label">Max Group Size (Guests)</label>
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

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Difficulty Level</label>
              <select
                className="form-select"
                value={form.difficulty_level}
                onChange={(e) => setForm({ ...form, difficulty_level: e.target.value })}
              >
                <option value="easy">Easy (Suitable for all fitness levels)</option>
                <option value="moderate">Moderate (Some hiking / walking)</option>
                <option value="challenging">Challenging (Active adventurers)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Minimum Age (Years)</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={form.min_age}
                onChange={(e) => setForm({ ...form, min_age: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Meeting Point / Pick-up Instructions</label>
            <input
              type="text"
              className="form-input"
              value={form.meeting_point}
              onChange={(e) => setForm({ ...form, meeting_point: e.target.value })}
            />
          </div>
        </div>

        {/* Highlights, Inclusions & Exclusions */}
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
              <label className="form-label">What is Included (one per line)</label>
              <textarea
                rows={4}
                className="form-textarea"
                value={form.inclusions}
                onChange={(e) => setForm({ ...form, inclusions: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">What is Excluded (one per line)</label>
              <textarea
                rows={4}
                className="form-textarea"
                value={form.exclusions}
                onChange={(e) => setForm({ ...form, exclusions: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Daily Itinerary */}
        <div className="card" style={{ padding: '28px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Daily Itinerary Days</h3>
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
                {itinerary.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                    onClick={() => removeItineraryDay(idx)}
                  >
                    Remove Day
                  </button>
                )}
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
                <label className="form-label">Day Schedule & Details</label>
                <textarea
                  rows={2}
                  className="form-textarea"
                  value={day.description}
                  onChange={(e) => updateItineraryDay(idx, 'description', e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Meals Provided</label>
                  <input
                    type="text"
                    className="form-input"
                    value={day.meals}
                    onChange={(e) => updateItineraryDay(idx, 'meals', e.target.value)}
                    placeholder="e.g. Breakfast, Dinner"
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Accommodation</label>
                  <input
                    type="text"
                    className="form-input"
                    value={day.accommodation}
                    onChange={(e) => updateItineraryDay(idx, 'accommodation', e.target.value)}
                    placeholder="e.g. Boutique Hotel Kyoto"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Departure Dates */}
        <div className="card" style={{ padding: '28px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Scheduled Departure Dates</h3>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addDateSlot}>
              + Add Date Slot
            </button>
          </div>

          {dates.map((d, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 100px auto', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Start Date</label>
                <input
                  type="date"
                  required
                  className="form-input"
                  value={d.start_date}
                  onChange={(e) => updateDateSlot(idx, 'start_date', e.target.value)}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>End Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={d.end_date}
                  onChange={(e) => updateDateSlot(idx, 'end_date', e.target.value)}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Slots</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={d.available_slots}
                  onChange={(e) => updateDateSlot(idx, 'available_slots', e.target.value)}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Price ($)</label>
                <input
                  type="number"
                  placeholder="Default"
                  className="form-input"
                  value={d.price_override}
                  onChange={(e) => updateDateSlot(idx, 'price_override', e.target.value)}
                />
              </div>
              <div style={{ paddingTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ color: 'var(--color-danger)' }}
                  onClick={() => removeDateSlot(idx)}
                >
                  &times;
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Gallery Images */}
        <div className="card" style={{ padding: '28px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Package Image URLs</h3>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addImage}>
              + Add Image URL
            </button>
          </div>

          {images.map((img, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
              <input
                type="url"
                required
                className="form-input"
                placeholder="https://..."
                value={img.image_url}
                onChange={(e) => updateImage(idx, 'image_url', e.target.value)}
              />
              <input
                type="text"
                className="form-input"
                placeholder="Caption / Alt text"
                value={img.alt_text}
                onChange={(e) => updateImage(idx, 'alt_text', e.target.value)}
              />
              <button
                type="button"
                className="btn btn-sm"
                style={{ color: 'var(--color-danger)' }}
                onClick={() => removeImage(idx)}
              >
                &times;
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginBottom: '40px' }}>
          <Link href="/agent/packages" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating Listing...' : 'Publish Travel Package'}
          </button>
        </div>
      </form>
    </div>
  );
}
