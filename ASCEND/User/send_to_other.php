<?php
session_start();
header('Content-Type: application/json');
require '../db_connect.php';

if (!isset($_SESSION['AccountID'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$fromCardID = $data['fromCardID'];        // sender card
$recipientBank = $data['recipientBank'];  // selected bank
$recipientAccount = $data['recipientAccount']; // free text
$recipientName = $data['recipientName'];  // free text
$amount = $data['amount'];
$remarks = $data['remarks'] ?? '';

if (!$fromCardID || !$recipientBank || !$recipientAccount || !$recipientName || !$amount || $amount <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid input']);
    exit;
}

try {
    $conn->beginTransaction();

    // 1️⃣ Lock sender card
    $stmt = $conn->prepare("SELECT CardBalance FROM card WHERE CardID = :id FOR UPDATE");
    $stmt->execute([':id' => $fromCardID]);
    $sender = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$sender) {
        throw new Exception("Sender card not found.");
    }

    if ($sender['CardBalance'] < $amount) {
        throw new Exception("Insufficient balance.");
    }

    // 2️⃣ Deduct sender balance
    $stmt = $conn->prepare("UPDATE card SET CardBalance = CardBalance - :amt WHERE CardID = :id");
    $stmt->execute([':amt' => $amount, ':id' => $fromCardID]);

    // 3️⃣ Log transaction
    $stmt = $conn->prepare("
        INSERT INTO transaction
            (TransactionActivity, TransactionAmount, CardIDSender, AccountIDReciever, BankName, TransactionRemarks, TransactionDate, RecieverName)
        VALUES
            ('Send to Other Bank/Wallet', :amt, :sender, :receiverAccount, :bankName, :remarks, NOW(), :receiverName)
    ");

    $stmt->execute([
        ':amt' => $amount,
        ':sender' => $fromCardID,
        ':receiverAccount' => $recipientAccount,
        ':bankName' => $recipientBank,
        ':remarks' => $remarks,
        ':receiverName' => $recipientName
    ]);

    $conn->commit();
    echo json_encode(['success' => true]);

} catch (Exception $e) {
    $conn->rollBack();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
