
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
                        Write-Host "Username: [$env:DOCKER_USERNAME]"
                        Write-Host "Username length: $($env:DOCKER_USERNAME.Length)"
                        Write-Host "Password length: $($env:DOCKER_PASSWORD.Length)"

                        Write-Host ""
                        Write-Host "Expected username: jaganathbkvin"

                        if ($env:DOCKER_USERNAME -ne "jaganathbkvin") {
                            Write-Error "USERNAME IS WRONG"
                            exit 1
                        }

                        if ([string]::IsNullOrWhiteSpace($env:DOCKER_PASSWORD)) {
                            Write-Error "PASSWORD/PAT IS EMPTY"
                            exit 1
                        }

                        Write-Host ""
                        Write-Host "Username is correct."
                        Write-Host "PAT exists."
                        Write-Host "PAT itself will NOT be displayed."

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
                    '''
                }
            }
        }

        stage('Push Image') {
            steps {

                powershell '''
                    Write-Host "=========================================="
                    Write-Host "PUSHING DOCKER IMAGE"
                    Write-Host "=========================================="

                    Write-Host ""
                    Write-Host "Pushing build image..."

                    docker push `
                        "jaganathbkvin/server-health-monitor:build-$env:BUILD_NUMBER"

                    if ($LASTEXITCODE -ne 0) {
                        Write-Error "Build image push failed"
                        exit 1
                    }

                    Write-Host ""
                    Write-Host "Build image pushed successfully."

                    Write-Host ""
                    Write-Host "Pushing latest image..."

                    docker push `
                        "jaganathbkvin/server-health-monitor:latest"

                    if ($LASTEXITCODE -ne 0) {
                        Write-Error "Latest image push failed"
                        exit 1
                    }

                    Write-Host ""
                    Write-Host "Docker images pushed successfully."
                '''
            }
        }

        stage('Deploy') {
            steps {

                powershell '''
                    Write-Host "=========================================="
                    Write-Host "KUBERNETES DEPLOYMENT"
                    Write-Host "=========================================="

                    Write-Host ""
                    Write-Host "Checking Kubernetes connection..."

                    kubectl get nodes

                    if ($LASTEXITCODE -ne 0) {
                        Write-Error "Kubernetes is not available"
                        exit 1
                    }

                    Write-Host ""
                    Write-Host "Kubernetes connection successful."

                    Write-Host ""
                    Write-Host "Applying Deployment..."

                    kubectl apply `
                        -f kubernetes/deployment.yaml

                    if ($LASTEXITCODE -ne 0) {
                        Write-Error "Kubernetes Deployment failed"
                        exit 1
                    }

                    Write-Host ""
                    Write-Host "Applying Service..."

                    kubectl apply `
                        -f kubernetes/service.yaml

                    if ($LASTEXITCODE -ne 0) {
                        Write-Error "Kubernetes Service deployment failed"
                        exit 1
                    }

                    Write-Host ""
                    Write-Host "Waiting for deployment..."

                    kubectl rollout status `
                        deployment/server-health-monitor `
                        --timeout=120s

                    if ($LASTEXITCODE -ne 0) {
                        Write-Error "Kubernetes rollout failed"
                        exit 1
                    }

                    Write-Host ""
                    Write-Host "Kubernetes deployment successful."

                    Write-Host ""
                    Write-Host "=========================================="
                    Write-Host "PODS"
                    Write-Host "=========================================="

                    kubectl get pods

                    Write-Host ""
                    Write-Host "=========================================="
                    Write-Host "SERVICE"
                    Write-Host "=========================================="

                    kubectl get service server-health-monitor

                    Write-Host ""
                    Write-Host "=========================================="
                    Write-Host "DEPLOYMENT"
                    Write-Host "=========================================="

                    kubectl get deployment server-health-monitor
                '''
            }
        }
    }

    post {

        success {

            echo '''
==========================================
SERVER HEALTH MONITOR
BUILD SUCCESSFUL
==========================================

Docker Image:
jaganathbkvin/server-health-monitor

Docker Hub:
PUSH SUCCESSFUL

Kubernetes:
DEPLOYMENT SUCCESSFUL

Status:
SUCCESS
'''
        }

        failure {

            echo '''
==========================================
SERVER HEALTH MONITOR
BUILD FAILED
==========================================

Please check the Jenkins Console Output.
'''
        }
    }
}


### What to do now

1. Replace your GitHub `Jenkinsfile` with the above.
2. Commit and push it.
3. Jenkins → **Build Now**.
4. Look specifically at:

```text
DOCKER HUB CREDENTIAL TEST
```

You should see:

```text
Username: [jaganathbkvin]
Username length: 13
Password length: ...
Username is correct.
PAT exists.
```

Then:

```text
Logging into Docker Hub...
Login Succeeded
```

**Do not send the password/PAT to me.** Send me the Jenkins output from `DOCKER HUB CREDENTIAL TEST` onward.
