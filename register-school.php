<?php
header('Content-Type: application/json');
require_once 'config.php';

$input = json_decode(file_get_contents('php://input'), true);

try {
    // Проверяем обязательные поля
    $requiredFields = [
        'full_name', 'address', 'ogrn', 'registration_date',
        'director_fio', 'director_inn', 'director_position'
    ];
    
    foreach ($requiredFields as $field) {
        if (empty($input[$field])) {
            throw new Exception("Не заполнено обязательное поле: $field");
        }
    }
    
    // Валидация ОГРН (13 цифр)
    if (!preg_match('/^\d{13}$/', $input['ogrn'])) {
        throw new Exception("ОГРН должен содержать 13 цифр");
    }
    
    // Валидация ИНН руководителя (12 цифр)
    if (!preg_match('/^\d{12}$/', $input['director_inn'])) {
        throw new Exception("ИНН руководителя должен содержать 12 цифр");
    }

    if (!empty($input['contact_email']) && !filter_var($input['contact_email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception("Некорректный email адрес");
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
    
    $shortName = $input['short_name'] ?? $input['full_name'];
    $inn = $input['inn'] ?? '';
    $region = $input['region'] ?? '';
    $contactPhone = $input['contact_phone'] ?? '';
    $contactEmail = $input['contact_email'] ?? '';

    $stmt->execute([
        $input['full_name'],
        $shortName,
        $inn,
        $input['ogrn'],
        $input['registration_date'],
        $input['address'],
        $region,
        $input['director_fio'],
        $input['director_inn'],
        $input['director_position'],
        $contactPhone,
        $contactEmail
    ]);
    
    echo json_encode(['success' => true]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Ошибка базы данных: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
