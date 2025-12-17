import { auth } from '@tern-secure/nextjs/server'
import { getMyContacts } from '@/lib/db/queries'

export async function GET(request: Request) {
    const { user } = await auth();
    if (!user?.uid) return new Response('Unauthorized', { status: 401 });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const result = await getMyContacts(user.uid);

            if (result.success && result.contacts) {
                for (const contact of result.contacts) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(contact)}\n\n`));
                    await new Promise(resolve => setTimeout(resolve, 100)); // 10 contacts/sec
                }
            }

            controller.close();
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}