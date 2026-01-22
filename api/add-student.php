<?php
// api/add-student.php

require_once __DIR__ . '/../config.php';
header('Content-Type: application/json; charset=utf-8');
session_start();

try {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Данные могут приходить как JSON (fetch) или как обычный POST form-data
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data)) $data = $_POST;

    $fullName = trim((string)($data['full_name'] ?? ''));
    $age      = isset($data['age']) ? (int)$data['age'] : null;
    $grade    = isset($data['grade']) ? (int)$data['grade'] : null;

    $snils    = trim((string)($data['snils'] ?? ''));
    $email    = trim((string)($data['email'] ?? ''));

    $username = trim((string)($data['username'] ?? ''));
    $password = (string)($data['password'] ?? '');

    // Школа обычно берётся от организатора (как у тебя по проекту)
    $schoolId = isset($_SESSION['school_id']) ? (int)$_SESSION['school_id'] : null;
    if ($schoolId === null || $schoolId <= 0) {
        $stmt = $pdo->prepare("SELECT school_id FROM users WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        $schoolId = (int)$stmt->fetchColumn();
    }

    if ($schoolId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Не определена школа организатора'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Валидация
    if ($fullName === '' || $username === '' || $password === '' || $grade === null) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Заполните обязательные поля'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $snilsDigits = preg_replace('/\\D+/', '', $snils);
    if ($snilsDigits !== '' && strlen($snilsDigits) !== 11) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'СНИЛС должен содержать 11 цифр'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Хеш пароля
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $pdo->beginTransaction();

    // Вставка пользователя-ученика с RETURNING
    $stmt = $pdo->prepare("
        INSERT INTO users (username, password, role, full_name, age, grade, snils, email, school_id)
        VALUES (:username, :password, 'student', :full_name, :age, :grade, :snils, :email, :school_id)
        RETURNING id
    ");

    $stmt->execute([
        ':username'  => $username,
        ':password'  => $passwordHash,
        ':full_name' => $fullName,
        ':age'       => $age,
        ':grade'     => $grade,
        ':snils'     => ($snilsDigits !== '' ? $snilsDigits : null),
        ':email'     => ($email !== '' ? $email : null),
        ':school_id' => $schoolId
    ]);

    $studentId = (int)$stmt->fetchColumn();

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'student_id' => $studentId
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    // Частая ошибка при UNIQUE(username)
    // Postgres: SQLSTATE 23505 unique_violation
    $code = (int)http_response_code();
    if ($code < 400) $code = 500;

    http_response_code($code);
    echo json_encode([
        'success' => false,
        'error' => 'Ошибка добавления ученика',
        // 'details' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

?>
