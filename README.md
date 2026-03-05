# Cloud-native PDF Processing Pipeline - PoC

## Tech stack

- Node.js / TypeScript
- Express
- Docker
- Cloud Run
- Google Drive API (Service Account authentication)

We use **Dockerized Express service deployed on Cloud Run** to run the PDF processing service in a fully controlled runtime environment. By deploying to Cloud Run, we can package system-level dependencies such as `fonts-noto`, `fonts-dejavu`, and `poppler-utils` directly into a custom container. This ensures accurate PDF text extraction by providing the necessary font rendering and PDF parsing capabilities within the container itself.

## Branches

- `main` – Production branch. This branch represents the stable and production-ready version of the code. It is used for deployments to the live environment.

- `dev` – Development branch. This is the default branch for ongoing development work. It is where new features and bug fixes are implemented and tested before being merged into the main branch. It is used for deployments to the staging environment.


## Running locally

Running locally

```bash
npm run build

docker build -t pdf-processing-service .

# With environment variables
docker run --env-file .env -p 8080:8080 pdf-processing-service
```

Note: Ensure required environment variables are defined in your local `.env` file.

