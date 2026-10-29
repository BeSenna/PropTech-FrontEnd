// Pipeline do Frontend PropTech (Next.js 16, Node 22 na imagem) — agente WINDOWS (usa bat e docker compose).
// Mesmo fluxo do JenkinsfileLinux. O frontend NÃO tem segredos: as variáveis NEXT_PUBLIC_* (lidas no build) ficam no
// environment{} e o docker compose as lê do ambiente do processo. Para agente Linux use o "JenkinsfileLinux".
pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
        timestamps()
    }

    environment {
        APP_NAME                 = 'proptech-frontend'   // = container_name do docker-compose.yml
        APP_PORT                 = '7520'
        NEXT_PUBLIC_BASE_PATH    = '/condominio'                    // site publicado em http://academico3.rj.senac.br/condominio
        NEXT_PUBLIC_API_URL      = '/condominio/gateway/morador'    // MS Moradores, visto pelo navegador, via gateway
    }

    stages {

        stage('Checkout GitHub') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    userRemoteConfigs: [[
                        url: 'https://github.com/BeSenna/PropTech-FrontEnd'
                    ]]
                ])
            }
        }

        stage('Validar Docker Compose') {
            steps {
                bat 'docker compose config --quiet'
            }
        }

        stage('Construir Imagem Docker') {
            steps {
                bat 'docker compose build'
            }
        }

        stage('Deploy Docker') {
            steps {
                bat 'docker compose up -d --no-build --force-recreate'
            }
        }

        stage('Verificar Container') {
            steps {
                sleep time: 10, unit: 'SECONDS'
                bat '''
                    @echo off
                    for /f %%i in ('docker inspect --format "{{.State.Running}}" %APP_NAME%') do set RUNNING=%%i
                    if not "%RUNNING%"=="true" (
                        echo ERRO: Container nao esta rodando.
                        docker logs --tail 50 %APP_NAME%
                        exit /b 1
                    )
                    echo Container em execucao.
                    docker exec %APP_NAME% node -v
                '''
                // Falha aqui deixa o build "instável" (amarelo), sem derrubar o deploy já feito.
                catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                    bat '''docker exec %APP_NAME% node -e "const t=async()=>{for(let i=0;i<10;i++){try{const r=await fetch('http://localhost:7520/condominio/login');if(r.ok){console.log('Frontend respondendo.');return}}catch(e){}await new Promise(r=>setTimeout(r,3000))}console.log('Frontend nao respondeu a tempo.');process.exit(1)};t()"'''
                }
            }
        }
    }

    post {
        success { echo 'Deploy do Frontend realizado com sucesso!' }
        failure { echo 'Houve um erro durante o deploy do Frontend.' }
    }
}
