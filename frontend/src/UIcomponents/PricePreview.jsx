import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaInfoCircle, FaCalculator, FaChevronDown, FaReceipt, FaTag } from 'react-icons/fa';
import '../stylesheets/price-preview.css';

/**
 * PricePreview - Advanced booking price breakdown component
 * Shows detailed calculation of booking costs with animations
 * 
 * @param {Object} props
 * @param {Date} props.startDate - Booking start date
 * @param {Date} props.endDate - Booking end date 
 * @param {number} props.duration - Duration in hours
 * @param {number} props.baseRate - Base hourly rate
 * @param {Object} props.discounts - Applied discounts
 * @param {Object} props.surcharges - Applied surcharges
 * @param {boolean} props.isLoading - Whether prices are being calculated
 * @param {string} props.parkingType - Type of parking (standard, premium, etc)
 */
export default function PricePreview({
  startDate = new Date(),
  endDate = new Date(),
  duration = 2,
  baseRate = 5.00,
  discounts = {},
  surcharges = {},
  isLoading = false,
  parkingType = 'standard'
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  const [breakdownVisible, setBreakdownVisible] = useState(false);

  // Calculate the total cost whenever inputs change
  useEffect(() => {
    calculateTotalCost();
  }, [startDate, endDate, duration, baseRate, discounts, surcharges, parkingType]);

  const calculateTotalCost = () => {
    // Base calculation
    let total = baseRate * duration;
    
    // Apply surcharges
    Object.values(surcharges).forEach(surcharge => {
      if (surcharge.type === 'percentage') {
        total += total * (surcharge.value / 100);
      } else {
        total += surcharge.value;
      }
    });
    
    // Apply discounts
    Object.values(discounts).forEach(discount => {
      if (discount.type === 'percentage') {
        total -= total * (discount.value / 100);
      } else {
        total -= discount.value;
      }
    });
    
    // Ensure minimum charge
    total = Math.max(0, total);
    
    setTotalCost(total);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getParkingTypeLabel = () => {
    const labels = {
      'standard': 'Standard Parking',
      'premium': 'Premium Parking',
      'accessible': 'Accessible Parking',
      'ev_charging': 'EV Charging Station',
      'covered': 'Covered Parking'
    };
    
    return labels[parkingType] || 'Parking';
  };

  const getTotalDuration = () => {
    if (!startDate || !endDate) return '0 hours';
    
    const durationMs = endDate.getTime() - startDate.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours === 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (minutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  };

  // Get total discount amount
  const getTotalDiscounts = () => {
    let totalDiscount = 0;
    Object.values(discounts).forEach(discount => {
      if (discount.type === 'percentage') {
        totalDiscount += (baseRate * duration) * (discount.value / 100);
      } else {
        totalDiscount += discount.value;
      }
    });
    return totalDiscount;
  };

  // Get total surcharge amount
  const getTotalSurcharges = () => {
    let totalSurcharge = 0;
    Object.values(surcharges).forEach(surcharge => {
      if (surcharge.type === 'percentage') {
        totalSurcharge += (baseRate * duration) * (surcharge.value / 100);
      } else {
        totalSurcharge += surcharge.value;
      }
    });
    return totalSurcharge;
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.div 
      className="price-preview"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <h3 className="price-preview-title">
        <FaCalculator className="price-preview-icon" />
        Price Breakdown
      </h3>
      
      {/* Summary Section */}
      <motion.div 
        className="price-summary"
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ backgroundColor: "#f0f9ff" }}
      >
        <div className="price-summary-left">
          <div className="parking-type">{getParkingTypeLabel()}</div>
          <div className="parking-duration">{getTotalDuration()}</div>
        </div>
        <div className="price-summary-right">
          {isLoading ? (
            <motion.div 
              className="price-loading"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              Calculating...
            </motion.div>
          ) : (
            <div className="total-price">{formatCurrency(totalCost)}</div>
          )}
          <motion.div 
            className={`expand-icon ${isExpanded ? 'expanded' : ''}`}
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <FaChevronDown />
          </motion.div>
        </div>
      </motion.div>
      
      {/* Detailed Breakdown */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            className="price-breakdown"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Base Rate */}
            <motion.div 
              className="breakdown-item"
              variants={itemVariants}
            >
              <div className="item-label">Base Rate</div>
              <div className="item-value">
                {formatCurrency(baseRate)} × {duration} {duration === 1 ? 'hour' : 'hours'}
              </div>
              <div className="item-total">
                {formatCurrency(baseRate * duration)}
              </div>
            </motion.div>
            
            {/* Surcharges */}
            {Object.entries(surcharges).length > 0 && (
              <motion.div variants={itemVariants}>
                <div className="breakdown-section-title">Surcharges</div>
                {Object.entries(surcharges).map(([key, surcharge]) => (
                  <div key={key} className="breakdown-item surcharge-item">
                    <div className="item-label">{surcharge.label}</div>
                    <div className="item-value">
                      {surcharge.type === 'percentage' 
                        ? `${surcharge.value}%` 
                        : formatCurrency(surcharge.value)
                      }
                    </div>
                    <div className="item-total">
                      {surcharge.type === 'percentage'
                        ? formatCurrency((baseRate * duration) * (surcharge.value / 100))
                        : formatCurrency(surcharge.value)
                      }
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
            
            {/* Discounts */}
            {Object.entries(discounts).length > 0 && (
              <motion.div variants={itemVariants}>
                <div className="breakdown-section-title">
                  <FaTag className="discount-icon" /> 
                  Discounts
                </div>
                {Object.entries(discounts).map(([key, discount]) => (
                  <div key={key} className="breakdown-item discount-item">
                    <div className="item-label">{discount.label}</div>
                    <div className="item-value">
                      {discount.type === 'percentage' 
                        ? `${discount.value}%` 
                        : formatCurrency(discount.value)
                      }
                    </div>
                    <div className="item-total discount-amount">
                      -{discount.type === 'percentage'
                        ? formatCurrency((baseRate * duration) * (discount.value / 100))
                        : formatCurrency(discount.value)
                      }
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
            
            {/* Total */}
            <motion.div 
              className="breakdown-total"
              variants={itemVariants}
            >
              <div className="total-label">Total</div>
              <div className="total-value">{formatCurrency(totalCost)}</div>
            </motion.div>
            
            {/* Footer Notes */}
            <motion.div 
              className="breakdown-footer"
              variants={itemVariants}
            >
              <FaInfoCircle className="info-icon" />
              <span>Prices may vary based on demand and availability</span>
            </motion.div>
            
            {/* Receipt Button */}
            <motion.button 
              className="preview-receipt-button"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setBreakdownVisible(true)}
            >
              <FaReceipt style={{ marginRight: '8px' }} />
              Preview Receipt
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Receipt Modal */}
      {breakdownVisible && (
        <motion.div 
          className="receipt-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setBreakdownVisible(false)}
        >
          <motion.div 
            className="receipt-modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="receipt-header">
              <h4>Parking Receipt Preview</h4>
              <button 
                className="close-receipt"
                onClick={() => setBreakdownVisible(false)}
              >
                ×
              </button>
            </div>
            <div className="receipt-content">
              <div className="receipt-logo">PARKING SYSTEM</div>
              <div className="receipt-details">
                <div className="receipt-row">
                  <span>Date:</span>
                  <span>{startDate.toLocaleDateString()}</span>
                </div>
                <div className="receipt-row">
                  <span>Time:</span>
                  <span>{startDate.toLocaleTimeString()} - {endDate.toLocaleTimeString()}</span>
                </div>
                <div className="receipt-row">
                  <span>Duration:</span>
                  <span>{getTotalDuration()}</span>
                </div>
                <div className="receipt-row">
                  <span>Type:</span>
                  <span>{getParkingTypeLabel()}</span>
                </div>
              </div>
              <div className="receipt-charges">
                <div className="receipt-row">
                  <span>Base Rate:</span>
                  <span>{formatCurrency(baseRate * duration)}</span>
                </div>
                {Object.entries(surcharges).length > 0 && (
                  <>
                    <div className="receipt-subheader">Surcharges:</div>
                    {Object.entries(surcharges).map(([key, surcharge]) => (
                      <div key={key} className="receipt-row">
                        <span>{surcharge.label}:</span>
                        <span>
                          {surcharge.type === 'percentage'
                            ? formatCurrency((baseRate * duration) * (surcharge.value / 100))
                            : formatCurrency(surcharge.value)
                          }
                        </span>
                      </div>
                    ))}
                  </>
                )}
                {Object.entries(discounts).length > 0 && (
                  <>
                    <div className="receipt-subheader">Discounts:</div>
                    {Object.entries(discounts).map(([key, discount]) => (
                      <div key={key} className="receipt-row">
                        <span>{discount.label}:</span>
                        <span className="discount-amount">
                          -{discount.type === 'percentage'
                            ? formatCurrency((baseRate * duration) * (discount.value / 100))
                            : formatCurrency(discount.value)
                          }
                        </span>
                      </div>
                    ))}
                  </>
                )}
                <div className="receipt-divider"></div>
                <div className="receipt-row total-row">
                  <span>Total:</span>
                  <span>{formatCurrency(totalCost)}</span>
                </div>
              </div>
              <div className="receipt-footer">
                <p>Thank you for choosing our parking service!</p>
                <div className="receipt-id">Receipt #: PREVIEW-{Math.floor(Math.random() * 10000)}</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}