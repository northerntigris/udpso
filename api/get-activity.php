<?php
header('Content-Type: application/json');
require_once '../config.php';

session_start();

if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'admin') {
    die(json_encode(['success' => false, 'error' => 'Доступ запрещен']));
}

$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 5;

try {
    $stmt = $pdo->prepare("
        SELECT 
            a.*,
            u.username as user_name
        FROM activities a
        LEFT JOIN users u ON a.user_id = u.id
        ORDER BY a.created_at DESC 
        LIMIT :limit
    ");
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $activities = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'activities' => $activities
    ]);

} catch(PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Ошибка базы данных']);
}
?>