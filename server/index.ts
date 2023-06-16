import { config } from 'dotenv';
import { resolve } from 'path';
import express from 'express';
import * as proto from '@temporalio/proto';
import cors from 'cors';
import { KubeConfig, CustomObjectsApi } from '@kubernetes/client-node';
import filepath from 'path';

const kc = new KubeConfig();
kc.loadFromDefault();

function parseHosts(matches: { match: string, entryPoints: string[] }[]): string[] {
    const hostRegex = /Host\(`(.+?)`\)/;
    return matches
        .map(({ match, entryPoints }) => {
            const result = match.match(hostRegex);
            if (!result) {
                return null;
            }
            const host = result[1];
            if (entryPoints.includes('websecure')) {
                return 'https://' + host;
            } else if (entryPoints.includes('web')) {
                return 'http://' + host;
            } else {
                console.log(`Ignoring host: ${host}`);
                return null;
            }
        })
        .filter((match): match is string => Boolean(match));
}

const customObjectsApi = kc.makeApiClient(CustomObjectsApi);

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

async function main() {

    const app = express();
    app.use(cors({
        origin: 'https://cloud.temporal.io',  // Or true to allow any origin
        allowedHeaders: ['x-namespace', 'content-type', 'authorization'], // Added 'authorization'
        credentials: true  // This is the important line
    }));
    app.use(express.json());

    app.get('/api', async (req, res) => {

        try {
            const ingressRoutes: any = (await customObjectsApi.listClusterCustomObject(
                'traefik.containo.us',
                'v1alpha1',
                'ingressroutes'
            )).body;

            const matches = ingressRoutes.items.flatMap((item: any) =>
                item.spec.routes.map((route: any) => ({
                    match: route.match,
                    entryPoints: item.spec.entryPoints
                }))
            );

            // dedupe hosts
            const uniqueHosts = [...new Set(parseHosts(matches))];

            // send uniqueHosts as json with a top level key of hosts
            res.json({ hosts: uniqueHosts });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }

    });

    app.use('/static', express.static('static'));

    app.get('/', (req, res) => {
      res.sendFile(filepath.join(__dirname, 'static/index.html'));
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