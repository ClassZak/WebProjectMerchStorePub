#!/bin/bash

cat > src/backend/.password.json << 'EOF'
{
	"host": "...",
	"user": "...",
	"password": "...",
	"database": "...",
	"secret_key": "..."
}
EOF

echo "Файл конфигурации успешно создан"