import React from 'react';
import httpClient from '../../services/httpClient';

const RazorpayPayment = () => {
  const handlePayment = async () => {
    const response = await httpClient.post('/payments/create-order/');
    const order = await response.data;

    const options = {
      key: 'your_razorpay_key_id', // Enter the Key ID generated from the Dashboard
      amount: order.amount,
      currency: order.currency,
      name: 'Car Parking System',
      description: 'Test Transaction',
      order_id: order.id,
      handler: function (response) {
        alert(response.razorpay_payment_id);
        alert(response.razorpay_order_id);
        alert(response.razorpay_signature);
      },
      prefill: {
        name: 'Test User',
        email: 'test.user@example.com',
        contact: '9999999999',
      },
    };
    const rzp1 = new window.Razorpay(options);
    rzp1.open();
  };

  return (
    <div>
      <h2>Razorpay Payment</h2>
      <button onClick={handlePayment}>Pay with Razorpay</button>
    </div>
  );
};

export default RazorpayPayment;
