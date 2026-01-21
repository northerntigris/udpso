export class NewsEditor {
    static init() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-edit')) {
                this.openEditModal(e.target.closest('.news-item'));
            }
            
            if (e.target.closest('.btn-delete')) {
                this.deleteNews(e.target.closest('.news-item'));
            }
        });
        
        const editForm = document.getElementById('edit-news-form');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveNews();
            });
        }
    }
    
    static openEditModal(newsItem) {
        const modal = document.getElementById('edit-news-modal');
        if (!modal) {
            console.error('Modal not found!');
            return;
        }

        const title = newsItem.querySelector('.news-title').textContent;
        const content = newsItem.querySelector('p:not(.news-date)').textContent;
        const dateElement = newsItem.querySelector('.news-date');
        
        document.getElementById('news-id').value = newsItem.dataset.id || '';
        document.getElementById('news-title').value = title;
        document.getElementById('news-content').value = content;

        const dateInput = document.getElementById('news-date');
        if (dateInput && dateElement) {
            try {
                const dateText = dateElement.textContent.trim();
                // Парсим дату из текста (формат: "15.04.2023")
                const dateParts = dateText.split(' ').pop().split('.');
                const formattedDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
                dateInput.value = formattedDate;
            } catch (e) {
                console.error('Error parsing date:', e);
                dateInput.value = new Date().toISOString().split('T')[0];
            }
        }
        
        modal.style.display = 'flex'; // Показываем модалку

        // Обработчик закрытия по крестику
        modal.querySelector('.close-modal-edit-news').onclick = () => {
            modal.style.display = 'none';
        };

        // Закрытие по клику вне модалки
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };
    }
    
    static saveNews() {
        const id = document.getElementById('news-id').value;
        const title = document.getElementById('news-title').value;
        const content = document.getElementById('news-content').value;
        const date = document.getElementById('news-date')?.value || new Date().toISOString();
        
        fetch('news.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id, title, content, date })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                location.reload();
            } else {
                alert('Ошибка сохранения: ' + (data.error || 'Неизвестная ошибка'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Ошибка сохранения: ' + error.message);
        });
    }
    
    static deleteNews(newsItem) {
        if (!confirm('Вы уверены, что хотите удалить эту новость?')) return;

        const id = newsItem.dataset.id;
        if (!id) {
            console.error('No ID for news item');
            return;
        }
 
        fetch(`news.php?id=${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                newsItem.remove();
            } else {
                alert('Ошибка удаления: ' + (data.error || 'Неизвестная ошибка'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Ошибка удаления: ' + error.message);
        });
    }
}