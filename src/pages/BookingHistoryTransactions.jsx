import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import "../styles/booking-history-transactions.css";

function BookingHistoryTransactions() {
  const navigate = useNavigate();
  const { user } = useUser();

  const [bookings, setBookings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingBookingId, setPayingBookingId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [bookingFilter, setBookingFilter] = useState("all");
  const [dateWindow, setDateWindow] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [page, setPage] = useState(1);

  const userId =
    user?.id ||
    user?._id ||
    JSON.parse(localStorage.getItem("user") || "null")?.id ||
    JSON.parse(localStorage.getItem("user") || "null")?._id ||
    "";

  const resolvedRole =
    user?.role ||
    JSON.parse(localStorage.getItem("user") || "null")?.role ||
    JSON.parse(localStorage.getItem("carenest_user") || "null")?.role ||
    "";

  const isCompanion = resolvedRole === "companion";
  const activeStatuses = ["pending", "confirmed", "in-progress"];
  const pageSize = 8;

  useEffect(() => {
    const loadData = async () => {
      if (!userId) {
        setLoading(false);
        setError("Unable to detect user account.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("token") || localStorage.getItem("carenest_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [bookingResult, transactionResult] = await Promise.allSettled([
          fetch(`/api/bookings/user/${userId}`, { headers }),
          fetch("/api/payments/transactions", { headers }),
        ]);

        if (bookingResult.status !== "fulfilled") {
          throw new Error("Failed to fetch booking history");
        }

        const bookingData = await bookingResult.value.json();
        if (!bookingResult.value.ok || !bookingData.success) {
          throw new Error(bookingData.message || "Failed to fetch booking history");
        }

        const normalizedBookings = Array.isArray(bookingData.bookings) ? bookingData.bookings : [];
        normalizedBookings.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        setBookings(normalizedBookings);

        if (transactionResult.status === "fulfilled") {
          const transactionData = await transactionResult.value.json();
          if (transactionResult.value.ok && transactionData.success) {
            setTransactions(Array.isArray(transactionData.transactions) ? transactionData.transactions : []);
          } else {
            setTransactions([]);
          }
        } else {
          setTransactions([]);
        }
      } catch (err) {
        setError(err.message || "Failed to load booking and payment data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId]);

  const activePartners = useMemo(() => {
    const map = new Map();

    bookings
      .filter((booking) => activeStatuses.includes(booking.status))
      .forEach((booking) => {
        const partner = isCompanion ? booking.elderlyId : booking.companionId;
        if (!partner) return;

        const partnerId = partner._id || partner.id || `${partner.name}-${booking._id}`;
        if (map.has(partnerId)) return;

        map.set(partnerId, {
          id: partnerId,
          name: partner.name || "Unknown",
          email: partner.email || "",
          status: booking.status,
          startDate: booking.startDate,
          services: booking.services || [],
        });
      });

    return Array.from(map.values());
  }, [bookings, isCompanion]);

  const pendingPayments = useMemo(() => {
    if (isCompanion) return [];

    return bookings.filter(
      (booking) =>
        ["confirmed", "in-progress", "completed"].includes(booking.status) &&
        booking.paymentStatus !== "paid"
    );
  }, [bookings, isCompanion]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, paymentFilter, bookingFilter, dateWindow, sortBy]);

  const inDateWindow = (value) => {
    if (!value || dateWindow === "all") {
      return true;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return false;
    }

    const days = Number(dateWindow);
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - days);
    return parsed >= cutoff;
  };

  const normalizeText = (value) => String(value || "").toLowerCase();

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const base = transactions.filter((transaction) => {
      if (paymentFilter !== "all" && transaction.status !== paymentFilter) {
        return false;
      }

      if (!inDateWindow(transaction.createdAt)) {
        return false;
      }

      if (!query) {
        return true;
      }

      const partner = isCompanion ? transaction.elderlyId : transaction.companionId;
      const joinedServices = (transaction.bookingId?.services || []).join(" ");

      return [
        transaction.transactionId,
        partner?.name,
        partner?.email,
        transaction.bookingId?._id,
        joinedServices,
      ].some((item) => normalizeText(item).includes(query));
    });

    const sorted = [...base].sort((a, b) => {
      if (sortBy === "amount-desc") {
        return Number(b.amount || 0) - Number(a.amount || 0);
      }
      if (sortBy === "amount-asc") {
        return Number(a.amount || 0) - Number(b.amount || 0);
      }

      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === "date-asc" ? dateA - dateB : dateB - dateA;
    });

    return sorted;
  }, [dateWindow, isCompanion, paymentFilter, searchQuery, sortBy, transactions]);

  const filteredBookings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return bookings
      .filter((booking) => {
        if (bookingFilter !== "all" && booking.status !== bookingFilter) {
          return false;
        }

        if (!inDateWindow(booking.startDate)) {
          return false;
        }

        if (!query) {
          return true;
        }

        const partner = isCompanion ? booking.elderlyId : booking.companionId;
        const joinedServices = (booking.services || []).join(" ");

        return [
          partner?.name,
          partner?.email,
          booking._id,
          booking.status,
          booking.paymentStatus,
          joinedServices,
          booking.notes,
        ].some((item) => normalizeText(item).includes(query));
      })
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [bookingFilter, bookings, dateWindow, isCompanion, searchQuery]);

  const payableFilteredBookings = useMemo(() => {
    if (isCompanion) {
      return [];
    }

    const allowedStatuses = ["pending", "confirmed", "in-progress", "completed"];
    return filteredBookings.filter(
      (booking) =>
        allowedStatuses.includes(booking.status) &&
        booking.paymentStatus !== "paid" &&
        Number(booking.totalCost || 0) > 0
    );
  }, [filteredBookings, isCompanion]);

  const txSummary = useMemo(() => {
    const total = filteredTransactions.length;
    const successful = filteredTransactions.filter((item) => item.status === "success");
    const successfulAmount = successful.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const pendingAmount = filteredTransactions
      .filter((item) => item.status === "pending")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return {
      total,
      successRate: total === 0 ? 0 : (successful.length / total) * 100,
      avgTicket: successful.length === 0 ? 0 : successfulAmount / successful.length,
      pendingAmount,
      successfulAmount,
    };
  }, [filteredTransactions]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const paginatedTransactions = filteredTransactions.slice(pageStart, pageStart + pageSize);

  const exportTransactionsCsv = () => {
    if (filteredTransactions.length === 0) {
      return;
    }

    const rows = [
      ["Date", "Transaction ID", "Partner", "Partner Email", "Payment Status", "Booking Status", "Amount"],
      ...filteredTransactions.map((transaction) => {
        const partner = isCompanion ? transaction.elderlyId : transaction.companionId;
        return [
          new Date(transaction.createdAt).toISOString(),
          transaction.transactionId || "",
          partner?.name || "",
          partner?.email || "",
          transaction.status || "",
          transaction.bookingId?.status || "",
          Number(transaction.amount || 0).toFixed(2),
        ];
      }),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "carenest-transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totals = useMemo(() => {
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter((item) => item.status === "completed").length;
    const activeBookings = bookings.filter((item) => activeStatuses.includes(item.status)).length;
    const grossAmount = bookings.reduce((sum, item) => sum + Number(item.totalCost || 0), 0);
    const completedAmount = transactions
      .filter((item) => item.status === "success")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return {
      totalBookings,
      completedBookings,
      activeBookings,
      grossAmount,
      completedAmount,
    };
  }, [bookings, transactions]);

  const initiatePayment = async (bookingId) => {
    if (!bookingId || isCompanion) return;

    setPayingBookingId(bookingId);
    setError("");

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("carenest_token");
      const response = await fetch(`/api/payments/booking/${bookingId}/initiate`, {
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
        throw new Error(data.message || "Failed to initiate payment");
      }

      if (data.paymentUrl) {
        if (/^https?:\/\//i.test(data.paymentUrl)) {
          window.location.href = data.paymentUrl;
        } else {
          navigate(data.paymentUrl);
        }
      }
    } catch (err) {
      setError(err.message || "Payment initiation failed");
    } finally {
      setPayingBookingId("");
    }
  };

  return (
    <div className="booking-ledger-page">
      <header className="booking-ledger-hero">
        <div>
          <p className="booking-ledger-eyebrow">Booking Ledger</p>
          <h1>Booking History & Transactions</h1>
          <p>Review booking records, payments, and active care connections.</p>
        </div>
        <button
          type="button"
          className="booking-ledger-btn"
          onClick={() => navigate(isCompanion ? "/companion-dashboard" : "/elderly-dashboard")}
        >
          Back to Dashboard
        </button>
      </header>

      <section className="booking-ledger-stats">
        <article>
          <span>Total Bookings</span>
          <strong>{totals.totalBookings}</strong>
        </article>
        <article>
          <span>Active</span>
          <strong>{totals.activeBookings}</strong>
        </article>
        <article>
          <span>Completed</span>
          <strong>{totals.completedBookings}</strong>
        </article>
        <article>
          <span>{isCompanion ? "Total Earned" : "Total Spent"}</span>
          <strong>${totals.grossAmount.toFixed(2)}</strong>
        </article>
        <article>
          <span>Success Rate</span>
          <strong>{txSummary.successRate.toFixed(1)}%</strong>
        </article>
        <article>
          <span>Average Ticket</span>
          <strong>${txSummary.avgTicket.toFixed(2)}</strong>
        </article>
        <article>
          <span>Pending Amount</span>
          <strong>${txSummary.pendingAmount.toFixed(2)}</strong>
        </article>
      </section>

      <section className="booking-ledger-controls">
        <input
          type="text"
          placeholder="Search by partner, transaction id, service, notes"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)}>
          <option value="all">All payments</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
          <option value="fail">Fail</option>
          <option value="cancel">Cancel</option>
        </select>
        <select value={bookingFilter} onChange={(event) => setBookingFilter(event.target.value)}>
          <option value="all">All bookings</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="in-progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={dateWindow} onChange={(event) => setDateWindow(event.target.value)}>
          <option value="all">All time</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="180">Last 180 days</option>
        </select>
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="amount-desc">Highest amount</option>
          <option value="amount-asc">Lowest amount</option>
        </select>
        <button type="button" className="booking-ledger-btn" onClick={exportTransactionsCsv}>
          Export CSV
        </button>
      </section>

      {error && <p className="booking-ledger-empty booking-ledger-error">{error}</p>}

      <section className="booking-ledger-grid">
        <article className="booking-ledger-panel">
          <div className="booking-ledger-panel-head">
            <h2>{isCompanion ? "Currently Working With" : "Current Companion(s)"}</h2>
            <span>{activePartners.length}</span>
          </div>
          {activePartners.length === 0 ? (
            <p className="booking-ledger-empty">No active booking connections yet.</p>
          ) : (
            <div className="booking-ledger-list">
              {activePartners.map((partner) => (
                <div key={partner.id} className="booking-ledger-list-item">
                  <div>
                    <strong>{partner.name}</strong>
                    {partner.email && <p>{partner.email}</p>}
                    <p>Since {new Date(partner.startDate).toLocaleDateString()}</p>
                    <p>{partner.services.length > 0 ? partner.services.join(", ") : "General support"}</p>
                  </div>
                  <span className={`status-chip ${partner.status}`}>{partner.status}</span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="booking-ledger-panel">
          <div className="booking-ledger-panel-head">
            <h2>Transactions</h2>
            <span>${totals.completedAmount.toFixed(2)} settled</span>
          </div>

          {loading ? (
            <p className="booking-ledger-empty">Loading transactions...</p>
          ) : filteredTransactions.length === 0 ? (
            <p className="booking-ledger-empty">No transactions available yet.</p>
          ) : (
            <>
            <div className="booking-ledger-table-wrap">
              <table className="booking-ledger-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Transaction</th>
                    <th>{isCompanion ? "Elderly Client" : "Companion"}</th>
                    <th>Payment</th>
                    <th>Booking</th>
                    <th>{isCompanion ? "Earned" : "Spent"}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((transaction) => {
                    const partner = isCompanion ? transaction.elderlyId : transaction.companionId;
                    return (
                      <tr key={transaction._id}>
                        <td>{new Date(transaction.createdAt).toLocaleDateString()}</td>
                        <td>{String(transaction.transactionId || "").slice(0, 10)}</td>
                        <td>{partner?.name || "Unknown"}</td>
                        <td>
                          <span className={`status-chip ${transaction.status}`}>{transaction.status}</span>
                        </td>
                        <td>
                          <span className={`status-chip ${transaction.bookingId?.status || "pending"}`}>
                            {transaction.bookingId?.status || "unknown"}
                          </span>
                        </td>
                        <td>${Number(transaction.amount || 0).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="ledger-pagination">
              <span>
                Showing {pageStart + 1}-{Math.min(pageStart + pageSize, filteredTransactions.length)} of {filteredTransactions.length}
              </span>
              <div>
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={safePage === 1}
                >
                  Prev
                </button>
                <span>Page {safePage} / {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={safePage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
            </>
          )}
        </article>
      </section>

      <section className="booking-ledger-panel booking-ledger-payment-panel">
        <div className="booking-ledger-panel-head">
          <h2>Booking Timeline</h2>
          <span>{filteredBookings.length}</span>
        </div>

        {loading ? (
          <p className="booking-ledger-empty">Loading booking timeline...</p>
        ) : filteredBookings.length === 0 ? (
          <p className="booking-ledger-empty">No bookings found for current filters.</p>
        ) : (
          <div className="booking-ledger-table-wrap">
            <table className="booking-ledger-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>{isCompanion ? "Elderly Client" : "Companion"}</th>
                  <th>Services</th>
                  <th>Booking</th>
                  <th>Payment</th>
                  <th>Amount</th>
                  {!isCompanion && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => {
                  const partner = isCompanion ? booking.elderlyId : booking.companionId;
                  const canPay =
                    !isCompanion &&
                    ["pending", "confirmed", "in-progress", "completed"].includes(booking.status) &&
                    booking.paymentStatus !== "paid" &&
                    Number(booking.totalCost || 0) > 0;
                  return (
                    <tr key={booking._id}>
                      <td>{new Date(booking.startDate).toLocaleDateString()}</td>
                      <td>{partner?.name || "Unknown"}</td>
                      <td>{booking.services?.length ? booking.services.join(", ") : "General support"}</td>
                      <td>
                        <span className={`status-chip ${booking.status}`}>{booking.status}</span>
                      </td>
                      <td>
                        <span className={`status-chip ${booking.paymentStatus || "pending"}`}>
                          {booking.paymentStatus || "pending"}
                        </span>
                      </td>
                      <td>${Number(booking.totalCost || 0).toFixed(2)}</td>
                      {!isCompanion && (
                        <td>
                          {canPay ? (
                            <button
                              type="button"
                              className="pay-inline-btn"
                              disabled={payingBookingId === booking._id}
                              onClick={() => initiatePayment(booking._id)}
                            >
                              {payingBookingId === booking._id ? "Starting..." : "Pay Now"}
                            </button>
                          ) : (
                            <span className="muted-note">-</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {!isCompanion && (
        <section className="booking-ledger-panel booking-ledger-payment-panel">
          <div className="booking-ledger-panel-head">
            <h2>Pending Booking Payments</h2>
            <span>{payableFilteredBookings.length}</span>
          </div>

          {payableFilteredBookings.length === 0 ? (
            <p className="booking-ledger-empty">No pending booking payments.</p>
          ) : (
            <div className="booking-ledger-list">
              {payableFilteredBookings.map((booking) => (
                <div key={booking._id} className="booking-ledger-list-item">
                  <div>
                    <strong>{booking.companionId?.name || "Companion"}</strong>
                    <p>{new Date(booking.startDate).toLocaleDateString()}</p>
                    <p>{booking.services?.length ? booking.services.join(", ") : "General support"}</p>
                    <p>Amount: ${Number(booking.totalCost || 0).toFixed(2)}</p>
                  </div>
                  <button
                    type="button"
                    className="booking-ledger-btn pay-now-btn"
                    disabled={payingBookingId === booking._id}
                    onClick={() => initiatePayment(booking._id)}
                  >
                    {payingBookingId === booking._id ? "Starting..." : "Pay Now"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default BookingHistoryTransactions;
