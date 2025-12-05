document.addEventListener('DOMContentLoaded', () => {

    // ================= Logout Button =================
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            alert("You have been logged out successfully!");
        });
    }

    // ================= Load User Cards =================
    loadUserCards();

    // ================= Pay Bills Form =================
    const payBillsForm = document.getElementById("payBillsForm");
    if (payBillsForm) {
        payBillsForm.addEventListener('submit', handlePayBills);
    }

    // ================= Own Account Transfer Form =================
    const ownForm = document.getElementById('ownAccountForm');
    if (ownForm) {
        ownForm.addEventListener('submit', handleOwnTransfer);
    }
});

// ================= Load Cards Dropdown =================
async function loadUserCards() {
    const paymentSource = document.getElementById('paymentSource');
    if (!paymentSource) return;

    paymentSource.innerHTML = '';

    try {
        const res = await fetch('get_cards.php');
        const cards = await res.json();

        console.log("Cards fetched:", cards);

        if (!cards || cards.length === 0) {
            paymentSource.innerHTML = `<option value="">No cards available</option>`;
            updateCardBalance();
            return;
        }

        cards.forEach(card => {
            const option = document.createElement('option');
            option.value = card.CardID;
            option.dataset.balance = card.CardBalance;
            option.dataset.senderName = card.AccountName || 'Unknown'; // key fix
            option.textContent = `${card.CardNumber} - Balance: PHP ${parseFloat(card.CardBalance).toLocaleString('en-PH', {minimumFractionDigits:2})}`;
            paymentSource.appendChild(option);
        });

        updateCardBalance();
        paymentSource.addEventListener('change', updateCardBalance);

    } catch (err) {
        console.error("Error loading cards:", err);
        paymentSource.innerHTML = `<option value="">Error loading cards</option>`;
        updateCardBalance();
    }
}

// ================= Update Balance Display =================
function updateCardBalance() {
    const paymentSource = document.getElementById('paymentSource');
    const balanceDisplay = document.getElementById('paymentBalance');
    const selectedOption = paymentSource?.selectedOptions[0];

    if (selectedOption && selectedOption.dataset.balance !== undefined) {
        balanceDisplay.textContent = `Balance: PHP ${parseFloat(selectedOption.dataset.balance).toLocaleString('en-PH',{minimumFractionDigits:2})}`;
    } else {
        balanceDisplay.textContent = '';
    }
}

// ================= PIN Verification Function =================
function verifyPin(cardID) {
    return new Promise((resolve, reject) => {
        const modal = document.getElementById('pinModal');
        const pinInput = document.getElementById('cardPinInput');
        const verifyBtn = document.getElementById('verifyPinBtn');
        const errorText = document.getElementById('pinError');
        const closeBtn = document.getElementById('closePinModal');

        if (!modal || !pinInput || !verifyBtn || !errorText || !closeBtn) {
            return reject(new Error('PIN modal elements are missing.'));
        }

        let attempts = 0;
        const maxAttempts = 3;

        pinInput.value = '';
        errorText.textContent = '';
        modal.style.display = 'flex';
        pinInput.focus();

        function cleanup() {
            verifyBtn.removeEventListener('click', onVerify);
            closeBtn.removeEventListener('click', onClose);
            modal.style.display = 'none';
        }

        function onClose() {
            cleanup();
            reject(new Error('PIN verification canceled.'));
        }

        async function onVerify() {
            const pin = pinInput.value.trim();
            if (!pin) {
                errorText.textContent = 'Please enter your PIN.';
                return;
            }

            try {
                const res = await fetch('verify_card_pin.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ CardID: cardID, CardPIN: pin })
                });

                const data = await res.json();

                if (data.success) {
                    cleanup();
                    resolve(true);
                } else {
                    attempts++;
                    if (attempts >= maxAttempts) {
                        errorText.textContent = 'Maximum attempts reached. Transaction canceled.';
                        setTimeout(() => cleanup(), 1500);
                        reject(new Error('Maximum PIN attempts reached.'));
                    } else {
                        errorText.textContent = `${data.message} (${attempts}/${maxAttempts})`;
                        pinInput.value = '';
                        pinInput.focus();
                    }
                }
            } catch (err) {
                errorText.textContent = 'Error verifying PIN.';
                console.error(err);
            }
        }

        verifyBtn.addEventListener('click', onVerify);
        closeBtn.addEventListener('click', onClose);

        pinInput.addEventListener('keyup', e => {
            if (e.key === 'Enter') onVerify();
        });
    });
}

// ================= Show Receipt Modal =================
function showReceipt(transaction) {
    const modal = document.getElementById('receiptModal');
    if (!modal) return;

    document.getElementById('receiptID').textContent = transaction.id ? 'Transaction ID: ' + transaction.id : '';
    document.getElementById('receiptSender').textContent = transaction.sender;
    document.getElementById('receiptRecipient').textContent = transaction.recipient;
    document.getElementById('receiptBank').textContent = transaction.bank || 'N/A';
    document.getElementById('receiptAmount').textContent = `PHP ${parseFloat(transaction.amount).toLocaleString('en-PH', {minimumFractionDigits:2})}`;
    document.getElementById('receiptRemarks').textContent = transaction.remarks || '-';
    document.getElementById('receiptDate').textContent = transaction.date || new Date().toLocaleString();

    modal.style.display = 'flex';
    document.getElementById('closeReceipt').onclick = () => modal.style.display = 'none';
}

// ================= PAY BILLS =================
async function handlePayBills(e) {
    e.preventDefault();
    const msg = document.getElementById('msg') || createMsgElement('payBillsForm');

    const cardSelect = document.getElementById('paymentSource');
    const selectedCard = cardSelect.selectedOptions[0];
    if (!selectedCard || selectedCard.value === '') {
        msg.textContent = 'No card selected.';
        msg.style.color = 'red';
        return;
    }

    const cardIDSender = selectedCard.value;
    const senderName = selectedCard.dataset.senderName || 'Unknown';
    const cardBalance = parseFloat(selectedCard.dataset.balance || 0);

    const biller = document.getElementById('billerSelect').value;
    const accountNo = document.getElementById('accountNo').value.trim();
    const registeredName = document.getElementById('registeredName').value.trim();
    const amount = parseFloat(document.getElementById('billAmount').value);
    const remarks = document.getElementById('remarks').value.trim();

    if (!cardIDSender || !biller || !accountNo || !registeredName || !amount || amount <= 0) {
        msg.textContent = 'Please fill all fields correctly.';
        msg.style.color = 'red';
        return;
    }

    if (amount > cardBalance) {
        msg.textContent = 'Insufficient balance.';
        msg.style.color = 'red';
        return;
    }

    try {
        await verifyPin(cardIDSender);

        const res = await fetch('pay_bills.php', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({cardIDSender, amount, bankName: biller, remarks, accountNo, registeredName})
        });

        const result = await res.json();

        if (result.status === 'success') {
            msg.textContent = result.message;
            msg.style.color = 'green';
            document.getElementById('payBillsForm').reset();
            loadUserCards();

            showReceipt({
                id: result.transactionID || '',
                sender: senderName,
                recipient: registeredName,
                bank: biller,
                amount: amount,
                remarks: remarks,
                date: new Date().toLocaleString()
            });
        } else {
            msg.textContent = result.message || 'Transaction failed.';
            msg.style.color = 'red';
        }

    } catch (err) {
        msg.textContent = err.message || 'Error occurred during transaction.';
        msg.style.color = 'red';
    }
}

// ================= Own Account Transfer Handler =================
async function handleOwnTransfer(e) {
    e.preventDefault();

    const from = document.getElementById('ownFromAccount').value;
    const to = document.getElementById('ownToAccount').value;
    const amount = parseFloat(document.getElementById('ownAmount').value);
    const remarks = document.querySelector("#ownAccountForm input[placeholder='Add Note']").value;

    if (!from || !to || !amount || amount <= 0) return alert("Please fill all fields correctly.");
    if (from === to) return alert("Cannot transfer to the same account.");

    try {
        await verifyPin(from);

        const res = await fetch('send_money.php', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fromAccountID: from, toAccountID: to, amount, remarks })
        });

        const result = await res.json();
        if (result.success) {
            alert('Transaction successful!');
            document.getElementById('ownAccountForm').reset();

            showReceipt({
                id: result.transactionID || '',
                sender: from,
                recipient: to,
                bank: 'Own Account',
                amount: amount,
                remarks: remarks,
                date: new Date().toLocaleString()
            });

        } else {
            alert('Transaction failed: ' + result.message);
        }
    } catch(err) {
        alert(err.message);
    }
}

// ================= Helper to create msg element =================
function createMsgElement(formID) {
    const msg = document.createElement('p');
    msg.id = 'msg';
    msg.style.marginTop = '10px';
    msg.style.fontWeight = 'bold';
    const form = document.getElementById(formID);
    if (form) form.appendChild(msg);
    return msg;
}
