'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ChatBookingCard({ bookingData, onPaymentSuccess, isAgent = false }) {
  const [showItinerary, setShowItinerary] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [currentStatus, setCurrentStatus] = useState(bookingData.status || 'pending');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  const isConfirmed = currentStatus === 'confirmed';
  const totalPrice = bookingData.price_amount ? (bookingData.price_amount / 100) : 0;
  const finalPrice = Math.max(0, totalPrice - discountAmount);

  async function handleCompletePayment(e) {
    e.preventDefault();
    setPaying(true);
    setPayError('');

    try {
      const res = await fetch(`/api/bookings/${bookingData.booking_id || bookingData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'confirmed',
          payment_status: 'paid',
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Payment failed to process');
      }

      setCurrentStatus('confirmed');
      setShowPayModal(false);

      if (onPaymentSuccess) {
        onPaymentSuccess({
          ...bookingData,
          status: 'confirmed',
          payment_status: 'paid',
        });
      }
    } catch (err) {
      setPayError(err.message || 'Payment processing error');
    } finally {
      setPaying(false);
    }
  }

  function handleApplyPromo() {
    if (!promoCode.trim()) return;
    if (promoCode.toUpperCase() === 'WELCOME10' || promoCode.toUpperCase() === 'GLOBAL10') {
      setDiscountAmount(totalPrice * 0.1);
    } else {
      setDiscountAmount(50);
    }
  }

  return (
    <>
      <div className="chat-booking-card">
        <div className="chat-booking-card-header">
          <div className="chat-booking-badge-wrap">
            <span className={`chat-booking-badge ${isConfirmed ? 'confirmed' : 'pending'}`}>
              {isConfirmed ? '✓ Confirmed & Paid' : '● Pending Payment'}
            </span>
            <span className="chat-booking-ref">Ref: #{bookingData.booking_ref}</span>
          </div>
          <div className="chat-booking-price-header">
            <span className="chat-booking-price-amount">${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
            <span className="chat-booking-price-label">total</span>
          </div>
        </div>

        <div className="chat-booking-card-body">
          <h4 className="chat-booking-title">
            <Link href={`/packages/${bookingData.package_slug || ''}`} target="_blank">
              {bookingData.package_title} ↗
            </Link>
          </h4>

          {bookingData.destination && (
            <div className="chat-booking-dest">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>{bookingData.destination}</span>
            </div>
          )}

          <div className="chat-booking-grid">
            <div className="chat-booking-cell">
              <span className="cell-label">DEPARTURE</span>
              <span className="cell-value">{bookingData.departure_date || 'Scheduled'}</span>
            </div>
            <div className="chat-booking-cell">
              <span className="cell-label">GUESTS</span>
              <span className="cell-value">{bookingData.guests_count || 2} Traveler{bookingData.guests_count > 1 ? 's' : ''}</span>
            </div>
            {bookingData.duration_days && (
              <div className="chat-booking-cell">
                <span className="cell-label">DURATION</span>
                <span className="cell-value">{bookingData.duration_days} Days</span>
              </div>
            )}
            {bookingData.meeting_point && (
              <div className="chat-booking-cell" style={{ gridColumn: 'span 2' }}>
                <span className="cell-label">MEETING POINT</span>
                <span className="cell-value" style={{ fontSize: '0.8rem', whiteSpace: 'normal' }}>
                  {bookingData.meeting_point}
                </span>
              </div>
            )}
          </div>

          {/* Expandable Itinerary & Inclusions Drawer */}
          {bookingData.inclusions && (
            <div className="chat-booking-itinerary-section">
              <button
                type="button"
                className="chat-booking-toggle-btn"
                onClick={() => setShowItinerary(!showItinerary)}
              >
                <span>{showItinerary ? 'Hide Inclusions & Details' : 'View Inclusions & Details'}</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  style={{ transform: showItinerary ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {showItinerary && (
                <div className="chat-booking-inclusions-content">
                  <p className="inclusions-title">Trip Inclusions:</p>
                  <p className="inclusions-text">{bookingData.inclusions}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="chat-booking-card-actions">
          {!isConfirmed && !isAgent ? (
            <button
              type="button"
              className="btn btn-primary btn-sm btn-block chat-pay-btn"
              onClick={() => setShowPayModal(true)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
              <span>Proceed to Payment (${finalPrice.toLocaleString('en-US', { minimumFractionDigits: 0 })})</span>
            </button>
          ) : isConfirmed ? (
            <Link
              href={`/dashboard/bookings/${bookingData.booking_id || bookingData.id}`}
              className="btn btn-secondary btn-sm btn-block"
            >
              <span>View Confirmed Booking Receipt</span>
              <span>→</span>
            </Link>
          ) : (
            <div className="chat-agent-status-note">
              <span>Client reservation pending payment</span>
            </div>
          )}
        </div>
      </div>

      {/* ===== IN-CHAT PAYMENT & CHECKOUT MODAL ===== */}
      {showPayModal && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="modal-content chat-checkout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Complete Reservation</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  Booking Ref: #{bookingData.booking_ref}
                </span>
              </div>
              <button type="button" className="modal-close" onClick={() => setShowPayModal(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleCompletePayment}>
              <div className="modal-body">
                {payError && <div className="alert alert-danger mb-3">{payError}</div>}

                {/* Tour Summary Card */}
                <div className="chat-checkout-summary">
                  <div className="checkout-summary-item">
                    <span className="summary-title">{bookingData.package_title}</span>
                    <span className="summary-val">${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="checkout-summary-meta">
                    <span>{bookingData.destination}</span>
                    <span>&bull;</span>
                    <span>{bookingData.guests_count || 2} Guests</span>
                    <span>&bull;</span>
                    <span>{bookingData.departure_date}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="checkout-summary-item discount" style={{ color: 'var(--color-success)', marginTop: '8px' }}>
                      <span>Promo Discount</span>
                      <span>-${discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  <div className="checkout-summary-total">
                    <span>Total Due Now</span>
                    <span className="total-num">${finalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Promo Code Input */}
                <div className="form-group mb-3">
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Promo or Gift Code</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. WELCOME10"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleApplyPromo}
                    >
                      Apply
                    </button>
                  </div>
                </div>

                {/* Simulated Payment Card Form */}
                <div className="form-group mb-3">
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Credit / Debit Card</label>
                  <div className="chat-payment-card-input">
                    <div className="card-input-row">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                        <line x1="1" y1="10" x2="23" y2="10"></line>
                      </svg>
                      <input
                        type="text"
                        placeholder="4242 4242 4242 4242"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        required
                      />
                    </div>
                    <div className="card-input-subrow">
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        style={{ width: '50%' }}
                        required
                      />
                      <input
                        type="password"
                        placeholder="CVC"
                        maxLength="4"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        style={{ width: '50%' }}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="chat-payment-security-note">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <span>256-Bit SSL Encrypted Instant Reservation</span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowPayModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm btn-lg"
                  disabled={paying}
                >
                  {paying ? 'Authorizing Payment...' : `Pay $${finalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })} & Confirm`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
