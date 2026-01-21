<?php
header('Content-Type: application/json');
require_once 'config.php';

session_start();

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Получение списка новостей - доступно всем
            $stmt = $pdo->query("SELECT * FROM news ORDER BY created_at DESC");
            echo json_encode(['success' => true, 'news' => $stmt->fetchAll()]);
            break;
            
        case 'POST':
            // Создание или обновление новости - только для админов/модераторов
            if (!isset($_SESSION['user_id'])) {
                die(json_encode(['success' => false, 'error' => 'Требуется авторизация']));
            }
            
            if (!in_array($_SESSION['user_role'], ['admin', 'moderator'])) {
                die(json_encode(['success' => false, 'error' => 'Недостаточно прав']));
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $id = $input['id'] ?? null;
            $title = $input['title'];
            $content = $input['content'];
            $date = $input['date'] ?? date('Y-m-d H:i:s');
            
            if ($id) {
                $stmt = $pdo->prepare("UPDATE news SET title = ?, content = ?, created_at = ? WHERE id = ?");
                $stmt->execute([$title, $content, $date, $id]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO news (title, content, created_at) VALUES (?, ?, ?)");
                $stmt->execute([$title, $content, $date]);
                $id = $pdo->lastInsertId();
            }
            
            echo json_encode(['success' => true, 'id' => $id]);
            break;
            
        case 'DELETE':
            // Удаление новости - только для админов/модераторов
            if (!isset($_SESSION['user_id'])) {
                die(json_encode(['success' => false, 'error' => 'Требуется авторизация']));
            }
            
            if (!in_array($_SESSION['user_role'], ['admin', 'moderator'])) {
                die(json_encode(['success' => false, 'error' => 'Недостаточно прав']));
            }
            
            $id = $_GET['id'];
            $stmt = $pdo->prepare("DELETE FROM news WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Метод не поддерживается']);
    }
} catch(PDOException $e) {
    error_log("NEWS.PHP DB ERROR: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Ошибка базы данных']);
}