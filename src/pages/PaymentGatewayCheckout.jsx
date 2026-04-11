import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "../context/UserContext";
import "../styles/payment-gateway.css";

function PaymentGatewayCheckout() {
  const navigate = useNavigate();
  const { tranId } = useParams();
  const { user } = useUser();
  const [submitting, setSubmitting] = useState("");
  const [error, setError] = useState("");

  const completeAction = async (action) => {
    setSubmitting(action);
    setError("");

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("carenest_token");
      const response = await fetch(`/api/payments/${tranId}/${action}`, {
        method: "POST",
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            }
          : { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Payment request failed");
      }

      navigate(`/payment-gateway/${action}?tranId=${encodeURIComponent(tranId)}`);
    } catch (err) {
      setError(err.message || "Unable to process payment action");
    } finally {
      setSubmitting("");
    }
  };

  return (
    <div className="payment-gateway-page">
      <div className="payment-gateway-card">
        <p className="payment-gateway-label">Mock SSLCommerz Gateway</p>
        <h1>Secure Payment Checkout</h1>
        <p>
          Transaction: <strong>{tranId}</strong>
        </p>
        <p>
          Account: <strong>{user?.name || "Elderly User"}</strong>
        </p>

        {error && <p className="payment-error">{error}</p>}

        <div className="payment-actions">
          <button
            type="button"
            className="pay-success"
            onClick={() => completeAction("success")}
            disabled={Boolean(submitting)}
          >
            {submitting === "success" ? "Processing..." : "Pay Successfully"}
          </button>
          <button
            type="button"
            className="pay-fail"
            onClick={() => completeAction("fail")}
            disabled={Boolean(submitting)}
          >
            {submitting === "fail" ? "Processing..." : "Simulate Fail"}
          </button>
          <button
            type="button"
            className="pay-cancel"
            onClick={() => completeAction("cancel")}
            disabled={Boolean(submitting)}
          >
            {submitting === "cancel" ? "Processing..." : "Cancel Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentGatewayCheckout;
