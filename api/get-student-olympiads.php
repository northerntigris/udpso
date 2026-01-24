<?php
// api/get-student-olympiads.php
require_once __DIR__ . '/../config.php';
header('Content-Type: application/json; charset=utf-8');
session_start();

try {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $studentId = (int)$_SESSION['user_id'];

    // имя ученика
    $nameStmt = $pdo->prepare("SELECT full_name FROM users WHERE id = ? LIMIT 1");
    $nameStmt->execute([$studentId]);
    $studentName = $nameStmt->fetchColumn() ?: '';

    // Проверяем наличие таблиц файлов (чтобы не падать на LEFT JOIN)
    $hasTaskFiles = (bool)$pdo->query("
        SELECT 1 FROM information_schema.tables
        WHERE table_schema='public' AND table_name='olympiad_task_files'
        LIMIT 1
    ")->fetchColumn();

    $hasWorkFiles = (bool)$pdo->query("
        SELECT 1 FROM information_schema.tables
        WHERE table_schema='public' AND table_name='participant_work_files'
        LIMIT 1
    ")->fetchColumn();

    $taskFileSelect = $hasTaskFiles
        ? "(SELECT id FROM olympiad_task_files WHERE olympiad_id = o.id ORDER BY id DESC LIMIT 1) AS task_file_id"
        : "NULL AS task_file_id";

    $workFileSelect = $hasWorkFiles
        ? "(SELECT id FROM participant_work_files WHERE olympiad_id = o.id AND student_id = op.student_id ORDER BY id DESC LIMIT 1) AS work_file_id"
        : "NULL AS work_file_id";

    $sql = "
        SELECT
            o.id,
            o.title,
            o.subject,
            o.datetime,
            o.status,
            op.score,

            CASE
              WHEN op.score IS NULL THEN NULL
              ELSE RANK() OVER (PARTITION BY op.olympiad_id ORDER BY op.score DESC NULLS LAST)
            END AS place,

            $taskFileSelect,
            $workFileSelect

        FROM olympiad_participants op
        JOIN olympiads o ON o.id = op.olympiad_id
        WHERE op.student_id = :student_id
        ORDER BY o.datetime DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':student_id' => $studentId]);
    $olympiads = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'name' => $studentName,
        'olympiads' => $olympiads
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Ошибка загрузки олимпиад ученика',
        // 'details' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>