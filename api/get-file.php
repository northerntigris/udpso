<?php
// api/get-file.php
require_once __DIR__ . '/../config.php';
session_start();

try {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        exit('Unauthorized');
    }

    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    $type = $_GET['type'] ?? '';

    if ($id <= 0 || !in_array($type, ['task', 'work'], true)) {
        http_response_code(400);
        exit('Bad request');
    }

    if ($type === 'task') {
        $stmt = $pdo->prepare("SELECT file_name, mime_type, file_data FROM olympiad_task_files WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
    } else {
        $stmt = $pdo->prepare("SELECT file_name, mime_type, file_data FROM participant_work_files WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
    }

    $file = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$file) {
        http_response_code(404);
        exit('Not found');
    }

    $fileName = $file['file_name'] ?: 'file';
    $mimeType = $file['mime_type'] ?: 'application/octet-stream';

    header('Content-Type: ' . $mimeType);
    header('Content-Disposition: attachment; filename="' . basename($fileName) . '"');
    header('Content-Length: ' . strlen($file['file_data']));
    echo $file['file_data'];
} catch (Throwable $e) {
    http_response_code(500);
    exit('Server error');
}
?>