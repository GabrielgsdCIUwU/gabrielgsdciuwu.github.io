#!/bin/bash

exec >> web-start.log 2>&1

echo "=================================================="
echo "Ejecutando web-start.sh - $(date)"
echo "=================================================="

for session in $(screen -ls | grep 'website' | awk '{print $1}'); do
    echo "Cerrando sesión screen existente: $session"
    screen -S $session -X quit
done

# Guardar los cambios en el stash
git stash push -m "No subir cambios"

# Eliminar el stash más reciente
git stash drop

# Actualizar el repositorio
echo "Ejecutando git pull..."
git pull

# Iniciar una nueva sesión de screen con el nombre 'website' y guardar los logs de node
echo "Iniciando servidor node en screen y guardando logs en server.log..."
screen -dm -S website bash -c "node index.js >> server.log 2>&1"

echo "=================================================="
echo "web-start.sh finalizado correctamente."
echo "=================================================="
