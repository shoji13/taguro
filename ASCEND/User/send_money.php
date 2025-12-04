<?php
session_start();
header('Content-Type: application/json');
require '../db_connect.php';

if (!isset($_SESSION['AccountID'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$fromCardID = $data['fromAccountID']; // sender CardID
$toCardID = $data['toAccountID'];     // receiver CardID
$amount = $data['amount'];
$remarks = $data['remarks'] ?? '';

if (!$fromCardID || !$toCardID || !$amount || $amount <= 0 || $fromCardID === $toCardID) {
    echo json_encode(['success' => false, 'message' => 'Invalid input']);
    exit;
}

try {
    $conn->beginTransaction();

    // 1️⃣ Get sender card info
    $stmt = $conn->prepare("SELECT CardBalance FROM card WHERE CardID = :id FOR UPDATE");
    $stmt->execute([':id' => $fromCardID]);
    $sender = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$sender) {
        throw new Exception("Sender card not found.");
    }

    if ($sender['CardBalance'] < $amount) {
        throw new Exception("Insufficient balance.");
    }

    // 2️⃣ Get receiver card info (CardNumber + AccountID)
    $stmt = $conn->prepare("SELECT CardNumber, AccountID FROM card WHERE CardID = :id");
    $stmt->execute([':id' => $toCardID]);
    $receiverCard = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$receiverCard) {
        throw new Exception("Receiver card not found.");
    }

    $receiverCardNumber = $receiverCard['CardNumber']; // ✔️ USE THIS
    $receiverAccountID = $receiverCard['AccountID'];

    // 3️⃣ Get receiver's name
    $stmt = $conn->prepare("SELECT AccountName FROM accounts WHERE AccountID = :id");
    $stmt->execute([':id' => $receiverAccountID]);
    $receiverName = $stmt->fetchColumn() ?: "Unknown";

    // 4️⃣ Deduct sender
    $stmt = $conn->prepare("UPDATE card SET CardBalance = CardBalance - :amt WHERE CardID = :id");
    $stmt->execute([':amt' => $amount, ':id' => $fromCardID]);

    // 5️⃣ Add receiver
    $stmt = $conn->prepare("UPDATE card SET CardBalance = CardBalance + :amt WHERE CardID = :id");
    $stmt->execute([':amt' => $amount, ':id' => $toCardID]);

    // 6️⃣ Insert transaction log
    $stmt = $conn->prepare("
        INSERT INTO transaction 
            (TransactionActivity, TransactionAmount, CardIDSender, AccountIDReciever, BankName, TransactionRemarks, TransactionDate, RecieverName)
        VALUES 
            ('Transfer', :amt, :sender, :receiverCardNumber, 'ASCEND', :remarks, NOW(), :recName)
    ");

    $stmt->execute([
        ':amt' => $amount,
        ':sender' => $fromCardID,
        ':receiverCardNumber' => $receiverCardNumber, // ✔️ save card number
        ':remarks' => $remarks,
        ':recName' => $receiverName
    ]);

    $conn->commit();
    echo json_encode(['success' => true]);

} catch (Exception $e) {
    $conn->rollBack();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
