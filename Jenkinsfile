
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

                    if (!(Test-Path kubernetes/deployment.yaml)) {
                        throw "kubernetes/deployment.yaml not found"
                    }

                    if (!(Test-Path kubernetes/service.yaml)) {
                        throw "kubernetes/service.yaml not found"
                    }

                    if (!(Test-Path kubernetes/ingress.yaml)) {
                        throw "kubernetes/ingress.yaml not found"
                    }

                    Write-Host "All required files found successfully."
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
                        bash -c "pip install --no-cache-dir -r requirements.txt && python -m py_compile app.py"

                    if ($LASTEXITCODE -ne 0) {
                        throw "Application test failed"
                    }

                    Write-Host "Application test passed."
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                powershell '''
                    Write-Host "Building Docker image..."

                    docker build -t jaganathbkvin/server-health-monitor:${env:IMAGE_TAG} .
                    if ($LASTEXITCODE -ne 0) {
                        throw "Docker build failed"
                    }

                    docker tag `
                        jaganathbkvin/server-health-monitor:${env:IMAGE_TAG} `
                        jaganathbkvin/server-health-monitor:latest

                    if ($LASTEXITCODE -ne 0) {
                        throw "Docker tag failed"
                    }

                    Write-Host "Docker image built successfully."
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
                        Write-Host "Logging into Docker Hub..."

                        docker login `
                            --username $env:DOCKER_USERNAME `
                            --password $env:DOCKER_PASSWORD

                        if ($LASTEXITCODE -ne 0) {
                            throw "Docker Hub login failed"
                        }

                        Write-Host "Docker Hub login successful."
                    '''
                }
            }
        }

        stage('Push Image') {
            steps {
                powershell '''
                    Write-Host "Pushing build image..."

                    docker push "jaganathbkvin/server-health-monitor:${env:IMAGE_TAG}"

                    if ($LASTEXITCODE -ne 0) {
                        throw "Docker build image push failed"
                    }

                    Write-Host "Pushing latest image..."

                    docker push "jaganathbkvin/server-health-monitor:latest"

                    if ($LASTEXITCODE -ne 0) {
                        throw "Docker latest image push failed"
                    }

                    Write-Host "Docker images pushed successfully."
                '''
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                powershell '''
                    Write-Host "======================================"
                    Write-Host "DEPLOYING TO KUBERNETES"
                    Write-Host "======================================"

                    Write-Host "Checking kubectl..."

                    kubectl version --client

                    if ($LASTEXITCODE -ne 0) {
                        throw "kubectl is not available"
                    }

                    Write-Host "Checking Kubernetes cluster..."

                    kubectl get nodes

                    if ($LASTEXITCODE -ne 0) {
                        throw "Cannot connect to Kubernetes cluster"
                    }

                    Write-Host "Applying Deployment..."

                    kubectl apply -f kubernetes/deployment.yaml

                    if ($LASTEXITCODE -ne 0) {
                        throw "Kubernetes Deployment failed"
                    }

                    Write-Host "Applying Service..."

                    kubectl apply -f kubernetes/service.yaml

                    if ($LASTEXITCODE -ne 0) {
                        throw "Kubernetes Service failed"
                    }

                    Write-Host "Applying Ingress..."

                    kubectl apply -f kubernetes/ingress.yaml

                    if ($LASTEXITCODE -ne 0) {
                        throw "Kubernetes Ingress failed"
                    }

                    Write-Host "Waiting for Kubernetes rollout..."

                    kubectl rollout status deployment/server-health-monitor --timeout=120s

                    if ($LASTEXITCODE -ne 0) {
                        throw "Kubernetes rollout failed"
                    }

                    Write-Host "======================================"
                    Write-Host "KUBERNETES PODS"
                    Write-Host "======================================"

                    kubectl get pods -o wide

                    Write-Host "======================================"
                    Write-Host "KUBERNETES DEPLOYMENT"
                    Write-Host "======================================"

                    kubectl get deployment

                    Write-Host "======================================"
                    Write-Host "KUBERNETES SERVICE"
                    Write-Host "======================================"

                    kubectl get service

                    Write-Host "======================================"
                    Write-Host "KUBERNETES INGRESS"
                    Write-Host "======================================"

                    kubectl get ingress

                    Write-Host "======================================"
                    Write-Host "KUBERNETES DEPLOYMENT SUCCESSFUL"
                    Write-Host "======================================"
                '''
            }
        }
    }

    post {

        success {
            echo '''
==========================================
BUILD SUCCESSFUL
==========================================

SERVER HEALTH MONITOR

Docker Image:
jaganathbkvin/server-health-monitor:latest

Kubernetes:
Deployment: server-health-monitor
Replicas: 2
Service: server-health-monitor
NodePort: 30080
Ingress: health.local

==========================================
'''
        }

        failure {
            echo '''
==========================================
BUILD FAILED
==========================================

Check the Jenkins Console Output.

==========================================
'''
        }
    }
}

