pipeline {
    agent {
        docker {
            image 'node:6.10'
            args  '-v /tmp:/tmp'
        }
    }

    triggers {
        pollSCM('*/5 * * * *')
        cron('@daily')
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    stages {
        stage('Prepare') {
            steps {
                checkout scm
                sh '''
                    node -v
                    npm -v
                    npm install
                    npm run clean
                '''
            }
        }
        stage('Validate') {
            steps {
                sh '''
                    npm run check:lint
                '''
            }
        }
        stage('Build') {
            steps {
                sh '''
                    npm run compile
                '''
            }
        }
        stage('Test') {
            steps {
                sh '''
                    npm run check:coverage
                '''
                junit 'reports/*.xml'
                archiveArtifacts allowEmptyArchive: true, artifacts: 'coverage/**/*', defaultExcludes: false, fingerprint: true, onlyIfSuccessful: true
            }

            post {
                success {
                    publishHTML target: [
                        allowMissing: false,
                        alwaysLinkToLastBuild: false,
                        keepAll: true,
                        reportDir: 'coverage',
                        reportFiles: 'index.html',
                        reportName: 'Istanbul Report'
                    ]
                }
            }
        }
    }
}
