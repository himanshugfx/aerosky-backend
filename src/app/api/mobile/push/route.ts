import { authenticateRequest } from "@/lib/api-auth";
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

        // Here we would integrate with Expo Push Notifications or FCM/APNs
        console.log(`[PUSH NOTIFICATION BROADCAST] Title: ${title} | Message: ${message} | By: ${auth.user.username}`);

        // Mock success response
        return NextResponse.json({ success: true, message: "Push notification broadcasted to all users successfully." });
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
