```groovy
pipeline {

    agent any

    environment {

        IMAGE_NAME = 'jaganathbkvin/server-health-monitor'
        IMAGE_TAG  = "build-${BUILD_NUMBER}"

    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out source code...'

                checkout scm
            }
        }

        stage('Verify Files') {
            steps {

                powershell '''
                    Write-Host "Checking project files..."

                    $requiredFiles = @(
                        "app.py",
                        "requirements.txt",
                        "Dockerfile",
                        "templates/index.html",
                        "static/style.css",
                        "static/script.js"
                    )

                    foreach ($file in $requiredFiles) {

                        if (!(Test-Path $file)) {
                            Write-Error "$file NOT FOUND"
                            exit 1
                        }

                        Write-Host "$file found"
                    }

                    Write-Host ""
                    Write-Host "All required files verified successfully."
                '''
            }
        }

        stage('Test Application') {
            steps {

                powershell '''
                    Write-Host "Testing Python application using Docker..."

                    docker run --rm `
                        -v "${PWD}:/app" `
                        -w /app `
                        python:3.12-slim `
                        sh -c "pip install --no-cache-dir -r requirements.txt && python -m py_compile app.py"

                    if ($LASTEXITCODE -ne 0) {
                        Write-Error "Application test failed"
                        exit 1
                    }

                    Write-Host ""
                    Write-Host "Application test passed successfully."
                '''
            }
        }

        stage('Build Docker Image') {
            steps {

                powershell '''
                    Write-Host "Building Docker image..."

                    docker build `
                        -t "jaganathbkvin/server-health-monitor:build-$env:BUILD_NUMBER" .

                    if ($LASTEXITCODE -ne 0) {
                        Write-Error "Docker build failed"
                        exit 1
                    }

                    Write-Host ""
                    Write-Host "Creating latest tag..."

                    docker tag `
                        "jaganathbkvin/server-health-monitor:build-$env:BUILD_NUMBER" `
                        "jaganathbkvin/server-health-monitor:latest"

                    if ($LASTEXITCODE -ne 0) {
                        Write-Error "Docker tag failed"
                        exit 1
                    }

                    Write-Host ""
                    Write-Host "Docker image built successfully."

                    docker images "jaganathbkvin/server-health-monitor"
                '''
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
                        Write-Host "=========================================="
                        Write-Host "DOCKER HUB CREDENTIAL TEST"
                        Write-Host "=========================================="

                        Write-Host ""
```
