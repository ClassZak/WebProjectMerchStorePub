var goods;
var manufacturers;



async function loadManufacturersToArray(){
	let response = await fetch('/api/manufacturers/');

	let message = '';
	try{
		if(!response.ok) {
			message = (await response.json()).error
			throw new Error(`Статус запроса: ${response.status}\nОшибка: ${message}`);
		}

		let elements = await response.json();
		manufacturers=elements.manufacturers;
	}
	catch(error){
		console.log(error);
		showError(message);
	}
}
async function loadGoodsToArray(apiRoute='') {
	let response = await fetch('/api/goods/'+apiRoute);

	let message = '';
	try{
		if(!response.ok){
			message = (await response.json()).error;
			throw new Error(`Статус запроса: ${response.status}\nОшибка: ${message}`);
		}

		let elements = await response.json();
		goods = elements.goods;
	}
	catch(error){
		console.log(error);
		showError(message);
	}
}




async function createGoodCard(element) {
	while (manufacturers === undefined);
	let manufacturer = manufacturers.find(x => x.id == element.id_manufacturer);

	const card = document.createElement('a');
	card.href = `/good/${element.id}`;
	card.classList.add('card', 'good-card', 'shadow-card');
	card.style.display = 'flex'; // Добавляем flex для карточки
	card.style.flexDirection = 'column'; // Вертикальное расположение
	card.style.height = '100%'; // Занимаем всю высоту

	card.innerHTML = `
		<div class="image-container">
			<img src="data:image/*;base64,${element.image.slice(2, -1)}" 
				alt="${escapeHtml(element.name)}">
		</div>
		<div class="card-content">
			<h4 class="card-title">${escapeHtml(element.name)}</h4>
			<h4 class="card-price">
				${Intl.NumberFormat('ru-RU', {style: 'currency', currency: 'RUB'}).format(element.price)}
			</h4>
			
			<p class="card-desc">${escapeHtml(element.description)}</p>
			<div class="secondary-info card-bottom">
				<div>
					<p style="display:inline-block">Производитель:</p>
					<h4 class="card-title card-manufacturer" style="display:inline-block">${manufacturer && manufacturer.name ? manufacturer.name: 'Незвестен'}</h4>
				</div>
				<div>
					<p style="display:inline-block">Дата появления:</p>
					<h4 class="card-title card-date" style="display:inline-block">${element.appearance_date}</h4>
				</div>
			</div>
		</div>
	`;

	return card;
}

async function loadGoods(elementId, apiRoute = '') {
	try {
		const container = document.getElementById(elementId);
		container.innerHTML = '';
		await loadGoodsToArray(apiRoute);
		
		if (goods)
		goods.forEach(async element => {
			const col = document.createElement('div');
			col.className = "col-xl-2 col-lg-3 col-md-4 col-sm-6 col-xs-12";
			
			const card = await createGoodCard(element);
			col.appendChild(card);
			container.appendChild(col);
		});
	} catch (error) {
		console.log(error);
		showError(error)
	}
}

function createGoodsCards(elementId){
	const container = document.getElementById(elementId);
	container.innerHTML = '';
	goods.forEach(async element => {
		const col = document.createElement('div');
		col.className = "col-xl-2 col-lg-3 col-md-4 col-sm-6 col-xs-12";
		
		const card = await createGoodCard(element);
		col.appendChild(card);
		container.appendChild(col);
	});
}

async function loadGoodsByIds(elementId, goodsIdsToLoad){
	let message = '';
	try{
		const container = document.getElementById(elementId);
		goods = new Array();
		for(i=0;i!=goodsIdsToLoad.length;++i){
			let response = await fetch(`/api/goods/${goodsIdsToLoad[i].id}`);
			if(!response.ok){
				message = (await response.json()).error;
				throw new Error(`Статус запроса: ${response.status}\nОшибка: ${message}`);
			}
			
			goods.push(await response.json())
		}
	} catch (error) {
		console.log(error);
		showError(message);
	}
}
	