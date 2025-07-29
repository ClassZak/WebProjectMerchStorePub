// Данные и объекты страницы
var manufacturers;
var goods;
var csrfToken = undefined;
// Константные выражения
const deleteManufacturerConfirmMessage='Вы уверены, что хотите удалить производителя';
const deleteGoodConfirmMessage='Вы уверены, что хотите удалить товар';
// Общие функции
function handleUnknownError(error){
	const message = `Неизвестная ошибка: "${error}"`;
	alert(message);
	console.log(message);
}
function openModal(modalId) {
	document.getElementById(modalId).style.display = 'flex';
	document.body.classList.add('no-scroll');
};
function closeModal(modalId) {
	document.getElementById(modalId).style.display = 'none';
	document.body.classList.remove('no-scroll');
};
// Создание каточек
function createManufacturerCard(element) {
	// Создаем DOM-структуру без обработчиков событий
	const card = document.createElement('div');
	card.setAttribute('data-element-id',element.id)
	card.classList.add('card','shadow-card');
	
	card.innerHTML = `
		<div class="card">
			<p>Название</p>
			<h4 class="card-title">${escapeHtml(element.name)}</h4>
		</div>
		<div class="card-button-div">
			<button class="square-btn update-btn" onclick="updateManufacturer(${element.id})" data-id="${element.id}">
				<strong>✎</strong>
			</button>
			<button class="square-btn delete-btn" onclick="deleteManufacturer(${element.id})" data-id="${element.id}">
				<strong>🗑</strong>
			</button>
		</div>
	`

	return card
}
async function createGoodCard(element){
	while(manufacturers===undefined);
	let manufacturer=manufacturers.find(x=>x.id==element.id_manufacturer);

	const card = document.createElement('div');
	card.setAttribute('data-element-id',element.id);
	card.classList.add('card', 'good-card', 'shadow-card');

	card.innerHTML = `
		<div class="card-content">
			<div class="one-image">
				<img src="data:image/*;base64,${element.image.slice(2, -1)}" alt="${escapeHtml(element.name)}">
			</div>
			<div class="card-description">
				<h4 class="card-title">${escapeHtml(element.name)}</h4>
				<h4 class="card-title">
				${Intl.NumberFormat('ru-RU',{style: 'currency', currency: 'RUB'}).format(element.price)}
				</h4>
				<h5 class="card-title">${escapeHtml(element.description)}</h5>
				<p>Производитель:</p>
				<h4 class="card-title">${manufacturer && manufacturer.name ? manufacturer.name: 'Незвестен'}</h4>
				<p>Дата появления в ассортименте:</p>
				<h4 class="card-title">${element.appearance_date}</h4>
			</div>
		</div>
		<div class="card-button-div">
			<button class="square-btn" onclick="updateGood(${element.id})"><strong>✎</strong></button>
			<button class="square-btn" onclick="deleteGood(${element.id})"><strong>🗑</strong></button>
		</div>
	`

	return card;
}



/**
 * Производители
 */
async function loadManufacturersToArray(){
	let response = await fetch('/api/manufacturers/');
	
	const container=document.getElementById('manufacturers_grid');
	container.innerHTML='';

	let message = '';
	try{
		if(!response.ok) {
			message = (await response.json()).error
			throw new Error(`Статус запроса: ${response.status}\nОшибка: ${message}`);
		}

		let elements = await response.json();
		manufacturers=elements.manufacturers;
		manufacturers.forEach(element => container.appendChild(createManufacturerCard(element)));
		loadManufacturersToSelects();
	}
	catch(error){
		console.log(error);
		showError(message);
	}
}
function loadManufacturersToSelects(){
	let createSelect = document.getElementById('manufacturer_select_for_good_create');
	manufacturers.forEach(element => {
		const option = document.createElement('option');
		option.value = element.id;
		option.textContent = element.name;
		createSelect.appendChild(option);
	});
	let updateSelect = document.getElementById('manufacturer_select_for_good_update');
	manufacturers.forEach(element => {
		const option = document.createElement('option');
		option.value = element.id;
		option.textContent = element.name;
		updateSelect.appendChild(option);
	});
}



function deleteManufacturerFromHTML(id){
	const card = document.querySelector(`.card[data-element-id="${id}"]`);
	if(card)
		card.remove();
}
async function deleteManufacturerFromDB(id){
	const manufacturer = manufacturers.find(x => x.id==id)

	await fetch(`/api/manufacturers/${id}`, {method: "DELETE", headers: { 'X-CSRFToken': csrfToken}})
	.then(response => response.json())
	.then(data => {
		if(data.error){
			alert(`Ошибка удаление поставщика "${manufacturer.name}": ${data.error}`);
			loadManufacturersToArray();
		} else{
			alert(`Поставщик "${manufacturer.name}" успешно удалён`);
			manufacturers=manufacturers.filter(element=>element.id!=id);
		}
	})
	.catch(error =>{ 
		handleUnknownError(error);
		loadManufacturersToArray();
	});
}
function deleteManufacturer(id) {
	const manufacturer = manufacturers.find(x => x.id==id)
	if(manufacturer === undefined || manufacturer===NaN)
		return;

	const modal = document.querySelector('#delete_manufacturers_form_overlay .modal');
	modal.setAttribute('data-element-id', id);
	openModal('delete_manufacturers_form_overlay');
	setDeleteConfirmMessage(
		'delete_manufacturers_confirm_message',
		deleteManufacturerConfirmMessage, 
		manufacturer.name
	);
}
async function handleDeleteManufacturerConfirm() {
	const modal = document.querySelector('#delete_manufacturers_form_overlay .modal');
	const id = modal.getAttribute('data-element-id');
	
	if (!id) return;
	
	let res= await deleteManufacturerFromDB(id);
	if (!manufacturers.find(x=>x.id==id))
		deleteManufacturerFromHTML(id);
	else
		alert('Не удалось удалить объект');
	closeModal('delete_manufacturers_form_overlay');

	modal.removeAttribute('data-element-id');
}
function setDeleteConfirmMessage(elementId, text, object){
	const container=document.getElementById(elementId);
	container.textContent=`${text} "${object}"?`;
}



async function updateManufacturer(id) {
	const manufacturer = manufacturers.find(x => x.id==id)
	
	let element=document.getElementById('edit_manufacturers_form');
	element.setAttribute('data-element-id',id);
	openModal('edit_manufacturers_form_overlay');

	// TODO: доработать
	/*let updatedGoods = goods.filter(x=> x.id_manufacturer == id);
	updatedGoods.forEach(element=>{
		element.id_manufacturer 
	});*/
	loadGoods();
}










/**
 * Товары
 */
async function loadGoods() {
	let response = await fetch('/api/goods/', {method: 'get'});

	const container = document.getElementById('goods_grid');
	container.innerHTML = '';

	let message = '';
	try {
		if(!response.ok)
		{
			message = (await response.json()).error;
			throw new  Error(`Статус запроса: ${response.status}\nОшибка: ${message}`);
		}
		
		let elements = await response.json();
		goods = elements.goods;
		goods.forEach(async element => {
			container.appendChild(await createGoodCard(element));
		});
	} catch (error) {
		console.log(error);
		showError(message);
	}
}
function deleteGoodFromHTML(id){
	const card = document.querySelector(`.good-card[data-element-id="${id}"]`);
	if (card)
		card.remove();
}
async function deleteGoodFromDB(id){
	element = goods.find(x=>x.id==id);

	await fetch(`/api/goods/${id}`, {method : 'DELETE', headers:{ 'X-CSRFToken': csrfToken}})
	.then(response => response.json())
	.then(data=>{
		if (data.error)	{
			alert(`Ошибка удаления товара ${element.name}`);
			loadGoods();
		} else{
			alert(`Товар "${element.name}" успешно удалён`);
			goods=goods.filter(element=>element.id!=id);
		}
	}).catch(error=>{
		handleUnknownError(error);
		loadGoods();
	});
}
async function handleDeleteGoodConfirm() {
	const modal = document.querySelector('#delete_goods_form_overlay .modal');
	const id = modal.getAttribute('data-element-id');
	
	if (!id) return;
	
	await deleteGoodFromDB(id);
	if (!goods.find(x=>x.id==id))
		deleteGoodFromHTML(id);
	else
		alert('Не удалось удалить объект');
	closeModal('delete_goods_form_overlay');

	modal.removeAttribute('data-element-id');
}
function deleteGood(id) {
	const element = goods.find(x => x.id==id)
	if(element === undefined || element===NaN)
		return;

	const modal = document.querySelector('#delete_goods_form_overlay .modal');
	modal.setAttribute('data-element-id', id);
	openModal('delete_goods_form_overlay');
	setDeleteConfirmMessage(
		'delete_goods_confirm_message',
		deleteGoodConfirmMessage, 
		element.name
	);
}


async function updateGood(id) {
	const element = goods.find(x => x.id==id)
	
	let htmlElement=document.getElementById('edit_goods_form');
	htmlElement.setAttribute('data-element-id',id);
	openModal('edit_goods_form_overlay');
}
















// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
	// Закрытие при клике вне модального окна
	// Производители
	document.getElementById('create_manufacturers_form_overlay')?.addEventListener('click', function(e) {
		if (e.target === this) closeModal('create_manufacturers_form_overlay');
	});

	
	// Кастомизация выбора файлов
	document.querySelectorAll('.modal-form').forEach(form => {
		// Находим элементы внутри конкретной формы
		const fileInput = form.querySelector('input[type="file"]');
		const fileButton = form.querySelector('.file-select-button');
		const fileNameDisplay = form.querySelector('.file-name-display');
		
		if (fileInput && fileButton && fileNameDisplay) {
			// Обработчик для кастомной кнопки
			fileButton.addEventListener('click', () => fileInput.click());
			
			// Обработчик изменения файла
			fileInput.addEventListener('change', function() {
				fileNameDisplay.textContent = this.files.length 
					? this.files[0].name 
					: 'Файлов не выбрано';
			});
		}
	});




	// Формы для производителей
	// Обработка отправки формы
	document.getElementById('create_manufacturers_form')?.addEventListener('submit', function(e) {
		e.preventDefault();
		
		/* Поля formData:
		name		string
		csrf_token	string	*/
		const formData = new FormData(this);
		
		fetch(this.action, {
			method: 'POST',
			body: formData,
			headers: {
				'X-CSRFToken': csrfToken
			}
		})
		.then(response => response.json())
		.then(data => {
			if (data.error) {
				alert(data.error);
			} else {
				if(data.id!=0)
					alert(`Успешно добавлен новый производитель \"${formData.get('name')}\"`);
				closeModal('create_manufacturers_form_overlay');
				loadManufacturersToArray();
			}
		})
		.catch(error => {
			console.error('Ошибка:', error);
			alert('Произошла ошибка при отправке формы');
		});
	});
	// Обработка формы редактирования
	document.getElementById('edit_manufacturers_form')?.addEventListener('submit', function(e){
		e.preventDefault();
		
		/* Поля formData:
		name		string
		csrf_token	string	*/
		const formData = new FormData(this);
		const formDataObject = getFormObject(this);
		
		fetch(this.action+this.getAttribute('data-element-id'),{
			method: 'PUT',
			body: formData,
			headers: {
				'X-CSRFToken': csrfToken
			}
		})
		.then(response => response.json())
		.then(data => {
			console.log(data);
			if(data.error){
				alert(data.error);
			} else {
				if(data.id!=0)
					alert(`Успешно изменены данные производителя \"${formDataObject.name}\"`);
				closeModal('edit_manufacturers_form_overlay');
				loadManufacturersToArray();
			}
		})
		.catch(error =>{
			console.error('Ошибка:', error);
			alert('Произошла ошибка при отправке формы');
		});
	});








	// Формы для товаров
	// Обработка отправки формы
	document.getElementById('create_goods_form')?.addEventListener('submit', function(e) {
		e.preventDefault();

		/* Поля formData:
		name			string
		description		string,
		image			string (base64),
		price			number,
		appearanceDate	string,
		id_manufacturer	number,
		csrf_token		string	*/

		// Проверка наличия файла
		const fileInput = this.querySelector('input[type="file"]');
		if (!fileInput.files.length) {
			alert('Пожалуйста, выберите изображение товара');
			return;
		}

		// Создаем FormData и добавляем все поля кроме файла
		const formData = new FormData();
		formData.append('name', this.querySelector('[name="name"]').value);
		formData.append('description', this.querySelector('[name="description"]').value);
		formData.append('price', this.querySelector('[name="price"]').value);
		formData.append('appearance_date', this.querySelector('[name="appearance_date"]').value);
		formData.append('id_manufacturer', this.querySelector('[name="id_manufacturer"]').value);
		formData.append('csrf_token', csrfToken);

		// Преобразуем изображение в base64
		const file = fileInput.files[0];
		const reader = new FileReader();

		reader.onload = function() {
			// Получаем base64 строку (без префикса data:image/...;base64,)
			const base64String = reader.result.split(',')[1];
			
			// Добавляем base64 в formData
			formData.append('image', base64String);

			// Отправляем данные
			fetch(e.target.action, {
				method: 'POST',
				body: formData,
				headers: {
					'X-CSRFToken': csrfToken
				}
			})
			.then(response => {
				// Проверяем, что ответ в формате JSON
				const contentType = response.headers.get('content-type');
				if (contentType && contentType.includes('application/json'))
					return response.json();

				throw new TypeError(`Незвестная ошибка. ${response.status} ${response.statusText}`);
			})
			.then(data => {
				if (data.error) {
					alert(data.error);
				} else {
					alert(`Успешно добавлен новый товар \"${formData.get('name')}\"`);
					closeModal('create_goods_form_overlay');
					loadGoods(); // Обновляем список товаров
				}
			})
			.catch(error => {
				console.error('Ошибка:', error);
				alert('Произошла ошибка при отправке формы: ' + error.message);
			});
		};

		reader.onerror = function(error) {
			console.error('Ошибка чтения файла:', error);
			alert('Ошибка при чтении файла изображения');
		};

		// Начинаем чтение файла
		reader.readAsDataURL(file);
	});
	// Обработка формы редактирования
	document.getElementById('edit_goods_form')?.addEventListener('submit', function(e){
		e.preventDefault();
		
		/* Поля formData:
		name			string
		description		string,
		image			string (base64),
		price			number,
		appearanceDate	string,
		id_manufacturer	number,
		csrf_token		string	*/

		// Проверка наличия файла
		const fileInput = this.querySelector('input[type="file"]');
		if (!fileInput.files.length) {
			alert('Пожалуйста, выберите изображение товара');
			return;
		}

		// Создаем FormData и добавляем все поля кроме файла
		const formData = new FormData();
		formData.append('name', this.querySelector('[name="name"]').value);
		formData.append('description', this.querySelector('[name="description"]').value);
		formData.append('price', this.querySelector('[name="price"]').value);
		formData.append('appearance_date', this.querySelector('[name="appearance_date"]').value);
		formData.append('id_manufacturer', this.querySelector('[name="id_manufacturer"]').value);
		formData.append('csrf_token', csrfToken);

		// Преобразуем изображение в base64
		const file = fileInput.files[0];
		const reader = new FileReader();

		const updateUrl = this.action+this.getAttribute('data-element-id');
		reader.onload = function() {
			// Получаем base64 строку (без префикса data:image/...;base64,)
			const base64String = reader.result.split(',')[1];
			
			// Добавляем base64 в formData
			formData.append('image', base64String);
			const formDataObject = getFormObject(formData);


			// Отправляем данные
			fetch(updateUrl, {
				method: 'PUT',
				body: formData,
				headers: {
					'X-CSRFToken': csrfToken
				}
			})
			.then(response => {
				// Проверяем, что ответ в формате JSON
				const contentType = response.headers.get('content-type');
				if (contentType && contentType.includes('application/json')) {
					return response.json();
				}
				throw new TypeError('Ответ сервера не в формате JSON');
			})
			.then(data => {
				if (data.error) {
					alert(data.error);
				} else {
					alert(`Успешно изменены данные товара \"${formDataObject.name}\"`);
					closeModal('edit_goods_form_overlay');
					loadGoods(); // Обновляем список товаров
				}
			})
			.catch(error => {
				console.error('Ошибка:', error);
				alert('Произошла ошибка при отправке формы: ' + error.message);
			});
		};

		reader.onerror = function(error) {
			console.error('Ошибка чтения файла:', error);
			alert('Ошибка при чтении файла изображения');
		};

		// Начинаем чтение файла
		reader.readAsDataURL(file);
	});





	
	// Загрузки данных при запуске страницы
	setTimeout(function(){
		loadManufacturersToArray();
		loadGoods();
	}, 500);
});