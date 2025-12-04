<?php
session_start();
header('Content-Type: application/json');
require '../../db_connect.php';

// Check if user is logged in
if (!isset($_SESSION['AccountID'])) {
    echo json_encode([
        'success' => false,
        'error' => 'Not logged in'
    ]);
    exit();
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode([
        'success' => false,
        'error' => 'Invalid input'
    ]);
    exit();
}

$accountID = $_SESSION['AccountID'];
$currentPassword = isset($input['currentPassword']) ? trim($input['currentPassword']) : '';
$newPassword = isset($input['newPassword']) ? trim($input['newPassword']) : '';

// Validate inputs
if (empty($currentPassword) || empty($newPassword)) {
    echo json_encode([
        'success' => false,
        'error' => 'All fields are required'
    ]);
    exit();
}

// Validate password length
if (strlen($newPassword) < 6) {
    echo json_encode([
        'success' => false,
        'error' => 'Password must be at least 6 characters long'
    ]);
    exit();
}

try {
    // Get current user's password from database
    $stmt = $conn->prepare("
        SELECT AccountPassword 
        FROM accounts 
        WHERE AccountID = :accountID
    ");
    $stmt->bindParam(':accountID', $accountID, PDO::PARAM_INT);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo json_encode([
            'success' => false,
            'error' => 'User not found'
        ]);
        exit();
    }

    // Verify current password (passwords are stored in plain text based on login.php)
    if ($currentPassword !== $user['AccountPassword']) {
        echo json_encode([
            'success' => false,
            'error' => 'Current password is incorrect'
        ]);
        exit();
    }

    // Check if new password is same as current password
    if ($newPassword === $user['AccountPassword']) {
        echo json_encode([
            'success' => false,
            'error' => 'New password must be different from current password'
        ]);
        exit();
    }

    // Update password
    $stmt = $conn->prepare("
        UPDATE accounts 
        SET AccountPassword = :newPassword
        WHERE AccountID = :accountID
    ");
    $stmt->bindParam(':newPassword', $newPassword);
    $stmt->bindParam(':accountID', $accountID, PDO::PARAM_INT);
    $stmt->execute();

    echo json_encode([
        'success' => true,
        'message' => 'Password changed successfully'
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>

