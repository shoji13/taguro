<?php
header('Content-Type: application/json');
require '../../db_connect.php';

try {
    // Count all cards in the card table
    $stmt = $conn->prepare("SELECT COUNT(*) as total_cards FROM card");
    $stmt->execute();
    
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Return the total count
    echo json_encode([
        'success' => true,
        'total_cards' => intval($result['total_cards'])
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>

