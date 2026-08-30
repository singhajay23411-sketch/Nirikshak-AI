$REMOTE_USER = "ubuntu"
$REMOTE_HOST = "155.248.255.235"
$SSH_KEY = "C:\Users\visha\.ssh\ssh-key-2026-08-29.key"
$REMOTE_DIR = "/var/www/nirikshak"
$LOCAL_BACKEND = "backend"
$LOCAL_FRONTEND_DATA = "frontend\public\data"

Write-Host "Building Frontend bundle..."
Set-Location frontend
npm run build
Set-Location ..

Write-Host "Deploying Frontend bundle to server..."
ssh -i $SSH_KEY ${REMOTE_USER}@${REMOTE_HOST} "mkdir -p ~/tmp_frontend"
scp -i $SSH_KEY -r frontend\dist\* ${REMOTE_USER}@${REMOTE_HOST}:~/tmp_frontend/
ssh -i $SSH_KEY ${REMOTE_USER}@${REMOTE_HOST} "sudo cp -r ~/tmp_frontend/* ${REMOTE_DIR}/frontend/ && rm -rf ~/tmp_frontend"

Write-Host "Deploying Backend updates..."
scp -i $SSH_KEY -r $LOCAL_BACKEND\* ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/backend/

Write-Host "Deploying Data feeds to all server directories..."
ssh -i $SSH_KEY ${REMOTE_USER}@${REMOTE_HOST} "mkdir -p ~/tmp_data && sudo mkdir -p ${REMOTE_DIR}/frontend/data ${REMOTE_DIR}/frontend/public/data ${REMOTE_DIR}/data/live_exports ${REMOTE_DIR}/data"
scp -i $SSH_KEY -r $LOCAL_FRONTEND_DATA\* ${REMOTE_USER}@${REMOTE_HOST}:~/tmp_data/
ssh -i $SSH_KEY ${REMOTE_USER}@${REMOTE_HOST} "sudo cp -r ~/tmp_data/* ${REMOTE_DIR}/frontend/data/ && sudo cp -r ~/tmp_data/* ${REMOTE_DIR}/frontend/public/data/ && sudo cp -r ~/tmp_data/* ${REMOTE_DIR}/data/live_exports/ && sudo cp -r ~/tmp_data/* ${REMOTE_DIR}/data/ && rm -rf ~/tmp_data"

Write-Host "Restarting Backend Service..."
ssh -i $SSH_KEY ${REMOTE_USER}@${REMOTE_HOST} "sudo systemctl restart nirikshak-backend.service"

Write-Host "Deployment Complete! Frontend, Backend, and Analytics data are live."
