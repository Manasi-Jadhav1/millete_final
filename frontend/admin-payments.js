/**
 * admin-payments.js
 * MilletVerse Admin — Payments & Commission section
 * Sourced by admin-dashboard.html
 */

const PAYMENT_API = 'http://localhost:5000/api';

async function renderPayments() {
    const el = document.getElementById('admin-main');
    let summary = {}, commissionPct = 10, recentTxns = [];

    try {
        const [sumRes, comRes] = await Promise.all([
            fetch(`${PAYMENT_API}/payments/admin/summary`,    { headers: hdrs() }),
            fetch(`${PAYMENT_API}/payments/admin/commission`, { headers: hdrs() })
        ]);
        if (sumRes.ok) {
            const d = await sumRes.json();
            summary    = d.data || {};
            recentTxns = summary.recent_transactions || [];
        }
        if (comRes.ok) {
            const d = await comRes.json();
            commissionPct = d.data?.commission_pct ?? 10;
        }
    } catch(e) {
        console.warn('Payment stats unavailable (backend offline?):', e.message);
    }

    const fmt = v => `\u20b9${parseFloat(v || 0).toFixed(2)}`;
    const cs  = summary.commission_stats || {};
    const ps  = summary.payment_stats    || {};

    const statsCards = [
        { label: 'Total Sales',          icon: 'fa-coins',            color: '#10b981', val: fmt(cs.total_sales) },
        { label: 'Platform Commission',  icon: 'fa-percent',          color: '#f59e0b', val: fmt(cs.total_platform_commission) },
        { label: 'Seller Payouts',       icon: 'fa-tractor',          color: '#3b82f6', val: fmt(cs.total_seller_payouts) },
        { label: 'Pending Payouts',      icon: 'fa-clock',            color: '#ef4444', val: fmt(cs.pending_payouts) }
    ].map(s => `
        <div class="admin-card p-6">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style="background:${s.color}20;">
                <i class="fa-solid ${s.icon}" style="color:${s.color};"></i>
            </div>
            <p class="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">${s.label}</p>
            <p class="font-heading font-black text-2xl text-white">${s.val}</p>
        </div>`).join('');

    const payoutCards = [
        { label: 'Completed',          color: '#10b981', val: fmt(cs.completed_payouts) },
        { label: 'Pending',            color: '#f59e0b', val: fmt(cs.pending_payouts) },
        { label: 'Failed',             color: '#ef4444', val: fmt(cs.failed_payouts) },
        { label: 'Refunded',           color: '#8b5cf6', val: fmt(cs.refunded_payouts) },
        { label: 'Failed Txns',        color: '#dc2626', val: ps.failed_count || 0 },
        { label: 'Refunded Txns',      color: '#7c3aed', val: ps.refunded_count || 0 }
    ].map(s => `
        <div class="p-4 rounded-xl" style="background:#0f172a;border:1px solid #334155;">
            <p class="text-[10px] font-black uppercase tracking-widest mb-1" style="color:${s.color};">${s.label}</p>
            <p class="font-heading font-black text-xl" style="color:${s.color};">${s.val}</p>
        </div>`).join('');

    const statusColors = {
        payment_success: '#10b981', payment_failed: '#ef4444',
        pending: '#f59e0b', payment_initiated: '#3b82f6', refunded: '#8b5cf6'
    };
    const txnRows = recentTxns.length
        ? recentTxns.map(t => {
            const c = statusColors[t.payment_status] || '#64748b';
            return `
            <tr class="table-row">
                <td class="py-3 pr-4 font-mono text-slate-400 text-xs">#${t.id}</td>
                <td class="py-3 pr-4 font-bold text-white">${t.consumer_name || '&mdash;'}</td>
                <td class="py-3 pr-4 font-black text-emerald-400">\u20b9${parseFloat(t.total_amount).toFixed(2)}</td>
                <td class="py-3 pr-4 font-mono text-slate-500 text-xs">${t.razorpay_payment_id || '&mdash;'}</td>
                <td class="py-3 pr-4">
                    <span class="abadge" style="background:${c}20;color:${c};border:1px solid ${c}40;">${t.payment_status}</span>
                </td>
                <td class="py-3 text-slate-400 text-xs">${new Date(t.created_at).toLocaleDateString('en-IN')}</td>
            </tr>`;
        }).join('')
        : `<tr><td colspan="6" class="py-8 text-center text-slate-500 font-bold">No transactions recorded yet</td></tr>`;

    el.innerHTML = `
    <div class="space-y-8">
        <div class="flex items-center justify-between">
            <div>
                <h2 class="font-heading font-black text-3xl text-white">Payments &amp; Commission</h2>
                <p class="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Platform payment split management</p>
            </div>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">${statsCards}</div>

        <div class="admin-card p-8">
            <h3 class="font-heading font-black text-xl text-white mb-6 flex items-center gap-3">
                <span class="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <i class="fa-solid fa-percent text-amber-400 text-sm"></i>
                </span>
                Platform Commission Rate
            </h3>
            <div class="flex items-end gap-6 flex-wrap">
                <div>
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Commission %</p>
                    <div class="flex items-center gap-3">
                        <input id="commission-input" type="number" min="0" max="100" step="0.5"
                            value="${commissionPct}"
                            class="w-28 px-4 py-3 rounded-xl font-black text-2xl text-white"
                            style="background:#0f172a;border:2px solid #334155;outline:none;"
                            oninput="previewCommission(this.value)">
                        <span class="text-2xl font-black text-slate-400">%</span>
                    </div>
                </div>
                <div class="admin-card p-4 flex-1 min-w-[200px]">
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Example on \u20b9500 sale</p>
                    <p id="commission-preview" class="text-sm font-bold text-white">—</p>
                </div>
                <button onclick="saveCommission()" class="btn-sm px-6 py-3 text-sm"
                    style="background:linear-gradient(135deg,#10b981,#059669);color:white;">
                    <i class="fa-solid fa-save mr-2"></i>Save Commission
                </button>
            </div>
        </div>

        <div class="admin-card p-8">
            <h3 class="font-heading font-black text-xl text-white mb-6">Payout Status Breakdown</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">${payoutCards}</div>
        </div>

        <div class="admin-card p-8">
            <h3 class="font-heading font-black text-xl text-white mb-6">Recent Transactions</h3>
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="text-left">
                            <th class="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-500">ID</th>
                            <th class="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Consumer</th>
                            <th class="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Amount</th>
                            <th class="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Gateway Ref</th>
                            <th class="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                            <th class="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Date</th>
                        </tr>
                    </thead>
                    <tbody>${txnRows}</tbody>
                </table>
            </div>
        </div>
    </div>`;

    previewCommission(commissionPct);
}

function previewCommission(pct) {
    const p          = parseFloat(pct) || 0;
    const commission = (500 * p / 100).toFixed(2);
    const seller     = (500 - parseFloat(commission)).toFixed(2);
    const el         = document.getElementById('commission-preview');
    if (el) el.innerHTML =
        `Product \u20b9500 \u2192 Admin <span style="color:#f59e0b;">\u20b9${commission}</span> | Farmer <span style="color:#10b981;">\u20b9${seller}</span>`;
}

async function saveCommission() {
    const pct = parseFloat(document.getElementById('commission-input')?.value);
    if (isNaN(pct) || pct < 0 || pct > 100) {
        toast('Enter a valid commission between 0 and 100', 'error');
        return;
    }
    try {
        const res = await fetch(`${PAYMENT_API}/payments/admin/commission`, {
            method: 'POST',
            headers: hdrs(),
            body: JSON.stringify({ commission_pct: pct })
        });
        const d = await res.json();
        if (d.success) toast(`Commission updated to ${pct}%`, 'success');
        else toast(d.message || 'Failed to save', 'error');
    } catch(e) {
        toast('Could not connect to backend', 'error');
    }
}
