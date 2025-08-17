import os
from typing import Dict
from flask import Flask, Request, json, render_template, request, jsonify
from markupsafe import escape
import mysql.connector
import base64
from datetime import datetime

from goodservice import GoodService
from manufacturerservice import ManufacturerService
from markupsafe import escape



# Настройка CSRF
from flask_wtf.csrf import CSRFProtect

def get_app_config(filename:str='src/backend/.password.json'):
	with open(filename, 'r', encoding='UTF-8') as file:
		return json.load(file)

app = Flask(
	__name__,
	static_folder='../frontend/static',
	template_folder='../frontend/template'
)
app.secret_key = get_app_config()['secret_key']
csrf = CSRFProtect(app)










# Логи
log_path = ''
def log_visit(ip, path):
	"""Записывает посещение в лог-файл"""
	timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
	with open(log_path, "a") as f:
		f.write(f"{timestamp} - IP: {ip} - Path: {path}\n")

@app.before_request
def track_visit():
	"""Регистрирует посещение перед обработкой запроса"""
	# Определяем реальный IP клиента
	client_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
	if ',' in client_ip:
		client_ip = client_ip.split(',')[0].strip()
	
	log_visit(client_ip, request.path)










# Получение словаря из формы
def get_dict_from_request_form(request:Request) -> Dict:
	return {
		k:v
		for k in request.form.keys() 
			for v in request.form.getlist(k)
	}

# Сервисы
good_service=GoodService(
	'src/backend/.password.json'
)
manufacturer_service=ManufacturerService(
	'src/backend/.password.json'
)




# Маршруты
# Шаблоны
@app.route('/admin/')
def render_admin_panel():
	return render_template('admin_panel.html')

@app.route('/')
def root():
	return render_template('index.html')
@app.route('/about/')
def about():
	return render_template('about.html')
@app.route('/contacts/')
def contacts():
	return render_template('contacts.html')

# Товары
@app.route('/goods/')
def render_goods():
	return render_template('goods.html')
@app.route('/good/<int:id>')
def render_good(id):
	# Получаем данные товара через сервис
	response, status_code = good_service.read_good_by_id(id)
	
	# Если ошибка - показываем страницу ошибки
	if status_code != 200:
		return render_template(f'error/{status_code}.html'), status_code
	
	# Преобразуем JSON-ответ в словарь Python
	good_data = response.get_json()
	manufacturer_response, status_code = \
		manufacturer_service.read_manufacturer_by_id(good_data['id_manufacturer'])
	good_data['manufacturer'] = manufacturer_response.get_json()['name']

	# Рендерим страницу товара с полученными данными
	return render_template('good.html', good=good_data)
# Поиск
@app.route('/goods/search/')
def goods_search():
	# Получаем и обрабатываем запрос
	query = request.args.get('q', '').strip()
	safe_query = escape(query)
	
	# Вызываем метод поиска из сервиса
	response, status_code = good_service.search_goods(safe_query)
	
	# Проверяем статус ответа
	
	
	# Извлекаем данные из JSON-ответа
	data = response.get_json()
	
	if status_code == 200:
		goods_ids = data['goods']
	else:
		goods_ids = {};
	
	
	# Рендерим страницу с результатами
	return render_template(
		'search.html', 
		goods_ids=goods_ids, 
		query=safe_query,
		error_json = data
	)


# API
# Производители
@app.route('/api/manufacturers/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def handle_manufacturer(id:int):
	if request.method == 'GET':
		return manufacturer_service.read_manufacturer_by_id(id)
	elif request.method == 'PUT':
		data = get_dict_from_request_form(request)
		return manufacturer_service.update_manufacturer(data, id)
	elif request.method == 'DELETE':
		return manufacturer_service.delete_manufacturer(id)
@app.route('/api/manufacturers/', methods=['POST', 'GET'])
def manufacturers_route():
	try:
		if request.method=='POST':
			return manufacturer_service.create_manufacturer(get_dict_from_request_form(request))
		elif request.method=='GET':
			return manufacturer_service.read_manufacturers()
	except Exception as e:
		return jsonify({'error': 'Internal Server Error'}), 500

# Товары
@app.route('/api/goods/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def handle_good(id:int):
	if request.method == 'GET':
		return good_service.read_good_by_id(id)
	elif request.method == 'PUT':
		data = get_dict_from_request_form(request)
		return good_service.update_good(data, id)
	elif request.method=='DELETE':
		return good_service.delete_good(id)
@app.route('/api/goods/',methods=['POST', 'GET'])
def goods_route():
	try:
		if request.method=='POST':
			return good_service.create_good(get_dict_from_request_form(request))
		elif request.method=='GET':
			return good_service.read_goods()
	except Exception as e:
		return jsonify({'error': 'Internal Server Error'}), 500
# Доп. запросы
@app.route('/api/goods/new/',methods=['GET'])
def new_goods_route():
	try:
		return good_service.read_new_goods()
	except Exception as e:
		return jsonify({'error': 'Internal Server Error'}), 500
	



# Точка входа
def main():
	try:
		global log_path
		with open('src/backend/.password.json', 'r', encoding='UTF-8') as file:
			config=json.load(file)
			
			log_path = config['log_file'] if 'log_file' in config.keys() else 'visits.log'

		
		app.run(debug=True, host='0.0.0.0', port=5000)
	except Exception as e:
		pass

if __name__=='__main__':
	main()
