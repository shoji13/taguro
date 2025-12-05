<?php
session_start();
header('Content-Type: application/json');
require '../db_connect.php';

$data = json_decode(file_get_contents('php://input'), true);
$cardID = $data['cardID'] ?? null;
$amount = $data['amount'] ?? 0;
$remarks = $data['remarks'] ?? '';

if (!$cardID || $amount <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid data']);
    exit;
}

// Fetch card info
$stmt = $conn->prepare("SELECT CardBalance, CardNumber, AccountID FROM card WHERE CardID = :id");
$stmt->bindParam(':id', $cardID);
$stmt->execute();
$card = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$card) {
    echo json_encode(['status'=>'error', 'message'=>'Card not found']);
    exit;
}

// Update card balance
$newBalance = $card['CardBalance'] + $amount;
$update = $conn->prepare("UPDATE card SET CardBalance = :balance WHERE CardID = :id");
$update->bindParam(':balance', $newBalance);
$update->bindParam(':id', $cardID);
$update->execute();



// Log transaction
$receiverName = $_SESSION['AccountName'] ?? 'Unknown';

$transactionStmt = $conn->prepare("INSERT INTO transaction 
    (TransactionActivity, TransactionAmount, CardIDSender, AccountIDReciever, BankName, TransactionRemarks, TransactionDate, RecieverName)
    VALUES ('Deposit', :amount, 0, :accountReciever, 'ASCEND', :remarks, NOW(), :receiver)");

$transactionStmt->bindParam(':amount', $amount);
$transactionStmt->bindParam(':accountReciever', $card['CardNumber']); // store card number as receiver
$transactionStmt->bindParam(':remarks', $remarks);
$transactionStmt->bindParam(':receiver', $receiverName); // use variable, not expression
$transactionStmt->execute();;

$transactionID = $conn->lastInsertId();

echo json_encode(['status'=>'success', 'message'=>'Deposit successful', 'transactionID'=>$transactionID]);
