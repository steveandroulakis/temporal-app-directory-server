## Temporal App Directory Server
https://apps.tmprl-demo.cloud/

### Install
- `cd server/`
- `npm install`

### Developer environment
- Requires nodemon and ts-node installed
- Open VSCode and hit 'start debugging' on the 'Codec Server' configuration

### Configuration
- `server/` contains `.env_example`. Copy it to `.env.development` and change settings to match your temporal installation.

### Docker (not implemented yet)

`cd server`

`docker build -t temporal-app-directory-server .`

`docker run -p 3000:3000 -e PORT=3000 -d --platform linux/amd64 temporal-app-directory-server`

### Kubernetes

- Edit the yaml files to ensure your environment variables are correct (e.g. namespace and address).

```
cd yaml/
kubectl apply -f deployments/server-deployment.yaml
kubectl apply -f services/server-service.yaml
kubectl apply -f ingress/server-ingress.yaml
kubectl apply -f certificates/certificate.yaml
```