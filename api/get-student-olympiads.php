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

    /*
      Логика запроса:
      - берём все олимпиады, где studentId есть в olympiad_participants
      - добавляем score
      - (опционально) подтягиваем id файлов заданий и работы, если такие таблицы есть:
        - olympiad_task_files (по olympiad_id)
        - participant_work_files (по olympiad_id + student_id)
      Если у тебя таблицы/поля называются чуть иначе — скажи, я подгоню.
    */

    $sql = "
        SELECT
            o.id,
            o.title,
            o.subject,
            o.datetime,
            o.grades,
            o.status,
            o.description,
            op.score,

            -- файл заданий (если есть таблица)
            tf.id  AS task_file_id,

            -- файл работы участника (если есть таблица)
            wf.id  AS work_file_id

        FROM olympiad_participants op
        JOIN olympiads o
          ON o.id = op.olympiad_id

        LEFT JOIN olympiad_task_files tf
          ON tf.olympiad_id = o.id

        LEFT JOIN participant_work_files wf
          ON wf.olympiad_id = o.id
         AND wf.student_id  = op.student_id

        WHERE op.student_id = :student_id
        ORDER BY o.datetime DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':student_id' => $studentId]);

    $olympiads = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
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