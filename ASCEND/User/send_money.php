<?php
session_start();
header('Content-Type: application/json');
require '../db_connect.php';

if (!isset($_SESSION['AccountID'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$from = $data['fromAccountID'];
$to = $data['toAccountID'];
$amount = $data['amount'];
$remarks = $data['remarks'] ?? '';

if (!$from || !$to || !$amount || $amount <= 0 || $from === $to) {
    echo json_encode(['success' => false, 'message' => 'Invalid input']);
    exit;
}

try {
    $conn->beginTransaction();

    // Lock sender's card and check balance
    $stmt = $conn->prepare("SELECT CardBalance FROM card WHERE CardID = :id FOR UPDATE");
    $stmt->bindParam(':id', $from);
    $stmt->execute();
    $fromBalance = $stmt->fetchColumn();

    if ($fromBalance < $amount) {
        $conn->rollBack();
        echo json_encode(['success' => false, 'message' => 'Insufficient balance']);
        exit;
    }

    // Deduct from sender
    $stmt = $conn->prepare("UPDATE card SET CardBalance = CardBalance - :amt WHERE CardID = :id");
    $stmt->bindParam(':amt', $amount);
    $stmt->bindParam(':id', $from);
    $stmt->execute();

    // Add to recipient
    $stmt = $conn->prepare("UPDATE card SET CardBalance = CardBalance + :amt WHERE CardID = :id");
    $stmt->bindParam(':amt', $amount);
    $stmt->bindParam(':id', $to);
    $stmt->execute();

    // Get recipient card number
    $stmt = $conn->prepare("SELECT CardNumber FROM card WHERE CardID = :id");
    $stmt->bindParam(':id', $to);
    $stmt->execute();
    $toCardNumber = $stmt->fetchColumn();

    // Log transaction
    $stmt = $conn->prepare("
        INSERT INTO transaction 
        (TransactionActivity, TransactionAmount, AccountIDSender, AccountIDReciever, BankName, TransactionRemarks, TransactionDate) 
        VALUES ('Transfer', :amt, :sender, :receiver, 'ASCEND', :remarks, NOW())
    ");
    $stmt->bindParam(':amt', $amount);
    $stmt->bindParam(':sender', $from);             // sender's AccountID
    $stmt->bindParam(':receiver', $toCardNumber);   // recipient's CardNumber
    $stmt->bindParam(':remarks', $remarks);
    $stmt->execute();

    $conn->commit();

    echo json_encode(['success' => true]);

} catch (PDOException $e) {
    $conn->rollBack();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
