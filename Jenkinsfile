
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

        stage('Diagnose Docker Environment') {
            steps {

                powershell '''
                    Write-Host ""
                    Write-Host "=========================================="
                    Write-Host "DOCKER ENVIRONMENT"
                    Write-Host "=========================================="

                    Write-Host ""
                    Write-Host "Windows User:"
                    whoami

                    Write-Host ""
                    Write-Host "USERPROFILE:"
                    Write-Host $env:USERPROFILE

                    Write-Host ""
                    Write-Host "DOCKER_CONFIG:"
                    if ($env:DOCKER_CONFIG) {
                        Write-Host $env:DOCKER_CONFIG
                    }
                    else {
                        Write-Host "(Not set)"
                    }

                    Write-Host ""
                    Write-Host "Docker Context:"
                    docker context show

                    if ($LASTEXITCODE -ne 0) {
                        Write-Error "Docker context check failed"
                        exit 1
                    }

                    Write-Host ""
                    Write-Host "Docker Version:"
                    docker version

                    if ($LASTEXITCODE -ne 0) {
                        Write-Error "Docker version check failed"
                        exit 1
                    }

                    Write-Host ""
                    Write-Host "Docker Info:"
                    docker info

                    if ($LASTEXITCODE -ne 0) {
                        Write-Error "Docker info check failed"
                        exit 1
                    }

                    Write-Host ""
                    Write-Host "=========================================="
                    Write-Host "DOCKER ENVIRONMENT CHECK COMPLETE"
                    Write-Host "=========================================="
                '''
            }
        }

        stage('Check Jenkins Credential') {
            steps {

                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-login-2026',
                        usernameVariable: 'DOCKER_USERNAME',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )
                ]) {

                    powershell '''
                        Write-Host ""
                        Write-Host "=========================================="
                        Write-Host "JENKINS CREDENTIAL CHECK"
                        Write-Host "=========================================="

                        Write-Host ""
                        Write-Host "Username: [$env:DOCKER_USERNAME]"
                        Write-Host "Username length: $($env:DOCKER_USERNAME.Length)"

                        Write-Host ""
                        Write-Host "Password length: $($env:DOCKER_PASSWORD.Length)"

                        if ([string]::IsNullOrWhiteSpace($env:DOCKER_PASSWORD)) {
                            Write-Error "PASSWORD/PAT IS EMPTY"
                            exit 1
                        }

                        $bytes = [System.Text.Encoding]::UTF8.GetBytes(
                            $env:DOCKER_PASSWORD
                        )

                        $sha256 = [System.Security.Cryptography.SHA256]::Create()

                        $hash = $sha256.ComputeHash($bytes)

                        $hashString = [System.BitConverter]::ToString(
                            $hash
                        ).Replace("-", "").ToLower()

                        Write-Host ""
                        Write-Host "Password SHA256: $hashString"

                        Write-Host ""
                        Write-Host "PAT itself is NOT displayed."

                        Write-Host ""
                        Write-Host "=========================================="
                    '''
                }
            }
        }

        stage('Docker Hub Login') {
            steps {

                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-login-2026',
                        usernameVariable: 'DOCKER_USERNAME',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )
                ]) {

                    powershell '''
                        Write-Host ""
                        Write-Host "=========================================="
                        Write-Host "DOCKER HUB LOGIN"
                        Write-Host "=========================================="

                        Write-Host ""
                        Write-Host "Username: [$env:DOCKER_USERNAME]"

                        Write-Host ""
                        Write-Host "Logging into Docker Hub..."

                        $env:DOCKER_PASSWORD |
                            docker login `
                            --username $env:DOCKER_USERNAME `
                            --password-stdin

                        if ($LASTEXITCODE -ne 0) {
                            Write-Error "Docker Hub login failed"
                            exit 1
                        }

                        Write-Host ""
                        Write-Host "Docker Hub login successful."