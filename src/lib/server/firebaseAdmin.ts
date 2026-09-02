import { initializeApp, getApps, cert, App } from 'firebase-admin/app';

let app: App;

if (getApps().length === 0) {
    app = initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
} else {
    app = getApps()[0];
}

export default app;
