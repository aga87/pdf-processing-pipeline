# Cloud-native PDF Processing Pipeline - PoC

This service processes PDF files stored in a Google Drive folder and demonstrates the pipeline structure:

```
Retrieve → Parse → Transform → Decide → Route
```

The current implementation extracts a simple title from the PDF text to generate a filename. This is intentionally minimal and serves only as an example of the Transform step.

The pipeline is designed so that transformation logic can be replaced via **pluggable policies** without changing the processing workflow.

The system is designed to be:

- Deterministic
- Idempotent (duplicate-safe)
- Cloud-friendly
- Fully automated
- **Extensible via policies (strategy pattern)**


## Workflow

It performs the following high-level workflow:

1. Retrieves PDF files from a “to process” folder.
2. Downloads each PDF.
3. Extracts a simple title from the PDF text.
4. Checks for duplicates.
5. Moves the file to:

- ✅ Processed folder (renamed)
- ♻️ Duplicates folder
- ❌ Failed folder (if processing errors occur)

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


## Setup 

### Folder Structure

The service expects the following Google Drive folders:

- PDFS_TO_PROCESS_FOLDER_ID
- PDFS_PROCESSED_FOLDER_ID
- PDFS_DUPLICATES_FOLDER_ID
- PDFS_FAILED_FOLDER_ID

### Google OAuth2 Service Account Authentication

1. Enable Google Drive API for your project.
2. Create a Service Account in Google Cloud (do not assign any roles)
3. Generate JSON key, stringify and save to an env var `GOOGLE_SERVICE_ACCOUNT_JSON`
4. Share Google Drive folders with the service account - enter the service account email and assign Editor or Viewer role, depending on your needs

## Running locally

Running locally

```bash
npm run build

docker build -t pdf-processing-service .

# With environment variables
docker run --env-file .env -p 8080:8080 pdf-processing-service
```

Note: Ensure required environment variables are defined in your local `.env` file.

