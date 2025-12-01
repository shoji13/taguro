// Logout button
const logoutBtn = document.getElementById("logoutBtn");
logoutBtn.addEventListener("click", () => {
  alert("You have been logged out successfully!");
});

// Form submission
const payBillsForm = document.getElementById("payBillsForm");
payBillsForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const biller = document.getElementById("billerSelect").value;
  const accountNo = document.getElementById("accountNo").value;
  const amount = document.getElementById("billAmount").value;

  if (!biller || !accountNo || !amount) {
    alert("Please fill in all required fields.");
    return;
  }

  alert(`✅ Payment Successful!
You have paid PHP ${parseFloat(amount).toFixed(2)} to ${biller.toUpperCase()}.
Account/Subscriber No: ${accountNo}`);

  payBillsForm.reset();
});
