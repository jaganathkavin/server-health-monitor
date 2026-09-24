
pipeline {

    agent any

    environment {
        IMAGE_NAME = 'jaganathbkvin/server-health-monitor'
        IMAGE_TAG = "build-${BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Verify Files') {
            steps {
                powershell '''
                    Write-Host "Checking project files..."

                    if (!(Test-Path app.py)) {
                        throw "app.py not found"
                    }

                    if (!(Test-Path requirements.txt)) {
                        throw "requirements.txt not found"
                    }

                    if (!(Test-Path Dockerfile)) {
                        throw "Dockerfile not found"
                    }

                    if (!(Test-Path templates/index.html)) {
                        throw "templates/index.html not found"
                    }

                    if (!(Test-Path static/style.css)) {
                        throw "static/style.css not found"
                    }

                    if (!(Test-Path static/script.js)) {
                        throw "static/script.js not found"
                    }

                    Write-Host ""
                    Write-Host "Files verified successfully"
                '''
            }
        }

        stage('Test Application') {
            steps {
                powershell '''
                    Write-Host "Testing Python application..."

                    docker run --rm `
                        -v "${PWD}:/app" `
                        -w /app `
                        python:3.12-slim `
                        sh -c "pip install --no-cache-dir -r requirements.txt && python -m py_compile app.py"

                    if ($LASTEXITCODE -ne 0) {
                        throw "Application test failed"
                    }

                    Write-Host ""
                    Write-Host "Application test passed successfully"
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                powershell """
                    Write-Host "Building Docker image..."

                    docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .

                    if (`$LASTEXITCODE -ne 0) {
                        throw "Docker build failed"
                    }

                    Write-Host ""
                    Write-Host "Creating latest tag..."

                    docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:latest

                    if (`$LASTEXITCODE -ne 0) {
                        throw "Docker tag failed"
                    }

                    Write-Host ""
                    Write-Host "Docker image built successfully"

                    docker images ${IMAGE_NAME}
                """
            }
        }

        stage('Docker Hub Login') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKER_USERNAME',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )
                ]) {
                    powershell '''
                        Write-Host ""
                        Write-Host "======================================"
                        Write-Host "DOCKER HUB LOGIN"
                        Write-Host "======================================"

                        Write-Host ""
                        Write-Host "Username: $env:DOCKER_USERNAME"

                        Write-Host ""
                        Write-Host "Logging into Docker Hub..."

                        docker login `
                            --username $env:DOCKER_USERNAME `
                            --password $env:DOCKER_PASSWORD

                        if ($LASTEXITCODE -ne 0) {
                            throw "Docker Hub login failed"
                        }

                        Write-Host ""
                        Write-Host "Docker login successful"
                    '''
                }
            }
        }

        stage('Push Image') {
            steps {
                powershell """
                    Write-Host ""
                    Write-Host "======================================"
                    Write-Host "PUSHING DOCKER IMAGES"
                    Write-Host "======================================"

                    Write-Host ""
                    Write-Host "Pushing build image..."

                    docker push ${IMAGE_NAME}:${IMAGE_TAG}

                    if (`$LASTEXITCODE -ne 0) {
                        throw "Build image push failed"
                    }

                    Write-Host ""
                    Write-Host "Pushing latest image..."

                    docker push ${IMAGE_NAME}:latest

                    if (`$LASTEXITCODE -ne 0) {
                        throw "Latest image push failed"
                    }

                    Write-Host ""
                    Write-Host "Images pushed successfully"
                """
            }
        }

        stage('Deploy') {
            steps {
                powershell '''
                    Write-Host ""
                    Write-Host "======================================"
                    Write-Host "DEPLOYING APPLICATION"
                    Write-Host "======================================"

                    Write-Host ""
                    Write-Host "Removing old container..."

                    docker rm -f server-health-monitor 2>$null

                    Write-Host ""
                    Write-Host "Starting new container..."

                    docker run -d `
                        --name server-health-monitor `
                        -p 5000:5000 `
                        jaganathbkvin/server-health-monitor:latest

                    if ($LASTEXITCODE -ne 0) {
                        throw "Docker container deployment failed"
                    }

                    Write-Host ""
                    Write-Host "Application deployed successfully"

                    Write-Host ""
                    Write-Host "Container status:"

                    docker ps --filter name=server-health-monitor

                    Write-Host ""
                    Write-Host "Application URL:"
                    Write-Host "http://localhost:5000"
                '''
            }
        }
    }

    post {

        success {
            echo '''
======================================
BUILD SUCCESSFUL
======================================

SERVER HEALTH MONITOR DEPLOYED

Docker Image:
jaganathbkvin/server-health-monitor

Docker Hub:
PUSH SUCCESSFUL

Application:
http://localhost:5000

======================================
'''
        }

        failure {
            echo '''
======================================
BUILD FAILED
======================================

Check Jenkins Console Output.

======================================
'''
        }
    }
}
