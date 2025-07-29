from datetime import date

class GoodMeta(type):
	def __new__(cls, name, bases, dct):
		fields_meta = {}
		db_columns = {
			'columns': {},
			'primary_keys': [],
			'foreign_keys': {}
		}

		for attr_name, attr_value in dct.items():
			if isinstance(attr_value, dict) and 'field_meta' in attr_value:
				meta = attr_value['field_meta']
				fields_meta[attr_name] = meta
				
				# Обработка db_column
				db_settings = meta.get('db_column', {'name': attr_name})
				column_name = db_settings['name']
				
				# Сохраняем информацию о столбцах
				db_columns['columns'][attr_name] = column_name
				
				# Обработка первичных ключей
				if db_settings.get('primary_key', False):
					db_columns['primary_keys'].append(attr_name)
				
				# Обработка внешних ключей
				if 'foreign_key' in db_settings:
					db_columns['foreign_keys'][attr_name] = db_settings['foreign_key']

		dct['FIELDS_META'] = fields_meta
		dct['DB_COLUMNS'] = db_columns
		return super().__new__(cls, name, bases, dct)

class Good(metaclass=GoodMeta):
	id = {
		'field_meta': {
			'type': int,
			'min_value': 1,
			'db_column': {
				'name': 'Id',
				'primary_key': True,
				'foreign_key': False
			}
		}
	}
	name = {
		'field_meta': {
			'type': str,
			'max_len': 100,
			'required': True,
			'db_column': {
				'name': 'Name'
			}
		}
	}
	description = {
		'field_meta':{
			'type': str,
			'required': True,
			'db_column': {
				'name' : 'Description'
			}
		}
	}
	image = {
		'field_meta':{
			'type': str,
			'required': True,
			'db_column': {
				'name' : 'Image'
			}
		}
	}
	price = {
		'field_meta':{
			'type': float,
			'required': True,
			'default': 0,
			'db_column': {
				'name' : 'Price'
			}
		}
	}
	appearance_date = {
		'field_meta':{
			'type': date,
			'required':True,
			'db_column': {
				'name' : 'AppearanceDate'
			}			
		}
	}
	id_manufacturer = {
		'field_meta':{
			'type' : int,
			'required': True,
			'db_column': {
				'name' : 'IdManufacturer'
			}
		}
	}
	