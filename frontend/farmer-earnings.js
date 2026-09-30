/**
 * farmer-earnings.js
 * MilletVerse Farmer Dashboard — Earnings & Payout History section
 */

const EARNINGS_API = 'http://localhost:5000/api';

async function renderEarnings() {
    const el = document.getElementById('content-area');
    el.innerHTML = `<div style="text-align:center;padding:60px;color:#8b736b;">
        <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem;margin-bottom:16px;display:block;"></i>
        <p style="font-size:0.7rem;font-weight:900;letter-spacing:0.15em;text-transform:uppercase;">Loading Earnings...</p>
    </div>`;

    let summary = {}, history = [];

    try {
        const token = localStorage.getItem('milletToken');
        if (!token) { el.innerHTML = '<p style="padding:40px;color:#ef4444;font-weight:700;">Please log in to view earnings.</p>'; return; }

        const res = await fetch(`${EARNINGS_API}/payments/farmer/earnings`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (res.ok) {
            const d = await res.json();
            summary = d.data?.summary || {};
            history = d.data?.payout_history || [];
        }
    } catch (e) {
        console.warn('Earnings data unavailable:', e.message);
    }

    const fmt = v => `\u20b9${parseFloat(v || 0).toFixed(2)}`;

    const statsCards = [
        { label: 'Total Sales', color: '#10b981', icon: 'fa-coins', val: fmt(summary.total_sales) },
        { label: 'Commission Deducted', color: '#f59e0b', icon: 'fa-percent', val: fmt(summary.total_commission_deducted) },
        { label: 'Net Earnings', color: '#3b82f6', icon: 'fa-wallet', val: fmt(summary.total_net_earnings) },
        { label: 'Pending Payout', color: '#8b5cf6', icon: 'fa-clock', val: fmt(summary.pending_payout) },
        { label: 'Completed Payout', color: '#059669', icon: 'fa-check-circle', val: fmt(summary.completed_payout) },
        { label: 'Failed Payout', color: '#ef4444', icon: 'fa-times-circle', val: fmt(summary.failed_payout) }
    ].map(s => `
        <div class="card" style="padding:28px;">
            <div style="width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:14px;background:${s.color}15;">
                <i class="fa-solid ${s.icon}" style="color:${s.color};"></i>
            </div>
            <p style="font-size:0.55rem;font-weight:900;letter-spacing:0.15em;text-transform:uppercase;color:#8b736b;margin-bottom:4px;">${s.label}</p>
            <p style="font-family:'Outfit',sans-serif;font-weight:900;font-size:1.6rem;color:#2c1810;">${s.val}</p>
        </div>`).join('');

    const statusColors = {
        payout_pending: '#f59e0b', payout_processing: '#3b82f6',
        payout_completed: '#10b981', payout_failed: '#ef4444',
        refund_pending: '#8b5cf6', refunded: '#7c3aed'
    };

    const tableRows = history.length
        ? history.map(h => {
            const c = statusColors[h.payout_status] || '#64748b';
            return `
            <tr style="border-bottom:1px solid #f0ebe4;">
                <td style="padding:14px 12px;font-family:monospace;font-size:0.75rem;color:#8b736b;">#${h.order_id}</td>
                <td style="padding:14px 12px;font-weight:700;color:#2c1810;">${h.product_name || '\u2014'}</td>
                <td style="padding:14px 12px;font-weight:800;color:#2c1810;">${fmt(h.product_amount)}</td>
                <td style="padding:14px 12px;font-weight:800;color:#f59e0b;">${fmt(h.admin_commission)}</td>
                <td style="padding:14px 12px;font-weight:900;color:#10b981;">${fmt(h.seller_amount)}</td>
                <td style="padding:14px 12px;">
                    <span style="display:inline-block;padding:4px 12px;border-radius:999px;font-size:0.6rem;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;background:${c}15;color:${c};border:1px solid ${c}30;">${h.payout_status.replace(/_/g, ' ')}</span>
                </td>
                <td style="padding:14px 12px;font-size:0.75rem;color:#8b736b;">${h.payment_date ? new Date(h.payment_date).toLocaleDateString('en-IN') : '\u2014'}</td>
            </tr>`;
        }).join('')
        : `<tr><td colspan="7" style="padding:40px;text-align:center;font-weight:700;color:#8b736b;">No payout records yet. Sales made through Razorpay will appear here.</td></tr>`;

    el.innerHTML = `
    <div style="margin-bottom:32px;">
        <h1 style="font-family:'Outfit',sans-serif;font-size:2.3rem;font-weight:900;color:#2c1810;line-height:1.1;">My Earnings</h1>
        <p style="font-size:0.78rem;font-weight:700;color:#8b736b;margin-top:6px;text-transform:uppercase;letter-spacing:0.12em;">Platform commission breakdown &amp; payout history</p>
    </div>

    <!-- Stats Grid -->
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;margin-bottom:36px;">
        ${statsCards}
    </div>

    <!-- Example Breakdown -->
    <div class="card" style="padding:28px;margin-bottom:36px;background:linear-gradient(135deg,#faf7f2,#fff8f0);">
        <p style="font-size:0.55rem;font-weight:900;letter-spacing:0.15em;text-transform:uppercase;color:#d4a373;margin-bottom:10px;">How it works</p>
        <p style="font-weight:700;color:#2c1810;line-height:1.8;">
            When a consumer buys your product for <strong>\u20b9500</strong>, the platform deducts a commission (e.g. 10%):<br>
            \u2192 Platform Commission: <span style="color:#f59e0b;font-weight:900;">\u20b950</span><br>
            \u2192 Your Earnings: <span style="color:#10b981;font-weight:900;">\u20b9450</span>
        </p>
    </div>

    <!-- Payout History Table -->
    <div class="card" style="padding:0;overflow:hidden;">
        <div style="padding:28px 28px 0;">
            <h3 style="font-family:'Outfit',sans-serif;font-weight:900;font-size:1.15rem;color:#2c1810;">Payout History</h3>
        </div>
        <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:0.82rem;">
                <thead>
                    <tr style="border-bottom:2px solid #e8e0d8;">
                        <th style="padding:14px 12px;text-align:left;font-size:0.6rem;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;color:#8b736b;">Order</th>
                        <th style="padding:14px 12px;text-align:left;font-size:0.6rem;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;color:#8b736b;">Product</th>
                        <th style="padding:14px 12px;text-align:left;font-size:0.6rem;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;color:#8b736b;">Sale Amt</th>
                        <th style="padding:14px 12px;text-align:left;font-size:0.6rem;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;color:#8b736b;">Commission</th>
                        <th style="padding:14px 12px;text-align:left;font-size:0.6rem;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;color:#8b736b;">Net Amt</th>
                        <th style="padding:14px 12px;text-align:left;font-size:0.6rem;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;color:#8b736b;">Status</th>
                        <th style="padding:14px 12px;text-align:left;font-size:0.6rem;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;color:#8b736b;">Date</th>
                    </tr>
                </thead>
                <tbody>${tableRows}</tbody>
            </table>
        </div>
    </div>`;
}
