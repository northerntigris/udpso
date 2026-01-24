<?php
require_once __DIR__ . '/../config.php';
header('Content-Type: application/json; charset=utf-8');
session_start();

try {
    if (!isset($_SESSION['user_id']) || ($_SESSION['user_role'] ?? '') !== 'organizer') {
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

    $id = isset($input['id']) ? (int)$input['id'] : 0;
    $title = trim((string)($input['title'] ?? ''));
    $subject = trim((string)($input['subject'] ?? ''));
    $datetime = trim((string)($input['datetime'] ?? ''));
    $grades = trim((string)($input['grades'] ?? ''));
    $description = trim((string)($input['description'] ?? ''));

    if ($id <= 0 || $title === '' || $subject === '' || $datetime === '' || $grades === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Заполните обязательные поля'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $stmt = $pdo->prepare("SELECT school_id FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $schoolId = (int)$stmt->fetchColumn();

    if ($schoolId <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Не определена школа организатора'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $stmt = $pdo->prepare("SELECT id FROM olympiads WHERE id = ? AND school_id = ?");
    $stmt->execute([$id, $schoolId]);
    if (!$stmt->fetchColumn()) {
        http_response_code(403);
        echo json_encode(['error' => 'Нет доступа к олимпиаде'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $datetimeValue = str_replace('T', ' ', $datetime);

    $stmt = $pdo->prepare("
        UPDATE olympiads
        SET title = ?, subject = ?, datetime = ?, grades = ?, description = ?
        WHERE id = ?
    ");
    $stmt->execute([$title, $subject, $datetimeValue, $grades, $description, $id]);

    echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка обновления олимпиады'], JSON_UNESCAPED_UNICODE);
}
?>
