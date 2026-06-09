import { authenticateRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { title, message } = body;

        if (!title || !message) {
            return NextResponse.json({ error: "Missing title or message" }, { status: 400 });
        }

        // Fetch all users with a registered push token
        const users = await prisma.user.findMany({
            where: {
                pushToken: {
                    not: null
                }
            },
            select: {
                id: true,
                username: true,
                pushToken: true
            }
        });

        const tokens = users
            .map(u => u.pushToken)
            .filter((token): token is string => typeof token === 'string' && token.trim().length > 0);

        console.log(`Found ${tokens.length} users with registered push tokens for broadcast.`);

        if (tokens.length > 0) {
            // Prepare Expo push notification payloads
            // Expo limit is 100 messages per batch
            const chunks = [];
            const chunkSize = 100;
            for (let i = 0; i < tokens.length; i += chunkSize) {
                chunks.push(tokens.slice(i, i + chunkSize));
            }

            for (const chunk of chunks) {
                const notifications = chunk.map(token => ({
                    to: token,
                    sound: 'default',
                    title: title,
                    body: message,
                    data: { broadcastBy: auth.user.username },
                }));

                // Call Expo Push API
                const response = await fetch('https://exp.host/--/api/v2/push/send', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Accept-encoding': 'gzip, deflate',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(notifications),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Expo push api error response:', errorText);
                } else {
                    const resJson = await response.json();
                    console.log('Expo push api success response:', JSON.stringify(resJson));
                }
            }
        }

        console.log(`[PUSH NOTIFICATION BROADCAST] Title: ${title} | Message: ${message} | Sent to ${tokens.length} devices.`);

        return NextResponse.json({ 
            success: true, 
            message: `Push notification broadcasted to ${tokens.length} active devices successfully.` 
        }, {
            headers: {
                'Access-Control-Allow-Origin': '*',
            }
        });
    } catch (error) {
        console.error("Push notification error:", error);
        return NextResponse.json({ error: "Failed to send push notification" }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
