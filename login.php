<?php
header('Content-Type: application/json');
require_once 'config.php';

// Получаем сырые данные POST (для JSON)
$input = json_decode(file_get_contents('php://input'), true);

$username = $input['username'] ?? '';
$password = $input['password'] ?? '';

// Проверяем пользователя
$stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
$stmt->execute([$username]);
$user = $stmt->fetch();

if ($user && password_verify($password, $user['password'])) {
    // Успешная авторизация
    session_start();
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_role'] = $user['role'];
    
    echo json_encode([
        'success' => true,
        'user_id' => $user['id'],
        'user_role' => $user['role']
    ]);
} else {
    // Ошибка
    echo json_encode([
        'success' => false,
        'error' => 'Неверный логин или пароль'
    ]);
}
?>