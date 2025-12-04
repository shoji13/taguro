<?php
session_start();
header('Content-Type: application/json');
require '../db_connect.php';

// Read JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['CardID']) || !isset($input['CardPIN'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Card ID and PIN are required.'
    ]);
    exit;
}

$cardID = $input['CardID'];
$cardPIN = $input['CardPIN'];

try {
    // Fetch the PIN from the database
    $stmt = $conn->prepare("SELECT CardPin FROM card WHERE CardID = :cardID");
    $stmt->bindParam(':cardID', $cardID, PDO::PARAM_INT);
    $stmt->execute();

    $storedPIN = $stmt->fetchColumn();

    if (!$storedPIN) {
        echo json_encode([
            'success' => false,
            'message' => 'Card not found.'
        ]);
        exit;
    }

    // Compare input PIN with stored PIN
    if ($cardPIN === $storedPIN) {
        echo json_encode([
            'success' => true,
            'message' => 'PIN verified successfully.'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Incorrect PIN.'
        ]);
    }

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
