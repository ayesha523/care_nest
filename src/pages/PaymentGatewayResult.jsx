import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/payment-gateway.css";

function PaymentGatewayResult({ type }) {
  const navigate = useNavigate();
  const location = useLocation();
  const tranId = new URLSearchParams(location.search).get("tranId") || "";

  const content = {
    success: {
      title: "Payment Successful",
      description: "Your booking payment is confirmed and marked as paid.",
      className: "result-success",
    },
    fail: {
      title: "Payment Failed",
      description: "Payment did not complete. You can retry from Booking History.",
      className: "result-fail",
    },
    cancel: {
      title: "Payment Cancelled",
      description: "You cancelled the payment. No amount was charged.",
      className: "result-cancel",
    },
  }[type];

  return (
    <div className="payment-gateway-page">
      <div className={`payment-gateway-card ${content.className}`}>
        <h1>{content.title}</h1>
        <p>{content.description}</p>
        {tranId && <p>Transaction: {tranId}</p>}
        <div className="payment-actions single">
          <button type="button" onClick={() => navigate("/booking-history")}>Back to Booking History</button>
        </div>
      </div>
    </div>
  );
}

export default PaymentGatewayResult;
