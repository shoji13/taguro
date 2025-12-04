<?php
if (!isset($_POST['g-recaptcha-response'])) {
    die("CAPTCHA not completed.");
}

$secret = "6LdjKiEsAAAAAGMSninRURARwQB35xiDHQkWZw14";
$response = $_POST['g-recaptcha-response'];

$verify = file_get_contents(
    "https://www.google.com/recaptcha/api/siteverify?secret={$secret}&response={$response}"
);

$result = json_decode($verify);

if ($result->success) {
    // Redirect to your actual site
    header("Location: login.html"); 
    exit();
} else {
    echo "<h2>CAPTCHA failed. Please go back and try again.</h2>";
}
?>
