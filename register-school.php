<?php
header('Content-Type: application/json');
require_once 'config.php';

$input = json_decode(file_get_contents('php://input'), true);

try {
    // Проверяем обязательные поля
    $requiredFields = [
        'full_name', 'short_name', 'inn', 'ogrn', 'ogrn_date', 
        'address', 'region', 'director_fio', 'director_inn', 'director_position',
        'contact_phone', 'contact_email'
    ];
    
    foreach ($requiredFields as $field) {
        if (empty($input[$field])) {
            throw new Exception("Не заполнено обязательное поле: $field");
        }
    }
    
    // Валидация email
    if (!filter_var($input['contact_email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception("Некорректный email адрес");
    }
    
    // Валидация ИНН (10 или 12 цифр)
    if (!preg_match('/^\d{10,12}$/', $input['inn'])) {
        throw new Exception("ИНН должен содержать 10 или 12 цифр");
    }
    
    // Валидация ОГРН (13 цифр)
    if (!preg_match('/^\d{13}$/', $input['ogrn'])) {
        throw new Exception("ОГРН должен содержать 13 цифр");
    }
    
    // Валидация ИНН руководителя (12 цифр)
    if (!preg_match('/^\d{12}$/', $input['director_inn'])) {
        throw new Exception("ИНН руководителя должен содержать 12 цифр");
    }
    
    // Сохраняем заявку в базу данных
    $stmt = $pdo->prepare("
        INSERT INTO school_registrations (
            full_name, short_name, inn, ogrn, ogrn_date, address, region,
            director_fio, director_inn, director_position,
            contact_phone, contact_email, created_at, status
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'pending'
        )
    ");
    
    $stmt->execute([
        $input['full_name'],
        $input['short_name'],
        $input['inn'],
        $input['ogrn'],
        $input['ogrn_date'],
        $input['address'],
        $input['region'],
        $input['director_fio'],
        $input['director_inn'],
        $input['director_position'],
        $input['contact_phone'],
        $input['contact_email']
    ]);
    
    echo json_encode(['success' => true]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Ошибка базы данных: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
