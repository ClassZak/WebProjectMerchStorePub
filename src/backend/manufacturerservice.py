from sqlite3 import IntegrityError
from typing import Tuple, Union
import mysql.connector
from flask import Response, jsonify, request, Flask
from mysql.connector import Error
import base64

from aservice import AService
from model.manufacturer import Manufacturer
from validators.modelvalidator import ModelValidator


class ManufacturerService(AService):
	TABLE_NAME = 'Manufacturer'
	def __init__(self,config_file:str):
		super().__init__(config_file)
	
	"""
		CRUD операции
	"""
	def create_manufacturer(self, data: dict) -> Tuple[Response, int]:
		try:
			self.connect()
			validated = ModelValidator.validate(data, Manufacturer.FIELDS_META)
			values = tuple(validated.values())
			db_columns = [Manufacturer.DB_COLUMNS['columns'][field] for field in validated.keys()]
			
			query = f"""
				INSERT INTO {ManufacturerService.TABLE_NAME} ({', '.join(db_columns)})
				VALUES ({', '.join(['%s'] * len(values))})
			"""
			
			self.cursor.execute(query, values)
			self.connection.commit()
			
			return (jsonify({'id': self.cursor.lastrowid}), 201)
		
		except ValueError as e:
			return jsonify({'error':str(e)}), 400
		except IntegrityError as e:
			self.connection.rollback()
			if e.errno == 1062:
				return jsonify({'error':'Производитель с таким именем уже существует'}), 409	
		except Error as e:
			self.connection.rollback()
			return jsonify({'error': f'Ошибка БД: {str(e)}'}), 500
		
		finally:
			self.disconnect()
	
	def read_manufacturers(self) -> Tuple[Response, int]:
		try:
			self.connect()
			columns = [Manufacturer.DB_COLUMNS['columns'][field] 
				for field in Manufacturer.FIELDS_META.keys()]
			self.cursor.execute(f'SELECT {", ".join(columns)} FROM {ManufacturerService.TABLE_NAME}')
			raw_data = self.cursor.fetchall()
			
			# Преобразуем данные БД в формат модели
			return jsonify({'manufacturers': [{
					field: row[Manufacturer.DB_COLUMNS['columns'][field]]
                	for field in Manufacturer.FIELDS_META.keys()
				}
				for row in raw_data
			]}), 200
		except Error as e:
			return jsonify({'error': f'Ошибка БД: {str(e)}'}), 500
		finally:
			self.disconnect()
		
	def update_manufacturer(self, data: dict, id: int) -> Tuple[Response, int]:
		try:
			# Проверка конфликта ID
			if 'id' in data and data['id'] != id:
				return jsonify({'error': 'ID в теле не совпадает с ID в URL'}), 400
				
			data['id'] = id

			# Проверка ID и валидация
			if not self.exists(data['id']):
				return jsonify({'error': 'Производитель для обновления данных не найден'}), 404
			validated = ModelValidator.validate(data, Manufacturer.FIELDS_META, self.cursor)
			
			set_clause = ', '.join([
				f"{Manufacturer.DB_COLUMNS['columns'][field]} = %s" 
				for field in validated if field != 'id'
			])
			values = [validated[field] for field in validated if field != 'id']
			values.append(data['id'])
			
			query = f"""
				UPDATE {ManufacturerService.TABLE_NAME}
				SET {set_clause}
				WHERE {Manufacturer.DB_COLUMNS['columns']['id']} = %s
			"""
			
			self.connect()
			self.cursor.execute(query, values)
			self.connection.commit()
			
			if self.cursor.rowcount == 0:
				return jsonify({'error': 'Производитель уже имеет эти данные'}), 400
				
			return jsonify({'message': 'Данные производителя обновлены'}), 200
			
		except ValueError as e:
			return jsonify({'error': str(e)}), 400
		except Error as e:
			self.connection.rollback()
			return jsonify({'error': f'Ошибка БД: {str(e)}'}), 500
		finally:
			self.disconnect()

	def delete_manufacturer(self, id: int) -> Tuple[Response, int]:
		try:
			if not self.exists(id):
				return jsonify({'error': 'Не найден объект для удаления'}), 404
			else:
				self.connect()
				query = f"""
					DELETE FROM {ManufacturerService.TABLE_NAME}
					WHERE {Manufacturer.DB_COLUMNS['columns']['id']} = %s
				"""
				self.cursor.execute(query, (id,))
				self.connection.commit()
				return jsonify({'message': 'Объект успешно удалён'}), 200
		except Error as e:
			self.connection.rollback()
			return jsonify({'error': f'Ошибка БД: {str(e)}'}), 500
		finally:
			self.disconnect()
	"""
		CRUD операции
	"""




	"""
		Дополнительные запросы
	"""
	def read_manufacturer_by_id(self,id:int):
		try:
			if not self.exists(id):
				return jsonify({'error': 'Не найден объект для чтения'}), 404

			self.connect()
			columns=[Manufacturer.DB_COLUMNS['columns'][field]
				for field in Manufacturer.FIELDS_META.keys()]
			self.cursor.execute(
				f"""
				SELECT {', '.join(columns)} 
				FROM {ManufacturerService.TABLE_NAME} 
					WHERE {Manufacturer.DB_COLUMNS['columns']['id']} = %s
				""",(id,))
			obj=self.cursor.fetchone()
			return jsonify(self.sql_data_to_json_list(obj)), 200
		except ValueError as e:
			return jsonify({'error':str(e)}), 400
		except Error as e:
			return jsonify({'error': f'Ошибка БД: {str(e)}'}), 500
		finally:
			self.disconnect()
	"""
		Дополнительные запросы
	"""




	"""
		Простые методы
	"""
	def sql_data_to_json_list(self, data:dict):
		return {field:str(data[Manufacturer.DB_COLUMNS['columns'][field]]) for field in Manufacturer.FIELDS_META.keys()}


	def exists(self, id: int) -> bool:
		try:
			self.connect()
			query = f"SELECT EXISTS(SELECT 1 FROM {ManufacturerService.TABLE_NAME} WHERE Id = %s) AS exist"
			self.cursor.execute(query, (int(id),))
			result = self.cursor.fetchone()
			return bool(result['exist']) if result else False
		finally:
			self.disconnect()
	"""
		Простые методы
	"""

	