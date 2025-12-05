<?php
session_start();
header('Content-Type: application/json');
require '../db_connect.php';

$data = json_decode(file_get_contents('php://input'), true);
$cardID = $data['cardID'] ?? null;
$amount = $data['amount'] ?? 0;

if (!$cardID || $amount <= 0) {
    echo json_encode(['status'=>'error','message'=>'Invalid data']);
    exit;
}

// Fetch card info
$stmt = $conn->prepare("SELECT CardBalance, CardNumber, AccountID FROM card WHERE CardID = :id");
$stmt->bindParam(':id', $cardID);
$stmt->execute();
$card = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$card) {
    echo json_encode(['status'=>'error','message'=>'Card not found']);
    exit;
}

if ($amount > $card['CardBalance']) {
    echo json_encode(['status'=>'error','message'=>'Insufficient balance']);
    exit;
}

$newBalance = $card['CardBalance'] - $amount;

// Update card balance
$update = $conn->prepare("UPDATE card SET CardBalance = :balance WHERE CardID = :id");
$update->bindParam(':balance', $newBalance);
$update->bindParam(':id', $cardID);
$update->execute();

// Log transaction
$transactionStmt = $conn->prepare("INSERT INTO transaction 
    (TransactionActivity, TransactionAmount, CardIDSender, AccountIDReciever, BankName, TransactionRemarks, TransactionDate, RecieverName)
    VALUES ('Withdraw', :amount, :sender, :receiver, 'ASCEND', :remarks, NOW(), :receiverName)");

$receiverName = $card['AccountID']; // Since AccountIDReciever should be the card number? Adjust if needed

$transactionStmt->bindValue(':amount', $amount);
$transactionStmt->bindValue(':sender', $cardID); // The card the user is withdrawing from
$transactionStmt->bindValue(':receiver', 0);      // Withdraw means money leaves the system
$transactionStmt->bindValue(':remarks', 'Withdraw');
$transactionStmt->bindValue(':receiverName', $card['CardNumber']); // Optional: store card number as recipient
$transactionStmt->execute();

$transactionID = $conn->lastInsertId();

echo json_encode(['status'=>'success','message'=>'Withdraw successful','transactionID'=>$transactionID]);
