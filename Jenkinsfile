
pipeline {

    agent any

    environment {
        IMAGE_NAME = 'jaganathbkvin/server-health-monitor'
        IMAGE_TAG = "build-${BUILD_NUMBER}"
    }

    stages {

        // =====================================================
        // 1. CHECKOUT
        // =====================================================

        stage('Checkout') {
            steps {
                checkout scm
            }
        }


        // =====================================================
        // 2. VERIFY PROJECT FILES
        // =====================================================

        stage('Verify Files') {
            steps {
                powershell '''
                    Write-Host "======================================"
                    Write-Host "VERIFYING PROJECT FILES"
                    Write-Host "======================================"

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

                    Write-Host ""
                    Write-Host "All required files found successfully."
                '''
            }
        }


        // =====================================================
        // 3. TEST PYTHON APPLICATION
        // =====================================================

        stage('Test Application') {
            steps {
                powershell '''
                    Write-Host "======================================"
                    Write-Host "TESTING PYTHON APPLICATION"
                    Write-Host "======================================"

                    docker run --rm `
                        -v "${PWD}:/app" `
                        -w /app `
                        python:3.12-slim `
                        bash -c "pip install --no-cache-dir -r requirements.txt && python -m py_compile app.py"

                    if ($LASTEXITCODE -ne 0) {
                        throw "Application test failed"
                    }

                    Write-Host ""
                    Write-Host "Application test passed successfully."
                '''
            }
        }


        // =====================================================
        // 4. BUILD DOCKER IMAGE
        // =====================================================

        stage('Build Docker Image') {
            steps {
                powershell '''
                    Write-Host "======================================"
                    Write-Host "BUILDING DOCKER IMAGE"
                    Write-Host "======================================"

                    docker build `
                        -t "jaganathbkvin/server-health-monitor:${env:IMAGE_TAG}" `
                        .

                    if ($LASTEXITCODE -ne 0) {
                        throw "Docker build failed"
                    }

                    docker tag `
                        "jaganathbkvin/server-health-monitor:${env:IMAGE_TAG}" `
                        "jaganathbkvin/server-health-monitor:latest"

                    if ($LASTEXITCODE -ne 0) {
                        throw "Docker tag failed"
                    }

                    Write-Host ""
                    Write-Host "Docker image built successfully."

                    docker images "jaganathbkvin/server-health-monitor"
                '''
            }
        }


        // =====================================================
        // 5. DOCKER HUB LOGIN
        // =====================================================

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
                        Write-Host "======================================"
                        Write-Host "DOCKER HUB LOGIN"
                        Write-Host "======================================"

                        docker login `
                            --username $env:DOCKER_USERNAME `
                            --password $env:DOCKER_PASSWORD

                        if ($LASTEXITCODE -ne 0) {
                            throw "Docker Hub login failed"
                        }

                        Write-Host ""
                        Write-Host "Docker Hub login successful."
                    '''
                }
            }
        }


        // =====================================================
        // 6. PUSH DOCKER IMAGE
        // =====================================================

        stage('Push Image') {
            steps {
                powershell '''
                    Write-Host "======================================"
                    Write-Host "PUSHING IMAGE TO DOCKER HUB"
                    Write-Host "======================================"

                    Write-Host "Pushing build image..."

                    docker push `
                        "jaganathbkvin/server-health-monitor:${env:IMAGE_TAG}"

                    if ($LASTEXITCODE -ne 0) {
                        throw "Build image push failed"
                    }

                    Write-Host ""
                    Write-Host "Pushing latest image..."

                    docker push `
                        "jaganathbkvin/server-health-monitor:latest"

                    if ($LASTEXITCODE -ne 0) {
                        throw "Latest image push failed"
                    }

                    Write-Host ""
                    Write-Host "Docker images pushed successfully."
                '''
            }
        }


        // =====================================================
        // 7. TEST JENKINS -> KUBERNETES CONNECTION
        // =====================================================

        stage('Test Kubernetes Connection') {
            steps {
                powershell '''
                    Write-Host "======================================"
                    Write-Host "TESTING KUBERNETES CONNECTION"
                    Write-Host "======================================"

                    Write-Host ""
                    Write-Host "KUBECONFIG:"
                    Write-Host $env:KUBECONFIG

                    Write-Host ""
                    Write-Host "Kubectl version:"
                    kubectl version --client

                    if ($LASTEXITCODE -ne 0) {
                        throw "kubectl is not available"
                    }

                    Write-Host ""
                    Write-Host "Current Kubernetes context:"
                    kubectl config current-context

                    if ($LASTEXITCODE -ne 0) {
                        throw "Cannot read Kubernetes context"
                    }

                    Write-Host ""
                    Write-Host "Kubernetes nodes:"
                    kubectl get nodes

                    if ($LASTEXITCODE -ne 0) {
                        throw "Cannot connect to Kubernetes cluster"
                    }

                    Write-Host ""
                    Write-Host "Kubernetes connection successful!"
                '''
            }
        }


        // =====================================================
        // 8. DEPLOY TO KUBERNETES
        // =====================================================

        stage('Deploy to Kubernetes') {
            steps {
                powershell '''
                    Write-Host "======================================"
                    Write-Host "DEPLOYING TO KUBERNETES"
                    Write-Host "======================================"

                    Write-Host ""
                    Write-Host "Applying Kubernetes Deployment..."

                    kubectl apply -f kubernetes/deployment.yaml

                    if ($LASTEXITCODE -ne 0) {
                        throw "Kubernetes Deployment failed"
                    }

                    Write-Host ""
                    Write-Host "Applying Kubernetes Service..."

                    kubectl apply -f kubernetes/service.yaml

                    if ($LASTEXITCODE -ne 0) {
                        throw "Kubernetes Service failed"
                    }

                    Write-Host ""
                    Write-Host "Applying Kubernetes Ingress..."

                    kubectl apply -f kubernetes/ingress.yaml

                    if ($LASTEXITCODE -ne 0) {
                        throw "Kubernetes Ingress failed"
                    }

                    Write-Host ""
                    Write-Host "Waiting for Kubernetes rollout..."

                    kubectl rollout status `
                        deployment/server-health-monitor `
                        --timeout=120s

                    if ($LASTEXITCODE -ne 0) {
                        throw "Kubernetes rollout failed"
                    }

                    Write-Host ""
                    Write-Host "Kubernetes rollout successful."
                '''
            }
        }


        // =====================================================
        // 9. VERIFY KUBERNETES
        // =====================================================

        stage('Verify Kubernetes Deployment') {
            steps {
                powershell '''
                    Write-Host "======================================"
                    Write-Host "KUBERNETES DEPLOYMENT STATUS"
                    Write-Host "======================================"

                    Write-Host ""
                    Write-Host "PODS:"
                    kubectl get pods -o wide

                    Write-Host ""
                    Write-Host "DEPLOYMENTS:"
                    kubectl get deployment

                    Write-Host ""
                    Write-Host "SERVICES:"
                    kubectl get service

                    Write-Host ""
                    Write-Host "INGRESS:"
                    kubectl get ingress

                    Write-Host ""
                    Write-Host "======================================"
                    Write-Host "KUBERNETES DEPLOYMENT VERIFIED"
                    Write-Host "======================================"
                '''
            }
        }
    }


    // =========================================================
    // POST BUILD
    // =========================================================

    post {

        success {
            echo '''
==========================================
        BUILD SUCCESSFUL
==========================================

SERVER HEALTH MONITOR

Docker Hub:
jaganathbkvin/server-health-monitor:latest

Kubernetes:
Deployment: server-health-monitor
Replicas: 2
Service: server-health-monitor
NodePort: 30080
Ingress: health.local

==========================================
   CI/CD PIPELINE COMPLETED SUCCESSFULLY
==========================================
'''
        }

        failure {
            echo '''
==========================================
           BUILD FAILED
==========================================

Check the Jenkins Console Output
to identify the failed stage.

==========================================
'''
        }
    }
}
