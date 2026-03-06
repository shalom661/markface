---
description: Iniciar o ambiente de desenvolvimento completo
---

// turbo-all

1. Abrir o Docker Desktop:
```
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```
Após rodar este comando, aguardar 60 segundos para o Docker Desktop inicializar completamente antes de continuar.

2. Subir os containers do Docker (backend, banco, redis):
```
docker-compose up -d
```
Executar na pasta: `c:\MARK FACE HUB`

3. Iniciar o servidor de desenvolvimento do frontend:
```
cmd /c "npm run dev"
```
Executar na pasta: `c:\MARK FACE HUB\frontend`

4. Abrir o navegador no endereço do frontend:
```
cmd /c start http://localhost:5173
```
