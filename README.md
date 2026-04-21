# Cloud-native PDF Processing Pipeline

This service processes PDF files stored in a Google Drive folder and demonstrates a simple, cloud-native processing pipeline.

```
Retrieve → Parse → Transform → Decide → Route
```

The current implementation extracts a simple title from the PDF text to generate a filename. This transformation step is intentionally minimal and serves only as an example.


The pipeline is designed so that transformation logic can be replaced via **pluggable policies** (strategy pattern) without changing the overall workflow.

The system is designed to be:

- **Deterministic** — the same input produces the same outcome
- **Idempotent** — files can be safely retried without duplication  
- **Cloud-native** — built around Cloud Run and Cloud Tasks 
- **Fully automated** — no manual intervention required 
- **Extensible** — transformation logic can evolve independently

## Tech Stack

- Node.js
- Typescript
- Google Drive API
- GCP Cloud Tasks
- GCP Cloud Scheduler
- GCP Cloud Run

## **Workflow**

At a high level the service performs the following steps:

1. Retrieve PDF files from a **“to process”** Google Drive folder.
2. Download each file.
3. Extract a simple title from the PDF text.
4. Check whether the document is a duplicate.
5. Route the file to the appropriate folder:
    

- ✅ **Processed** — renamed and stored
- ♻️ **Duplicates** — duplicate content detected
- ❌ **Failed** — processing error occurred
    

## **How the system runs end-to-end**

File discovery and file processing are intentionally **decoupled**.
A dispatcher scans the Drive folder and creates one Cloud Task per file.
Cloud Tasks then controls processing rate, retries, and delivery.

```
Google Drive folder
        │
        ▼
Dispatcher scans files
        │
        ▼
enqueueHttpTask({ fileId })
        │
        ▼
Cloud Tasks queue
(rate limited)
        │
        ▼
Cloud Run worker endpoint
        │
        ▼
PDF processing pipeline
```


## **Processing strategy**

Each file is processed independently through the queue. Key principles:

- 1 task = 1 PDF
- Workers process exactly one file per task
- Failures and retries occur per file, not per batch

This approach isolates failures, enables controlled throughput, and prevents bursts of uploads from overwhelming downstream APIs.

___

## Branches

- `main` – Production branch. This branch represents the stable and production-ready version of the code. It is used for deployments to the live environment.

- `dev` – Development branch. This is the default branch for ongoing development work. It is where new features and bug fixes are implemented and tested before being merged into the main branch. It is used for deployments to the staging environment.

___

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

```bash
npm run build

docker build -t pdf-processing-service .

# With environment variables
docker run --env-file .env -p 8080:8080 pdf-processing-service
```

Note: Ensure required environment variables are defined in your local `.env` file.

## Deploying to Cloud Run

### One-off infrastructure setup

#### 1. Enable required APIs

Enable Cloud Run API and Secret Manager

```
gcloud services enable run.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

#### 2. Create the Cloud Run service account and grant it access to read secrets


```shell
# Command
gcloud iam service-accounts create <SERVICE_ACCOUNT_NAME> \
  --display-name="<DISPLAY_NAME>"
  
# Example
gcloud iam service-accounts create pdf-processing-service-sa \
  --display-name="PDF Processing Cloud Run Service"
```

Get the email

```shell
gcloud iam service-accounts list --filter="email:pdf-processing-service-sa"
```

Grant permissions
```shell
# Command
gcloud projects add-iam-policy-binding <PROJECT_ID> \
  --member="serviceAccount:<SERVICE_ACCOUNT_NAME>@<PROJECT_ID>.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
  
# Example
gcloud projects add-iam-policy-binding drive-pdf-processing-pipeline \
  --member="serviceAccount:pdf-processing-service-sa@drive-pdf-processing-pipeline.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

#### 3. Authenticate Docker with Artifact Registry (**one-off**)

```shell
# Command
gcloud auth configure-docker <REGION>-docker.pkg.dev

# Example
gcloud auth configure-docker europe-west3-docker.pkg.dev
```


#### 4. Create the Artifact Registry repository

```shell
# Command
gcloud artifacts repositories create <REPOSITORY_NAME> \
--project=<PROJECT_ID> \
--repository-format=docker \
--location=<REGION> \
--description="Docker repository for <DESCRIPTION>"

# Example
gcloud artifacts repositories create pdf-processing-repo \
  --project=drive-pdf-processing-pipeline \
  --repository-format=docker \
  --location=europe-west3 \
  --description="Docker repository for PDF processing service"
```

#### 5. Populate secrets in Google Secret Manager

Only secrets. No configs should be placed here.

```shell
gcloud secrets create GOOGLE_SERVICE_ACCOUNT_JSON
```

### Build & Deploy 

#### 1. Build the image locally

```shell
# First, compile Typescript locally:
npm run build

# When you’re on an M1/M2 Mac and deploying to Cloud Run:
docker buildx build --platform linux/amd64 -t <LOCAL_IMAGE_NAME> <BUILD_CONTEXT>

# Example
docker buildx build --platform linux/amd64 -t pdf-processing-service .
```


#### 2. Tag the Image for Artifact Registry (GCR)

```shell
docker tag <LOCAL_IMAGE_NAME> <REGION>-docker.pkg.dev/<PROJECT_ID>/<REPOSITORY_NAME>/<REMOTE_IMAGE_NAME>

# Example
docker tag pdf-processing-service europe-west3-docker.pkg.dev/drive-pdf-processing-pipeline/pdf-processing-repo/pdf-processing-service
```

#### 3. Push to Artifact Registry

```shell
# Command
docker push <REGION>-docker.pkg.dev/<PROJECT_ID>/<REPOSITORY_NAME>/pdf-processing-service

# Example
docker push europe-west3-docker.pkg.dev/drive-pdf-processing-pipeline/pdf-processing-repo/pdf-processing-service
```

#### 4. Deploy to Cloud run

##### **First deployment  - pass secrets and config** 

```shell
# Command
gcloud run deploy <SERVICE_NAME> \
  --image <REGION>-docker.pkg.dev/<PROJECT_ID>/<REPOSITORY_NAME>/<IMAGE_NAME> \
  --region <REGION> \
  --service-account=<SERVICE_ACCOUNT_EMAIL> \
  --concurrency=<CONCURRENCY> \
  --max-instances=<MAX_INSTANCES> \
  --set-env-vars "<CONFIG_VAR_1>=<VALUE_1>,<CONFIG_VAR_2>=<VALUE_2>" \
  --update-secrets "<SECRET_ENV_VAR_1>=<SECRET_NAME_1>:latest"
```


```shell
# Eample
gcloud run deploy pdf-processing-service \
  --image europe-west3-docker.pkg.dev/drive-pdf-processing-pipeline/pdf-processing-repo/pdf-processing-service \
  --region europe-west3 \
  --service-account=pdf-processing-service-sa@drive-pdf-processing-pipeline.iam.gserviceaccount.com \
  --concurrency=1 \
  --max-instances=1 \
  --set-env-vars "PDFS_TO_PROCESS_FOLDER_ID=1863uE4CLsfpogKtEt3kOrJlg05F54rOO,PDFS_PROCESSED_FOLDER_ID=1GFxPgOeoqQlT2vfPdYVzO4TM0XkmpiQC,PDFS_DUPLICATES_FOLDER_ID=1tA3xSjQ0nz68vWa_8SC14OBw-Cdhadn1,PDFS_FAILED_FOLDER_ID=1LAIY15MwdJnl8WRv_nkAfBfRB65GTwjQ" \
  --update-secrets "GOOGLE_SERVICE_ACCOUNT_JSON=GOOGLE_SERVICE_ACCOUNT_JSON:latest"
```

##### Subsequent deployments

```shell
gcloud run deploy pdf-processing-service \
  --image europe-west3-docker.pkg.dev/drive-pdf-processing-pipeline/pdf-processing-repo/pdf-processing-service \
  --region europe-west3
```

### Testing

#### Viewing logs

Go to the [Log Explorer](https://console.cloud.google.com/logs) ane run this query:

```
resource.type="cloud_run_revision"
resource.labels.service_name="<SERVICE_NAME>"
```

#### Invoking private endpoints

You can test private Cloud Run services using your own Google identity. Your **identity** is simply the Google account you authenticated with gcloud.

First, grant permissions: 

```shell
gcloud run services add-iam-policy-binding <SERVICE-NAME> \
  --region=europe-west3 \
  --member="user:<EMAIL>" \
  --role="roles/run.invoker"
```

Second, generate an identity token:

```shell
gcloud auth print-identity-token
```

And use it as a Bearer token in the Authorization header.


## Cloud Tasks Setup

### 1. Enable required APIs (one-off)

Before creating the queue, enable the required Google Cloud APIs.

```shell
gcloud services enable cloudtasks.googleapis.com
gcloud services enable iamcredentials.googleapis.com
```


### 2. Create Google Cloud Task Queue (one-off)

Before running the service, create the Cloud Tasks queue used to dispatch PDF processing jobs.

This only needs to be done once per environment.


```shell
#Command
gcloud tasks queues create <QUEUE_NAME> \
  --location=<REGION> \
  --max-dispatches-per-second=<DISPATCH_RATE> \
  --max-concurrent-dispatches=<MAX_CONCURRENCY>

# Example  
gcloud tasks queues create pdf-processing-queue \
  --location=europe-west3 \
  --max-dispatches-per-second=1 \
  --max-concurrent-dispatches=1
```

The queue throttles execution so that PDFs are processed in a controlled way.
- 	max-dispatches-per-second: 1 → prevents API spikes
- 	max-concurrent-dispatches: 1 → ensures only one PDF is processed at a time

If many PDFs are uploaded simultaneously, they will be queued and processed sequentially.


### 3. Create the Cloud Tasks invoker service account (one-off)

```shell
# Command
gcloud iam service-accounts create <SERVICE_ACCOUNT_NAME> \
  --display-name="<DISPLAY_NAME>"

# Example  
gcloud iam service-accounts create pdf-processing-task-invoker \
  --display-name="PDF Processing Task Invoker"
```

Verify and get the email: 

```shell
gcloud iam service-accounts list --filter="email:pdf-processing-task-invoker"
```
 
### **4. Grant required IAM permissions** (one-off)

#### **4a. Allow the task caller service account to invoke the Cloud Run worker**

```shell
# Command
gcloud run services add-iam-policy-binding <SERVICE_NAME> \
  --member="serviceAccount:<TASK_INVOKER_SERVICE_ACCOUNT>@<PROJECT_ID>.iam.gserviceaccount.com" \
  --role="roles/run.invoker" \
  --region=<REGION>

# Example
gcloud run services add-iam-policy-binding pdf-processing-service \
  --member="serviceAccount:pdf-processing-task-invoker@drive-pdf-processing-pipeline.iam.gserviceaccount.com" \
  --role="roles/run.invoker" \
  --region=europe-west3
```

This allows **Cloud Tasks to call the worker over HTTPS using an OIDC token** from that service account. 

#### **4b. Allow the Cloud Run service that enqueues tasks to create tasks**

```shell
# Command
gcloud projects add-iam-policy-binding <PROJECT_ID> \
  --member="serviceAccount:<ENQUEUER_SERVICE_ACCOUNT>@<PROJECT_ID>.iam.gserviceaccount.com" \
  --role="roles/cloudtasks.enqueuer"

# Example
gcloud projects add-iam-policy-binding drive-pdf-processing-pipeline \
  --member="serviceAccount:pdf-processing-service-sa@drive-pdf-processing-pipeline.iam.gserviceaccount.com" \
  --role="roles/cloudtasks.enqueuer"
```

This is needed because **Cloud Run service runtime identity** is what calls the Cloud Tasks API to create the task. roles/cloudtasks.enqueuer includes cloudtasks.tasks.create. 

  
#### **4c. Allow the enqueuer service account to act as the task invoker service account**

```shell
# Command
gcloud iam service-accounts add-iam-policy-binding \
  <TASK_INVOKER_SERVICE_ACCOUNT>@<PROJECT_ID>.iam.gserviceaccount.com \
  --member="serviceAccount:<ENQUEUER_SERVICE_ACCOUNT>@<PROJECT_ID>.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Example
gcloud iam service-accounts add-iam-policy-binding \
  pdf-processing-task-invoker@drive-pdf-processing-pipeline.iam.gserviceaccount.com \
  --member="serviceAccount:pdf-processing-service-sa@drive-pdf-processing-pipeline.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

This is needed **only if** the service creating the task is different from the service account specified in oidcToken.serviceAccountEmail. 


### 5. Configure the Cloud Tasks environment variables (one-off)

Your application needs the queue and invoker identity in its runtime config.

**Required env vars**

```
GCP_PROJECT_ID
CLOUD_TASKS_LOCATION
CLOUD_TASKS_PDF_PROCESSING_QUEUE_NAME
CLOUD_TASKS_INVOKER_SERVICE_ACCOUNT_EMAIL
```

If the Cloud Run service already exists, **update** it with:

```shell
# Command
gcloud run services update <SERVICE_NAME> \
  --region=<REGION> \
  --update-env-vars "<ENV_VAR_1>=<VALUE_1>,<ENV_VAR_2>=<VALUE_2>"

# Example  
gcloud run services update pdf-processing-service \
  --region=europe-west3 \
  --update-env-vars "GCP_PROJECT_ID=drive-pdf-processing-pipeline,CLOUD_TASKS_LOCATION=europe-west3,CLOUD_TASKS_PDF_PROCESSING_QUEUE_NAME=pdf-processing-queue,CLOUD_TASKS_INVOKER_SERVICE_ACCOUNT_EMAIL=pdf-processing-task-invoker@drive-pdf-processing-pipeline.iam.gserviceaccount.com"
```

### 6. Deploy the application version with Cloud Tasks integration (one-off)

Get the worker URL: 

```shell
# Command
gcloud run services describe <SERVICE_NAME> \
  --region=<REGION> \
  --format='value(status.url)'

# Example  
gcloud run services describe pdf-processing-service \
  --region=europe-west3 \
  --format='value(status.url)'
```

**Note:** The worker URL must include the **processing endpoint path**, not just the base Cloud Run service URL.

```shell
https://<CLOUD_RUN_SERVICE_URL>/<PROCESSING_ENDPOINT>
```

Redeploy 

```shell
gcloud run services update pdf-processing-service \
  --region=europe-west3 \
  --update-env-vars "PDF_PROCESSING_WORKER_URL=https://pdf-processing-service-m6hxyu3hsa-ey.a.run.app/process-pdf"
```

## Cloud Scheduler Cron Setup for Cloud Run

### Create a Scheduler invoker service account

Create a dedicated service account that Cloud Scheduler will use to generate the OIDC token when calling the Cloud Run endpoint.

```shell
gcloud iam service-accounts create pdf-processing-scheduler-sa \
  --display-name="PDF Processing Scheduler Invoker"
```

Verify and retrieve the email:

```shell
gcloud iam service-accounts list \
  --filter="email:pdf-processing-scheduler-sa"
```

Outputs `pdf-processing-scheduler-sa@drive-pdf-processing-pipeline.iam.gserviceaccount.com`

### Grant it **`roles/run.invoker`**

Allow the Scheduler service account to invoke the Cloud Run service.

Run:

```shell
gcloud run services add-iam-policy-binding pdf-processing-service \
  --region=europe-west3 \
  --member="serviceAccount:pdf-processing-scheduler-sa@drive-pdf-processing-pipeline.iam.gserviceaccount.com" \
  --role="roles/run.invoker"
```

### Create the Scheduler job with OIDC

Create a Scheduler job that calls the Cloud Run cron endpoint using an **OIDC identity token**.

The token will be generated for the Scheduler service account and verified by Cloud Run before the request reaches the application.

Required parameters:

- `--oidc-service-account-email` → service account used to generate the identity token
- `--oidc-token-audience` → the Cloud Run service URL the token is intended for

Example:

```shell
gcloud scheduler jobs create http process-pdfs-cron \
  --location=europe-west3 \
  --schedule="*/5 6-18 * * 1-5" \
  --time-zone="Europe/Amsterdam" \
  --uri="https://pdf-processing-service-m6hxyu3hsa-ey.a.run.app/cron/pdf-processing-tasks" \
  --http-method=POST \
  --oidc-service-account-email="pdf-processing-scheduler-sa@drive-pdf-processing-pipeline.iam.gserviceaccount.com" \
  --oidc-token-audience="https://pdf-processing-service-m6hxyu3hsa-ey.a.run.app/"
```