<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
require_once '../../db_connect.php';
header('Content-Type: application/json');

// Optional filters from query string
$start = isset($_GET['start']) ? $_GET['start'] : null;
$end = isset($_GET['end']) ? $_GET['end'] : null;
$type = isset($_GET['type']) ? $_GET['type'] : null; // Debit or Credit

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
if ($type && ($type === 'Debit' || $type === 'Credit')) {
    $conditions[] = 't.TransactionActivity = :type';
    $params[':type'] = $type;
}

if (!empty($conditions)) {
    $sql .= ' WHERE ' . implode(' AND ', $conditions);
}

$sql .= ' ORDER BY t.TransactionDate DESC';

$stmt = $conn->prepare($sql);
$stmt->execute($params);
$transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($transactions);
// No need to close PDO connection
?>
