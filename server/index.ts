import { config } from 'dotenv';
import { resolve } from 'path';
import express from 'express';
import * as proto from '@temporalio/proto';
import cors from 'cors';

// most of this code is from the Temporal samples repo
// https://github.com/temporalio/samples-typescript/blob/main/encryption/src/codec-server.ts

type Payload = proto.temporal.api.common.v1.IPayload;

interface JSONPayload {
    metadata?: Record<string, string> | null;
    data?: string | null;
}

interface Body {
    payloads: JSONPayload[];
}

const path = process.env.NODE_ENV === 'production'
    ? resolve(__dirname, './.env.production')
    : resolve(__dirname, './.env.development');

config({ path });

console.log(process.env.NODE_ENV);

const port = process.env.PORT || 3000;

/**
 * Helper function to convert a valid proto JSON to a payload object.
 *
 * This method will be part of the SDK when it supports proto JSON serialization.
 */
function fromJSON({ metadata, data }: JSONPayload): Payload {
    return {
        metadata:
            metadata &&
            Object.fromEntries(Object.entries(metadata).map(([k, v]): [string, Uint8Array] => [k, Buffer.from(v, 'base64')])),
        data: data ? Buffer.from(data, 'base64') : undefined,
    };
}

async function main() {

    const app = express();
    app.use(cors({
        origin: 'https://cloud.temporal.io',  // Or true to allow any origin
        allowedHeaders: ['x-namespace', 'content-type', 'authorization'], // Added 'authorization'
        credentials: true  // This is the important line
    }));
    app.use(express.json());

    app.get('/', (req, res) => {
        res.send(`Hi from the App Directory Server!`);
    });

    await new Promise<void>((resolve, reject) => {
        app.listen(port, () => {
            console.log(`App Directory Server listening at http://localhost:${port}`);
        });
        app.on('error', reject);
    });

}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});