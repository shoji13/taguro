 const menuBtn = document.getElementById('menuBtn');
        const sidebar = document.getElementById('sidebar');

        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });

// Fetch and display transactions (with optional filters)
function fetchTransactions(params = {}) {
    const url = new URL('phpbackend/get_transaction_reports.php', window.location.href);
    Object.entries(params).forEach(([k, v]) => {
        if (v) url.searchParams.set(k, v);
    });
    return fetch(url.toString())
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            console.log('Fetched transaction data:', data);
            const tbody = document.querySelector('.transactions-table tbody');
            if (!tbody) {
                console.error('No tbody found for .transactions-table');
                return;
            }
            tbody.innerHTML = '';
            if (Array.isArray(data) && data.length > 0) {
                data.forEach(tx => {
                    const tr = document.createElement('tr');
                    const amountColorClass = tx.TransactionActivity && tx.TransactionActivity.toLowerCase() === 'debit' ? 'debit' : 'credit';
                    const accountNo = (tx.AccountID ?? tx.AccountNumber ?? tx.CardIDSender ?? '').toString();
                    tr.innerHTML = `
                        <td>${accountNo}</td>
                        <td>${tx.TransactionDate ? tx.TransactionDate.split(' ')[0] : ''}</td>
                        <td>${tx.TransactionActivity || ''}</td>
                        <td class="amount ${amountColorClass}">${tx.TransactionAmount ? '₱' + parseFloat(tx.TransactionAmount).toLocaleString(undefined, {minimumFractionDigits:2}) : ''}</td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                const tr = document.createElement('tr');
                tr.innerHTML = '<td colspan="5" style="text-align:center;">No transactions found.</td>';
                tbody.appendChild(tr);
            }
        })
        .catch(err => {
            console.error('Failed to fetch transactions:', err);
            const tbody = document.querySelector('.transactions-table tbody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:red;">Error loading transactions.</td></tr>';
            }
        });
}

document.addEventListener('DOMContentLoaded', function() {
    // Load toolbar user - always show logged-in admin user
    (async function loadToolbarUser(){
        try{
            const resp = await fetch('phpbackend/get_current_user.php');
            const data = await resp.json();
            if (data && data.success){
                const nameEl = document.getElementById('userName');
                const avatarEl = document.getElementById('userAvatar');
                // Use AccountName if available, otherwise fallback to username
                const displayName = data.name || data.username || 'User';
                if (nameEl) nameEl.textContent = displayName;
                if (data.initials && avatarEl) avatarEl.textContent = data.initials;
            }
        }catch(e){console.error('Toolbar user load error:', e);}
    })();
    // initial fetch
    fetchTransactions();

    const applyBtn = document.getElementById('applyFilter');
    const resetBtn = document.getElementById('resetFilter');
    const startInput = document.getElementById('startDate');
    const endInput = document.getElementById('endDate');
    const typeSelect = document.getElementById('typeFilter');

    function applyFilters() {
        const params = {};
        if (startInput && startInput.value) params.start = startInput.value;
        if (endInput && endInput.value) params.end = endInput.value;
        if (typeSelect && typeSelect.value && typeSelect.value !== 'All') params.type = typeSelect.value;
        fetchTransactions(params);
    }

    if (applyBtn) applyBtn.addEventListener('click', applyFilters);
    if (resetBtn) resetBtn.addEventListener('click', () => {
        if (startInput) startInput.value = '';
        if (endInput) endInput.value = '';
        if (typeSelect) typeSelect.value = 'All';
        fetchTransactions();
    });
});