const express = require("express");
const mongoose = require("mongoose");
const SSLCommerzPayment = require("sslcommerz-lts");
const Booking = require("../models/Booking");
const PaymentTransaction = require("../models/PaymentTransaction");
const { protect } = require("../middleware/auth");

const router = express.Router();

const gatewayMode = (process.env.PAYMENT_GATEWAY_MODE || "mock").toLowerCase();
const sslIsLive = String(process.env.SSL_IS_LIVE || "false").toLowerCase() === "true";
const sslStoreId = process.env.SSL_STORE_ID || "";
const sslStorePassword = process.env.SSL_STORE_PASSWORD || "";
const serverBaseUrl = (process.env.SERVER_PUBLIC_URL || "http://localhost:5000").replace(/\/$/, "");
const clientBaseUrl = (process.env.CLIENT_URL || "http://localhost:3000").replace(/\/$/, "");
const isSslMode = gatewayMode === "sslcommerz";

const getPartnerName = (booking, role) => {
  if (role === "elderly") {
    return booking.companionId?.name || "Companion";
  }
  return booking.elderlyId?.name || "Elderly Member";
};

const BOOKING_STATUSES_PAYABLE = ["confirmed", "in-progress", "completed"];

const finalizeTransaction = async (tranId, status) => {
  const transaction = await PaymentTransaction.findOne({ transactionId: tranId });
  if (!transaction) {
    return null;
  }

  if (status === "success") {
    const booking = await Booking.findById(transaction.bookingId);
    if (!booking || !BOOKING_STATUSES_PAYABLE.includes(booking.status)) {
      transaction.status = "fail";
      await transaction.save();
      return transaction;
    }

    transaction.status = "success";
    transaction.paidAt = new Date();
    await transaction.save();
    await Booking.findByIdAndUpdate(transaction.bookingId, { paymentStatus: "paid" });
    return transaction;
  }

  transaction.status = status;
  await transaction.save();
  return transaction;
};

router.post("/booking/:bookingId/initiate", protect, async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ success: false, message: "Invalid booking id" });
    }

    const booking = await Booking.findById(bookingId)
      .populate("elderlyId", "name email")
      .populate("companionId", "name email");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (String(booking.elderlyId?._id || booking.elderlyId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "Only elderly can initiate payment for this booking" });
    }

    if (booking.paymentStatus === "paid") {
      return res.status(400).json({ success: false, message: "Booking is already paid" });
    }

    if (!BOOKING_STATUSES_PAYABLE.includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: "Payment is allowed only after companion accepts the booking",
      });
    }

    const amount = Number(booking.totalCost || 0);
    if (amount <= 0) {
      return res.status(400).json({ success: false, message: "Booking amount is invalid for payment" });
    }

    const transactionId = new mongoose.Types.ObjectId().toString();

    const transaction = await PaymentTransaction.create({
      transactionId,
      bookingId: booking._id,
      elderlyId: booking.elderlyId?._id || booking.elderlyId,
      companionId: booking.companionId?._id || booking.companionId,
      amount,
      status: "pending",
      gateway: isSslMode ? "sslcommerz" : "mock-sslcommerz",
    });

    if (isSslMode && (!sslStoreId || !sslStorePassword)) {
      transaction.status = "fail";
      await transaction.save();
      return res.status(500).json({
        success: false,
        message: "SSLCommerz mode is enabled but SSL_STORE_ID/SSL_STORE_PASSWORD are missing",
      });
    }

    if (isSslMode) {
      const sslData = {
        total_amount: amount,
        currency: "BDT",
        tran_id: transactionId,
        success_url: `${serverBaseUrl}/api/payments/callback/success/${transactionId}`,
        fail_url: `${serverBaseUrl}/api/payments/callback/fail/${transactionId}`,
        cancel_url: `${serverBaseUrl}/api/payments/callback/cancel/${transactionId}`,
        ipn_url: `${serverBaseUrl}/api/payments/callback/success/${transactionId}`,
        shipping_method: "Care Service",
        product_name: `Booking ${booking._id}`,
        product_category: "Home Care",
        product_profile: "general",
        cus_name: booking.elderlyId?.name || "Elderly User",
        cus_email: booking.elderlyId?.email || "elderly@example.com",
        cus_add1: "CareNest",
        cus_add2: "CareNest",
        cus_city: "Dhaka",
        cus_state: "Dhaka",
        cus_postcode: "1000",
        cus_country: "Bangladesh",
        cus_phone: "01711111111",
        ship_name: getPartnerName(booking, "elderly"),
        ship_add1: "CareNest Service",
        ship_city: "Dhaka",
        ship_country: "Bangladesh",
      };

      const sslcz = new SSLCommerzPayment(sslStoreId, sslStorePassword, sslIsLive);
      const gatewayResponse = await sslcz.init(sslData);

      if (gatewayResponse?.status !== "SUCCESS" || !gatewayResponse?.GatewayPageURL) {
        transaction.status = "fail";
        await transaction.save();
        return res.status(400).json({ success: false, message: "Payment gateway initialization failed" });
      }

      return res.status(201).json({
        success: true,
        transaction,
        paymentUrl: gatewayResponse.GatewayPageURL,
        mode: "sslcommerz",
      });
    }

    return res.status(201).json({
      success: true,
      transaction,
      paymentUrl: `/payment-gateway/checkout/${transaction.transactionId}`,
      mode: "mock",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/:tranId/success", protect, async (req, res) => {
  try {
    const { tranId } = req.params;
    const transaction = await PaymentTransaction.findOne({ transactionId: tranId });

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    if (String(transaction.elderlyId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "Unauthorized payment confirmation" });
    }

    const updated = await finalizeTransaction(tranId, "success");
    return res.status(200).json({ success: true, message: "Payment successful", transaction: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/:tranId/fail", protect, async (req, res) => {
  try {
    const { tranId } = req.params;
    const transaction = await PaymentTransaction.findOne({ transactionId: tranId });

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    if (String(transaction.elderlyId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "Unauthorized payment action" });
    }

    const updated = await finalizeTransaction(tranId, "fail");
    return res.status(200).json({ success: true, message: "Payment marked as failed", transaction: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/:tranId/cancel", protect, async (req, res) => {
  try {
    const { tranId } = req.params;
    const transaction = await PaymentTransaction.findOne({ transactionId: tranId });

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    if (String(transaction.elderlyId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "Unauthorized payment action" });
    }

    const updated = await finalizeTransaction(tranId, "cancel");
    return res.status(200).json({ success: true, message: "Payment cancelled", transaction: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

const callbackSuccess = async (req, res) => {
  try {
    const { tranId } = req.params;
    await finalizeTransaction(tranId, "success");
    return res.redirect(`${clientBaseUrl}/payment-gateway/success?tranId=${encodeURIComponent(tranId)}`);
  } catch (error) {
    return res.redirect(`${clientBaseUrl}/payment-gateway/fail?tranId=${encodeURIComponent(tranId)}`);
  }
};

const callbackFail = async (req, res) => {
  try {
    const { tranId } = req.params;
    await finalizeTransaction(tranId, "fail");
    return res.redirect(`${clientBaseUrl}/payment-gateway/fail?tranId=${encodeURIComponent(tranId)}`);
  } catch (error) {
    return res.redirect(`${clientBaseUrl}/payment-gateway/fail?tranId=${encodeURIComponent(tranId)}`);
  }
};

const callbackCancel = async (req, res) => {
  try {
    const { tranId } = req.params;
    await finalizeTransaction(tranId, "cancel");
    return res.redirect(`${clientBaseUrl}/payment-gateway/cancel?tranId=${encodeURIComponent(tranId)}`);
  } catch (error) {
    return res.redirect(`${clientBaseUrl}/payment-gateway/cancel?tranId=${encodeURIComponent(tranId)}`);
  }
};

router.post("/callback/success/:tranId", callbackSuccess);
router.get("/callback/success/:tranId", callbackSuccess);
router.post("/callback/fail/:tranId", callbackFail);
router.get("/callback/fail/:tranId", callbackFail);
router.post("/callback/cancel/:tranId", callbackCancel);
router.get("/callback/cancel/:tranId", callbackCancel);

router.get("/transactions", protect, async (req, res) => {
  try {
    const query = req.user.role === "companion"
      ? { companionId: req.user.id }
      : { elderlyId: req.user.id };

    const transactions = await PaymentTransaction.find(query)
      .populate("bookingId", "startDate endDate status paymentStatus services totalCost")
      .populate("elderlyId", "name email")
      .populate("companionId", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, transactions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
