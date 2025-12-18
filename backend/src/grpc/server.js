import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';

import { processHandler } from './handlers/processHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class GrpcServer {
  constructor() {
    this.server = null;
    this.port = process.env.GRPC_PORT || 50051;
  }

  async start() {
    const serviceName = process.env.SERVICE_NAME || 'learnerAI';
    const protoPath = path.join(__dirname, '../../proto/microservice.proto');

    const packageDefinition = protoLoader.loadSync(protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
    });

    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
    const microservice = protoDescriptor.microservice?.v1;
    if (!microservice?.MicroserviceAPI?.service) {
      throw new Error('Failed to load MicroserviceAPI from proto');
    }

    this.server = new grpc.Server();
    this.server.addService(microservice.MicroserviceAPI.service, {
      Process: processHandler.handle.bind(processHandler)
    });

    await new Promise((resolve, reject) => {
      this.server.bindAsync(
        `0.0.0.0:${this.port}`,
        grpc.ServerCredentials.createInsecure(),
        (err, boundPort) => {
          if (err) return reject(err);
          this.port = boundPort;
          console.log(`✅ GRPC server started: ${serviceName} on port ${boundPort}`);
          resolve();
        }
      );
    });
  }

  async shutdown() {
    if (!this.server) return;
    await new Promise((resolve) => {
      this.server.tryShutdown(() => resolve());
    });
    this.server = null;
  }
}

export const grpcServer = new GrpcServer();


