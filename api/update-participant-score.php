<?php
require_once __DIR__ . '/../config.php';
header('Content-Type: application/json; charset=utf-8');
session_start();

try {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        http_response_code(400);
        echo json_encode(['error' => 'Некорректный JSON'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $olympiadId = isset($input['olympiad_id']) ? (int)$input['olympiad_id'] : 0;
    $studentId = isset($input['student_id']) ? (int)$input['student_id'] : 0;
    $score = $input['score'] ?? null;

    if ($olympiadId <= 0 || $studentId <= 0 || $score === null || $score === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Заполните обязательные поля'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $scoreValue = filter_var($score, FILTER_VALIDATE_FLOAT);
    if ($scoreValue === false) {
        http_response_code(400);
        echo json_encode(['error' => 'Некорректный формат баллов'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $stmt = $pdo->prepare("
        SELECT 1
        FROM olympiad_jury oj
        JOIN jury_members jm ON oj.jury_member_id = jm.id
        WHERE oj.olympiad_id = ? AND jm.user_id = ? AND oj.jury_role = 'председатель жюри'
    ");
    $stmt->execute([$olympiadId, (int)$_SESSION['user_id']]);
    if (!$stmt->fetchColumn()) {
        http_response_code(403);
        echo json_encode(['error' => 'Нет доступа к выставлению баллов'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $stmt = $pdo->prepare("
        UPDATE olympiad_participants
        SET score = ?
        WHERE olympiad_id = ? AND student_id = ?
    ");
    $stmt->execute([$scoreValue, $olympiadId, $studentId]);

    echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка сохранения баллов'], JSON_UNESCAPED_UNICODE);
}
?>
