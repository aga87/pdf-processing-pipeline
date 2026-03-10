import { CloudTasksClient, protos } from '@google-cloud/tasks';

export interface GoogleCloudTasksConfig {
  projectId: string;
  location: string;
  queueName: string;
  serviceAccountEmail?: string;
}

export interface EnqueueHttpTaskOptions {
  url: string;
  body: unknown;
  headers?: Record<string, string>;
  taskName?: string; // enables idempotency (duplicate creation fails with ALREADY_EXISTS)
}
export class GoogleCloudTasksService {
  private client?: CloudTasksClient;

  constructor(private readonly config: GoogleCloudTasksConfig) {}

  public async enqueueHttpTask(options: EnqueueHttpTaskOptions): Promise<void> {
    const client = this.getClient();

    const task: protos.google.cloud.tasks.v2.ITask = {
      ...(options.taskName
        ? { name: `${this.getQueuePath()}/tasks/${options.taskName}` }
        : {}),
      httpRequest: {
        httpMethod: protos.google.cloud.tasks.v2.HttpMethod.POST,
        url: options.url,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: this.encodeBody(options.body),
        ...(this.config.serviceAccountEmail
          ? {
              oidcToken: {
                serviceAccountEmail: this.config.serviceAccountEmail,
              },
            }
          : {}),
      },
    };

    await client.createTask({
      parent: this.getQueuePath(),
      task,
    });
  }

  private getClient(): CloudTasksClient {
    if (!this.client) {
      this.client = new CloudTasksClient();
    }

    return this.client;
  }

  private getQueuePath(): string {
    return this.getClient().queuePath(
      this.config.projectId,
      this.config.location,
      this.config.queueName
    );
  }

  private encodeBody(body: unknown): string {
    return Buffer.from(JSON.stringify(body)).toString('base64');
  }
}
