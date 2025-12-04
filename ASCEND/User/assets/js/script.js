document.addEventListener("DOMContentLoaded", () => {
  const myAccountView = document.getElementById('myAccountView');
  const transactionView = document.getElementById('transactionHistoryView');
  const accountsContainer = document.getElementById('accountsContainer');
  const accountsNav = document.getElementById('accountsNav');

  let allTransactions = [];
  let allCards = [];

  function loadAccountData() {
    fetch('get_account.php')
      .then(res => res.json())
      .then(data => {
        if(!data.success) return alert(data.message);

        // Update profile
        document.querySelector('.profile span').textContent = data.profile.AccountName;

        allTransactions = data.transactions;
        allCards = data.cards;

        // Render cards
        accountsContainer.innerHTML = '';
        allCards.forEach(card => {
          const cardHTML = document.createElement('div');
          cardHTML.classList.add('account-card');
          cardHTML.innerHTML = `
            <div class="account-info">
              <div class="account-icon">🏦</div>
              <div class="account-details">
                <p class="account-type">${card.CardType}</p>
                <p class="account-number">${card.CardNumber}</p>
                <p>Available Balance 
                  <span class="balance">PHP ${parseFloat(card.CardBalance).toLocaleString('en-PH',{minimumFractionDigits:2})}</span>
                </p>
              </div>
            </div>
          `;

          cardHTML.addEventListener('click', () => {
            showTransactions(card.CardID, card.CardNumber);
          });

          accountsContainer.appendChild(cardHTML);
        });
      })
      .catch(err => console.error(err));
  }

  // Show transactions for a card
  function showTransactions(cardID, cardNumber) {
      myAccountView.style.display = 'none';
      transactionView.style.display = 'block';

      const txList = document.querySelector('.transaction-list');
      txList.innerHTML = '';

      const filteredTx = allTransactions.filter(tx =>
        String(tx.CardIDSender) === String(cardID) || String(tx.AccountIDReciever) === String(cardNumber)
      );

      if (filteredTx.length === 0) {
        txList.innerHTML = `<p style="text-align:center; padding:20px; color:#555; font-size:18px;">No transactions yet</p>`;
        return;
      }

      filteredTx.forEach(tx => {
        const amount = parseFloat(tx.TransactionAmount).toLocaleString('en-PH',{minimumFractionDigits:2});
        const isSent = String(tx.CardIDSender) === String(cardID);

        // Determine activity label
        const activityLabel = isSent ? 'Transferred' : 'Received';
        const sign = isSent ? '-' : '+';

        const txHTML = document.createElement('div');
        txHTML.classList.add("transaction-item");
        txHTML.innerHTML = `
          <div class="trans-left">
            <span class="calendar">📅</span>
            <div>
              <p class="date">${formatFullDate(tx.TransactionDate)}</p>
              <p class="desc">
                ${activityLabel}<br>
                Ref: TX${tx.TransactionID} — ${new Date(tx.TransactionDate).toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div class="trans-right">${sign}${amount}</div>
        `;
        txList.appendChild(txHTML);
      });
  }


  function formatFullDate(dateStr) {
    const options = { year: 'numeric', month: 'long', day: '2-digit' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  }

  if(accountsNav){
    accountsNav.addEventListener('click',(e)=>{
      e.preventDefault();
      transactionView.style.display='none';
      myAccountView.style.display='block';
    });
  }

  const backToAccountsBtn = document.getElementById('backToAccounts');
  if(backToAccountsBtn){
    backToAccountsBtn.addEventListener('click', () => {
      transactionView.style.display = 'none';
      myAccountView.style.display = 'block';
    });
  }

  loadAccountData();
});

// Fetch and display recent transactions
function loadTransactions() {
  fetch('../../Admin/phpbackend/get_transaction_reports.php')
    .then(response => response.json())
    .then(data => {
      const transactionList = document.querySelector('.transaction-list');
      transactionList.innerHTML = '';
      data.forEach(tx => {
        const amountColor = tx.TransactionActivity.toLowerCase() === 'debit' ? 'red' : 'green';
        const sign = tx.TransactionActivity.toLowerCase() === 'debit' ? '-' : '+';
        const item = document.createElement('div');
        item.className = 'transaction-item';
        item.innerHTML = `
          <div class="trans-left">
            <span class="calendar">📅</span>
            <div>
              <p class="date">${tx.TransactionDate.split(' ')[0]}</p>
              <p class="desc">${tx.TransactionRemarks}<br>Ref: TX${tx.TransactionID}</p>
            </div>
          </div>
          <div class="trans-right" style="color:${amountColor}">${sign}₱${parseFloat(tx.TransactionAmount).toLocaleString(undefined, {minimumFractionDigits:2})}</div>
        `;
        transactionList.appendChild(item);
      });
    })
    .catch(err => {
      console.error('Failed to load transactions:', err);
    });
}

// Load transactions when transaction history view is shown
accountCard.addEventListener('click', loadTransactions);
