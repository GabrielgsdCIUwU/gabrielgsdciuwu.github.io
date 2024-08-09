git stash push -m "No subir cambios"
git stash drop
git pull
screen -dm -S website node index.js