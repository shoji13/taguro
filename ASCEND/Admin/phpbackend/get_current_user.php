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

try {
    // Get current user information from session
    $accountID = $_SESSION['AccountID'];
    
    // Fetch full user data from database
    $stmt = $conn->prepare("
        SELECT 
            AccountID,
            AccountUsername,
            AccountName,
            AccountEmail,
            AccountRole
        FROM accounts 
        WHERE AccountID = :accountID
    ");
    $stmt->bindParam(':accountID', $accountID, PDO::PARAM_INT);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        throw new Exception('User not found');
    }
    
    $accountUsername = $user['AccountUsername'] ?? '';
    $accountName = $user['AccountName'] ?? '';
    $accountEmail = $user['AccountEmail'] ?? '';
    $accountRole = $user['AccountRole'] ?? '';
    
    // Calculate initials from AccountName (first letters of words) or from username
    $initials = '';
    if (!empty($accountName)) {
        // Extract first letters from each word in the name
        $words = preg_split('/\s+/', trim($accountName));
        $initials = '';
        foreach ($words as $word) {
            if (!empty($word)) {
                $initials .= strtoupper($word[0]);
            }
        }
        // Limit to 2 characters
        $initials = substr($initials, 0, 2);
    } else if (!empty($accountUsername)) {
        // Fallback to first letter of username
        $initials = strtoupper(substr($accountUsername, 0, 1));
    } else {
        $initials = 'U';
    }
    
    echo json_encode([
        'success' => true,
        'id' => intval($user['AccountID']),
        'username' => $accountUsername,
        'name' => $accountName,
        'email' => $accountEmail,
        'role' => $accountRole,
        'initials' => $initials
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error: ' . $e->getMessage()
    ]);
}
?>

