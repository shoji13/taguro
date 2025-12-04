<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
require_once '../../db_connect.php';
header('Content-Type: application/json');

// Optional filters from query string
$start = isset($_GET['start']) ? $_GET['start'] : null;
$end = isset($_GET['end']) ? $_GET['end'] : null;
$type = isset($_GET['type']) ? $_GET['type'] : null; // Debit or Credit (legacy)
$transactionType = isset($_GET['transactionType']) && trim($_GET['transactionType']) !== '' ? trim($_GET['transactionType']) : null; // Deposit, Transfer, Withdraw

$sql = "SELECT 
    t.TransactionID,
    t.TransactionActivity,
    t.TransactionAmount,
    t.CardIDSender,
    t.AccountIDReciever,
    c.AccountID,
    a.AccountID AS AccountNumber,
    a.AccountName AS AccountName,
    t.TransactionDate,
    t.TransactionRemarks,
    t.BankName
FROM 
    transaction t
LEFT JOIN 
    card c ON t.CardIDSender = c.CardID
LEFT JOIN 
    accounts a ON c.AccountID = a.AccountID";

$conditions = [];
$params = [];
if ($start) {
    $conditions[] = 't.TransactionDate >= :start';
    $params[':start'] = $start . ' 00:00:00';
}
if ($end) {
    $conditions[] = 't.TransactionDate <= :end';
    $params[':end'] = $end . ' 23:59:59';
}
// Handle legacy type filter (Debit/Credit)
if ($type && ($type === 'Debit' || $type === 'Credit')) {
    $conditions[] = 't.TransactionActivity = :type';
    $params[':type'] = $type;
}

// Handle transaction type filter (Deposit, Transfer, Withdraw)
if ($transactionType) {
    $transactionTypeUpper = strtoupper(trim($transactionType));
    
    // Use LIKE for partial matching to handle variations in activity names
    // This will match "Transfer", "Deposit", "Withdraw" and any variations
    if ($transactionTypeUpper === 'DEPOSIT') {
        // Match deposit-related activities
        $conditions[] = '(UPPER(TRIM(t.TransactionActivity)) LIKE \'%DEPOSIT%\' 
                         OR UPPER(TRIM(t.TransactionActivity)) LIKE \'%RECEIVE%\' 
                         OR UPPER(TRIM(t.TransactionActivity)) LIKE \'%CREDIT%\')';
    } elseif ($transactionTypeUpper === 'WITHDRAW') {
        // Match withdraw-related activities  
        $conditions[] = '(UPPER(TRIM(t.TransactionActivity)) LIKE \'%WITHDRAW%\' 
                         OR UPPER(TRIM(t.TransactionActivity)) LIKE \'%DEBIT%\' 
                         OR UPPER(TRIM(t.TransactionActivity)) LIKE \'%SEND%\' 
                         OR UPPER(TRIM(t.TransactionActivity)) LIKE \'%PAY%\')';
    } elseif ($transactionTypeUpper === 'TRANSFER') {
        // Match transfer activities (exact or partial)
        $conditions[] = 'UPPER(TRIM(t.TransactionActivity)) LIKE \'%TRANSFER%\'';
    } else {
        // Fallback: try exact match
        $conditions[] = 'UPPER(TRIM(t.TransactionActivity)) = :transactionType';
        $params[':transactionType'] = $transactionTypeUpper;
    }
}

if (!empty($conditions)) {
    $sql .= ' WHERE ' . implode(' AND ', $conditions);
}

$sql .= ' ORDER BY t.TransactionDate DESC';

// Debug: log the SQL and params (remove in production)
// error_log("SQL: " . $sql);
// error_log("Params: " . print_r($params, true));

$stmt = $conn->prepare($sql);
$stmt->execute($params);
$transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($transactions);
// No need to close PDO connection
?>
