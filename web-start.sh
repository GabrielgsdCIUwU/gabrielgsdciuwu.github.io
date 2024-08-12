#!/bin/bash

# Buscar y eliminar todas las sesiones de screen con el nombre 'website'
for session in $(screen -ls | grep 'website' | awk '{print $1}'); do
    screen -S $session -X quit
done

# Guardar los cambios en el stash
git stash push -m "No subir cambios"

# Eliminar el stash más reciente
git stash drop

# Actualizar el repositorio
git pull

# Iniciar una nueva sesión de screen con el nombre 'website'
screen -dm -S website node index.js
