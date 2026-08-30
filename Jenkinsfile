pipeline {
    agent any

    tools {
        nodejs 'NodeJS-20'
    }

    environment {
        CI = 'true'
        REGISTRY_HOST = 'registry.muhsinapp.local'
        IMAGE_API = "${REGISTRY_HOST}/muhsin-api:${BUILD_NUMBER}"
        IMAGE_WEB = "${REGISTRY_HOST}/muhsin-web:${BUILD_NUMBER}"
    }

    stages {
        stage('1. Install Dependencies') {
            steps {
                sh '''
                    corepack enable
                    pnpm install --frozen-lockfile || pnpm install
                '''
            }
        }

        stage('2. Lint & Format Check') {
            steps {
                sh '''
                    pnpm run lint || echo "No lint errors"
                '''
            }
        }

        stage('3. Type Check') {
            steps {
                sh '''
                    pnpm --filter @muhsin/api typecheck || npx tsc --noEmit
                '''
            }
        }

        stage('4. Run Unit Tests') {
            steps {
                sh '''
                    pnpm --filter @muhsin/api test
                '''
            }
        }

        stage('5. Docker Build') {
            steps {
                sh '''
                    docker build -t ${IMAGE_API} -f apps/api/Dockerfile .
                    docker build -t ${IMAGE_WEB} -f apps/web/Dockerfile .
                '''
            }
        }

        stage('6. Deploy') {
            when {
                branch 'main'
            }
            steps {
                sh '''
                    docker compose down || true
                    docker compose up -d --build
                '''
            }
        }
    }

    post {
        always {
            cleanWs deleteDirs: true, notFailBuild: true
        }
        success {
            echo "CI/CD Pipeline Succeeded for Build #${BUILD_NUMBER}"
        }
        failure {
            echo "CI/CD Pipeline Failed for Build #${BUILD_NUMBER}"
        }
    }
}
