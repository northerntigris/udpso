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

    $olympiadId = isset($_POST['olympiad_id']) ? (int)$_POST['olympiad_id'] : 0;
    $studentId = isset($_POST['student_id']) ? (int)$_POST['student_id'] : 0;

    if ($olympiadId <= 0 || $studentId <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Некорректные данные'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $stmt = $pdo->prepare("
        SELECT o.status
        FROM olympiad_jury oj
        JOIN jury_members jm ON oj.jury_member_id = jm.id
        JOIN olympiads o ON oj.olympiad_id = o.id
        WHERE oj.olympiad_id = ? AND jm.user_id = ? AND oj.jury_role = 'председатель жюри'
        LIMIT 1
    ");
    $stmt->execute([$olympiadId, (int)$_SESSION['user_id']]);
    $status = $stmt->fetchColumn();
    if (!$status) {
        http_response_code(403);
        echo json_encode(['error' => 'Нет доступа к загрузке файлов'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    if ($status !== 'completed') {
        http_response_code(400);
        echo json_encode(['error' => 'Загрузка файлов доступна только после завершения олимпиады'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (!isset($_FILES['work_file']) || $_FILES['work_file']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => 'Файл не загружен'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $fileName = $_FILES['work_file']['name'];
    $mimeType = $_FILES['work_file']['type'] ?? null;
    $fileData = file_get_contents($_FILES['work_file']['tmp_name']);

    $deleteStmt = $pdo->prepare("
        DELETE FROM participant_work_files
        WHERE olympiad_id = ? AND student_id = ?
    ");
    $deleteStmt->execute([$olympiadId, $studentId]);

    $stmt = $pdo->prepare("
        INSERT INTO participant_work_files (olympiad_id, student_id, file_name, mime_type, file_data)
        VALUES (?, ?, ?, ?, ?)
        RETURNING id
    ");
    $stmt->execute([$olympiadId, $studentId, $fileName, $mimeType, $fileData]);
    $fileId = (int)$stmt->fetchColumn();

    echo json_encode(['success' => true, 'file_id' => $fileId], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка загрузки файла'], JSON_UNESCAPED_UNICODE);
}
?>
