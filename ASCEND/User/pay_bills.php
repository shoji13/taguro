<?php
session_start();
header('Content-Type: application/json');
require '../db_connect.php';

if (!isset($_SESSION['AccountID'])) {
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}

$accountIDSender = $_SESSION['AccountID'];

// Get POST data
$data = json_decode(file_get_contents("php://input"), true);

$cardIDSender   = $data['cardIDSender'];
$amount         = $data['amount'];
$bankName       = $data['bankName'];        // Biller
$remarks        = $data['remarks'] ?? '';
$accountNo      = $data['accountNo'];      // External subscriber/account number
$receiverName   = $data['registeredName']; // Registered name

// Get current card balance
$stmt = $conn->prepare("SELECT CardBalance FROM card WHERE CardID = :cardID");
$stmt->bindParam(':cardID', $cardIDSender);
$stmt->execute();
$currentBalance = $stmt->fetchColumn();

if ($currentBalance === false) {
    echo json_encode([
        "status" => "error",
        "message" => "Card not found."
    ]);
    exit;
}

if ($amount > $currentBalance) {
    echo json_encode([
        "status" => "error",
        "message" => "Insufficient card balance."
    ]);
    exit;
}

// Begin transaction
$conn->beginTransaction();

try {
    // Deduct from card balance
    $stmt = $conn->prepare("UPDATE card SET CardBalance = CardBalance - :amount WHERE CardID = :cardID");
    $stmt->bindParam(':amount', $amount);
    $stmt->bindParam(':cardID', $cardIDSender);
    $stmt->execute();

    // Insert transaction
    $stmt = $conn->prepare("
        INSERT INTO transaction 
        (TransactionActivity, TransactionAmount, CardIDSender, AccountIDReciever, BankName, TransactionRemarks, TransactionDate, RecieverName)
        VALUES 
        ('Pay bills', :amount, :cardIDSender, :accountNo, :bankName, :remarks, NOW(), :receiverName)
    ");

    $stmt->bindParam(':amount', $amount);
    $stmt->bindParam(':cardIDSender', $cardIDSender);
    $stmt->bindParam(':accountNo', $accountNo);
    $stmt->bindParam(':bankName', $bankName);
    $stmt->bindParam(':remarks', $remarks);
    $stmt->bindParam(':receiverName', $receiverName);

    $stmt->execute();
    $transactionID = $conn->lastInsertId();

    $conn->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Payment successful",
        "transactionID" => $transactionID
    ]);

} catch (Exception $e) {
    $conn->rollBack();
    echo json_encode([
        "status" => "error",
        "message" => "Payment failed: " . $e->getMessage()
    ]);
}
?>
