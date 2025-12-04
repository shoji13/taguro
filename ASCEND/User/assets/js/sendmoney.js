const logoutBtn = document.getElementById('logoutBtn');
logoutBtn.addEventListener('click', () => {
  alert('You have been logged out successfully!');
});

// Dropdown toggle
const dropdown = document.querySelector('.dropdown');
const dropbtn = dropdown.querySelector('.dropbtn');
dropbtn.addEventListener('click', e => {
  e.preventDefault();
  dropdown.classList.toggle('active');
});
document.addEventListener('click', e => {
  if (!dropdown.contains(e.target)) dropdown.classList.remove('active');
});
document.querySelectorAll('.dropdown-content a').forEach(link => {
  link.addEventListener('click', () => dropdown.classList.remove('active'));
});

function showSection(section) {
  const sections = {
    own: "ownAccountSection",
    ascend: "ascendAccountSection",
    otherBanks: "otherBanksSection"
  };
  Object.values(sections).forEach(id => document.getElementById(id).classList.add("hidden"));
  document.getElementById(sections[section]).classList.remove("hidden");
}

// Fetch user accounts and populate dropdowns
let userAccounts = [];

async function loadAccounts() {
  const res = await fetch('get_user_accounts.php');
  const data = await res.json(); // get the JSON object

  if (!data.success) {
    alert(data.message);
    return;
  }

  userAccounts = data.accounts; // <- get the actual array

  if (userAccounts.length <= 1) {
    document.getElementById("ownAccountSection").style.display = 'none';
  }

  ['ownFromAccount','ascendFromAccount','otherFromAccount'].forEach(id => {
    const select = document.getElementById(id);
    select.innerHTML = '';
    userAccounts.forEach(acc => {
      const option = document.createElement('option');
      option.value = acc.AccountID;
      option.text = `${acc.CardType} ${acc.CardNumber} (PHP ${parseFloat(acc.CardBalance).toLocaleString('en-PH',{minimumFractionDigits:2})})`;
      option.dataset.balance = acc.CardBalance;
      select.appendChild(option);
    });
  });
}


loadAccounts();

// Populate From and To accounts
function populateOwnAccounts() {
  const fromSelect = document.getElementById('ownFromAccount');
  const toSelect = document.getElementById('ownToAccount');

  fromSelect.innerHTML = '';
  toSelect.innerHTML = '';

  userAccounts.forEach(acc => {
    // From account options
    const optionFrom = document.createElement('option');
    optionFrom.value = acc.AccountID;
    optionFrom.text = `${acc.CardType} ${acc.CardNumber} (PHP ${parseFloat(acc.CardBalance).toLocaleString('en-PH', {minimumFractionDigits:2})})`;
    optionFrom.dataset.balance = acc.CardBalance;
    fromSelect.appendChild(optionFrom);
  });

  function updateToAccounts() {
    const selectedFrom = fromSelect.value;
    toSelect.innerHTML = '';

    userAccounts
      .filter(acc => acc.AccountID !== selectedFrom)
      .forEach(acc => {
        const optionTo = document.createElement('option');
        optionTo.value = acc.AccountID; // still use AccountID to identify
        // Show CardNumber prominently
        optionTo.text = `Card: ${acc.CardNumber} (${acc.CardType}) - Balance: PHP ${parseFloat(acc.CardBalance).toLocaleString('en-PH', {minimumFractionDigits:2})}`;
        optionTo.dataset.balance = acc.CardBalance;
        toSelect.appendChild(optionTo);
      });
  }

  updateToAccounts();
  fromSelect.addEventListener('change', updateToAccounts);
}

// Initialize after loading accounts
loadAccounts().then(() => populateOwnAccounts());



// ================= PIN Verification Function =================
function verifyPin(cardID) {
  return new Promise((resolve, reject) => {
    const modal = document.getElementById('pinModal');
    const pinInput = document.getElementById('cardPinInput');
    const verifyBtn = document.getElementById('verifyPinBtn');
    const errorText = document.getElementById('pinError');
    const closeBtn = document.getElementById('closePinModal');

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

    // Allow Enter key to submit
    pinInput.addEventListener('keyup', e => {
      if (e.key === 'Enter') onVerify();
    });
  });
}



function showReceipt(transaction) {
  const modal = document.getElementById('receiptModal');
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



// ================= Own Account Transfer =================
document.getElementById('ownAccountForm').addEventListener('submit', async e => {
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

      // Update balances immediately
      const fromOption = document.querySelector(`#ownFromAccount option[value='${from}']`);
      const toOption = document.querySelector(`#ownToAccount option[value='${to}']`);

      let newFromBalance = parseFloat(fromOption.dataset.balance) - amount;
      let newToBalance = parseFloat(toOption.dataset.balance) + amount;

      fromOption.dataset.balance = newFromBalance;
      fromOption.text = `${fromOption.text.split(' (')[0]} (PHP ${newFromBalance.toLocaleString('en-PH',{minimumFractionDigits:2})})`;

      toOption.dataset.balance = newToBalance;
      toOption.text = `${toOption.text.split(' (')[0]} (PHP ${newToBalance.toLocaleString('en-PH',{minimumFractionDigits:2})})`;

      document.getElementById('ownAmount').value = '';
      document.querySelector("#ownAccountForm input[placeholder='Add Note']").value = '';

      // Show receipt
      showReceipt({
        id: result.transactionID || '',
        sender: fromOption.text.split(' (')[0],
        recipient: toOption.text.split(' (')[0],
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
});

// ================= ASCEND Account Transfer =================
document.getElementById("ascendForm").addEventListener("submit", async e => {
  e.preventDefault();

  const fromCardID = document.getElementById("ascendFromAccount").value;
  const recipientCardNumber = document.querySelector("#ascendForm input[placeholder='Enter ASCEND Account Number']").value;
  const recipientName = document.querySelector("#ascendForm input[placeholder='Enter Recipient Name']").value;
  const amount = parseFloat(document.getElementById("ascendAmount").value.replace(/[^0-9.]/g, ""));
  const remarks = document.querySelector("#ascendForm input[placeholder='Add Note']").value;

  if (!fromCardID || !recipientCardNumber || !recipientName || !amount || amount <= 0) {
    alert("Please fill all fields correctly.");
    return;
  }

  try {
    await verifyPin(fromCardID);

    const response = await fetch("send_to_ascend.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromCardID, recipientCardNumber, recipientName, amount, remarks })
    });

    const result = await response.json();
    if (result.success) {
      alert("Money successfully sent!");

      // Show receipt
      const fromOption = document.querySelector(`#ascendFromAccount option[value='${fromCardID}']`);
      showReceipt({
        id: result.transactionID || '',
        sender: fromOption.text.split(' (')[0],
        recipient: `${recipientName} (${recipientCardNumber})`,
        bank: 'ASCEND',
        amount: amount,
        remarks: remarks,
        date: new Date().toLocaleString()
      });

      location.reload();
    } else {
      alert("Error: " + result.message);
    }
  } catch (err) {
    alert(err.message);
  }
});

// ================= Other Banks & Wallets Transfer =================
document.getElementById('otherBanksForm').addEventListener('submit', async e => {
  e.preventDefault();

  const fromCardID = document.getElementById('otherFromAccount').value;
  const recipientBank = document.getElementById('recipientBank').value;
  const recipientAccount = document.querySelector('#otherBanksForm input[placeholder="Enter Account or Wallet Number"]').value.trim();
  const recipientName = document.querySelector('#otherBanksForm input[placeholder="Enter Recipient Name"]').value.trim();
  const amount = parseFloat(document.getElementById('otherAmount').value);
  const remarks = document.querySelector('#otherBanksForm input[placeholder="Add Note"]').value.trim();

  if (!fromCardID || !recipientBank || !recipientAccount || !recipientName || !amount || amount <= 0) {
    alert('Please fill all fields correctly.');
    return;
  }

  try {
    await verifyPin(fromCardID);

    const res = await fetch('send_to_other.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromCardID, recipientBank, recipientAccount, recipientName, amount, remarks })
    });

    const data = await res.json();
    if (data.success) {
      alert('Transaction successful!');

      // Show receipt
      const fromOption = document.querySelector(`#otherFromAccount option[value='${fromCardID}']`);
      showReceipt({
        id: data.transactionID || '',
        sender: fromOption.text.split(' (')[0],
        recipient: `${recipientName} (${recipientAccount})`,
        bank: recipientBank,
        amount: amount,
        remarks: remarks,
        date: new Date().toLocaleString()
      });

      document.getElementById('otherBanksForm').reset();
    } else {
      alert('Error: ' + data.message);
    }
  } catch (err) {
    alert(err.message);
  }
});


