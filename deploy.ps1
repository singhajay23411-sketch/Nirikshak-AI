$REMOTE_USER = "ubuntu"
$REMOTE_HOST = "155.248.255.235"
$SSH_KEY = "C:\Users\visha\.ssh\ssh-key-2026-08-29.key"
$REMOTE_DIR = "/var/www/nirikshak"
$LOCAL_BACKEND = "backend"
$LOCAL_FRONTEND_DATA = "frontend\public\data"

Write-Host "Deploying Backend updates..."
# Sync the backend database and python files
scp -i $SSH_KEY -r $LOCAL_BACKEND\* ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/backend/

Write-Host "Restarting Backend Service..."
ssh -i $SSH_KEY ${REMOTE_USER}@${REMOTE_HOST} "sudo systemctl restart nirikshak-backend.service"

Write-Host "Deploying Frontend Data feeds..."
# The frontend folder is owned by root, so we upload to a temp folder first, then use sudo to copy
ssh -i $SSH_KEY ${REMOTE_USER}@${REMOTE_HOST} "mkdir -p ~/tmp_data"
scp -i $SSH_KEY -r $LOCAL_FRONTEND_DATA\* ${REMOTE_USER}@${REMOTE_HOST}:~/tmp_data/
ssh -i $SSH_KEY ${REMOTE_USER}@${REMOTE_HOST} "sudo cp -r ~/tmp_data/* ${REMOTE_DIR}/frontend/data/ && rm -rf ~/tmp_data"

Write-Host "Deployment Complete! Analytics data and backend updates are live."
