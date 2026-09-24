pipeline {

    agent any

    environment {

        IMAGE_NAME =
            'jaganathbkavin/server-health-monitor'

        IMAGE_TAG =
            "build-${BUILD_NUMBER}"
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

                            Write-Error "$file not found"

                            exit 1
                        }

                        Write-Host "$file found"
                    }

                    Write-Host "All required files verified."
                '''
            }
        }


        stage('Install Dependencies') {

            steps {

                powershell '''
                    python --version

                    python -m pip install `
                        --disable-pip-version-check `
                        -r requirements.txt
                '''
            }
        }


        stage('Test Application') {

            steps {

                powershell '''
                    python -m py_compile app.py

                    Write-Host "Python syntax check passed."
                '''
            }
        }


        stage('Build Docker Image') {

            steps {

                powershell """
                    docker build `
                        -t ${IMAGE_NAME}:${IMAGE_TAG} .

                    docker tag `
                        ${IMAGE_NAME}:${IMAGE_TAG} `
                        ${IMAGE_NAME}:latest
                """
            }
        }


        /*
         * Docker Hub login will be added
         * after the application is tested.
         */

        stage('Docker Hub Login') {

            steps {

                withCredentials([

                    usernamePassword(

                        credentialsId:
                            'dockerhub-credentials',

                        usernameVariable:
                            'DOCKER_USERNAME',

                        passwordVariable:
                            'DOCKER_PASSWORD'
                    )

                ]) {

                    powershell '''

                        Write-Host `
                            "Logging into Docker Hub..."

                        $env:DOCKER_PASSWORD |
                            docker login `
                            --username $env:DOCKER_USERNAME `
                            --password-stdin

                        if ($LASTEXITCODE -ne 0) {

                            Write-Error `
                                "Docker login failed"

                            exit 1
                        }

                        Write-Host `
                            "Docker login successful"
                    '''
                }
            }
        }


        stage('Push Image') {

            steps {

                powershell """

                    docker push `
                        ${IMAGE_NAME}:${IMAGE_TAG}

                    docker push `
                        ${IMAGE_NAME}:latest
                """
            }
        }


        stage('Deploy') {

            steps {

                powershell '''

                    kubectl apply `
                        -f kubernetes/deployment.yaml

                    kubectl apply `
                        -f kubernetes/service.yaml

                    kubectl rollout status `
                        deployment/server-health-monitor

                    kubectl get pods

                    kubectl get service
                '''
            }
        }
    }


    post {

        success {

            echo '''
========================================
SERVER HEALTH MONITOR
BUILD SUCCESSFUL
========================================
'''
        }

        failure {

            echo '''
========================================
SERVER HEALTH MONITOR
BUILD FAILED
========================================
Check Jenkins Console Output
'''
        }
    }
}