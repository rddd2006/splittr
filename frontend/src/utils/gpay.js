/**
 * GPay / UPI deep-link utility
 *
 * On Android / iOS: opens the native UPI chooser (GPay, PhonePe, Paytm, etc.)
 * On desktop: returns the UPI URL so the caller can show a modal / QR code.
 *
 * Usage:
 *   const result = openGPay({ upiId, name, amount, note });
 *   if (result.desktop) showModal(result.url);
 */
export function openGPay({ upiId, name, amount, note = 'SettleUp' }) {
  const url = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${Number(amount).toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isMobile) {
    window.location.href = url;
    return { desktop: false };
  }

  // Desktop — open in new tab as fallback; most browsers won't handle upi://
  // Caller should show a modal with the UPI ID + amount instead.
  window.open(url, '_blank');
  return { desktop: true, url, upiId, name, amount };
}

/** Format amount for display */
export const fmtINR = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.abs(n));
