import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaReceipt, FaInfoCircle, FaCheck } from 'react-icons/fa';
import { getBookingPricePreview } from '../../services/bookingslot';
import '../../stylesheets/price-preview.css';

/**
 * PricePreview Component - Shows detailed booking price breakdown
 */
const PricePreview = ({
  slotId,
  date,
  time,
  duration,
  vehicle,
}) => {
  const [loading, setLoading] = useState(false);
  const [priceData, setPriceData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only fetch price data when all required fields are provided
    if (slotId && date && time && duration) {
      fetchPriceData();
    }
  }, [slotId, date, time, duration, vehicle]);

  const fetchPriceData = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getBookingPricePreview({
        slot: slotId,
        date,
        time,
        duration,
        vehicle: vehicle || undefined,
      });

      setPriceData(data);
    } catch (err) {
      console.error('Error fetching price data:', err);
      setError('Unable to calculate price. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!slotId || !date || !time || !duration) {
    return (
      <div className="price-preview-placeholder">
        <FaInfoCircle />
        <p>Complete booking details above to see pricing</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="price-preview-loading">
        <div className="spinner"></div>
        <p>Calculating price...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="price-preview-error">
        <FaInfoCircle />
        <p>{error}</p>
        <button onClick={fetchPriceData} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  if (!priceData) {
    return null;
  }

  const {
    base_price,
    discounts = [],
    surcharges = [],
    tax_amount = 0,
    total_price,
    currency = 'USD',
  } = priceData;

  return (
    <motion.div
      className="price-preview-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="price-preview-header">
        <FaReceipt className="receipt-icon" />
        <h3>Price Breakdown</h3>
      </div>

      <div className="price-preview-content">
        <div className="price-row base-price">
          <span>Base Rate</span>
          <span>{formatCurrency(base_price, currency)}</span>
        </div>

        {/* Discounts */}
        <AnimatePresence>
          {discounts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="discounts-section"
            >
              {discounts.map((discount, index) => (
                <div key={`discount-${index}`} className="price-row discount">
                  <span>{discount.description}</span>
                  <span>-{formatCurrency(discount.amount, currency)}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Surcharges */}
        <AnimatePresence>
          {surcharges.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="surcharges-section"
            >
              {surcharges.map((surcharge, index) => (
                <div key={`surcharge-${index}`} className="price-row surcharge">
                  <span>{surcharge.description}</span>
                  <span>+{formatCurrency(surcharge.amount, currency)}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tax */}
        {tax_amount > 0 && (
          <div className="price-row tax">
            <span>Tax</span>
            <span>{formatCurrency(tax_amount, currency)}</span>
          </div>
        )}

        {/* Total */}
        <div className="price-row total">
          <span>Total</span>
          <span>{formatCurrency(total_price, currency)}</span>
        </div>
      </div>

      <div className="price-preview-footer">
        <div className="guarantee">
          <FaCheck className="check-icon" />
          <span>Price guaranteed until booking confirmation</span>
        </div>
      </div>
    </motion.div>
  );
};

// Helper function to format currency
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export default PricePreview;