<?php
header('Content-Type: application/json');
require '../../db_connect.php';

try {
    // Count only user accounts (exclude Admin role)
    $stmt = $conn->prepare("SELECT COUNT(*) as total_accounts FROM accounts WHERE AccountRole = 'User'");
    $stmt->execute();
    
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Return the total count
    echo json_encode([
        'success' => true,
        'total_accounts' => intval($result['total_accounts'])
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>

