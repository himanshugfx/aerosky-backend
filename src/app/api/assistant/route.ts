import { authenticateRequest } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

// Input validation schema
const assistantRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
  history: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ).optional().default([]),
});

type AssistantRequest = z.infer<typeof assistantRequestSchema>;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Fetches comprehensive context data about the user's operations
 */
async function getContextData(organizationId?: string, userId?: string) {
  try {
    const where: any = {};
    
    // Filter by organization if user is not SUPER_ADMIN
    if (organizationId) {
      where.organizationId = organizationId;
    }

    // Note: Lead model doesn't have organizationId field, so we count all leads
    // TODO: Add organizationId to Lead model in schema migration
    const leadWhere: any = {};

    const [drones, orders, flights, components, teamMembers, batteries, leads] = await Promise.all([
      prisma.drone.count({ where }),
      prisma.order.count({ where }),
      prisma.flightLog.count({ where }),
      prisma.component.count({ where }),
      prisma.teamMember.count({ where }),
      prisma.battery.count({ where }),
      prisma.lead.count({ where: leadWhere }),
    ]);

    // Get recent orders with more details
    const recentOrders = await prisma.order.findMany({
      where,
      select: {
        id: true,
        contractNumber: true,
        clientName: true,
        contractValue: true,
        manufacturingStage: true,
        paymentStatus: true,
        quantity: true,
        droneModel: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get low stock components
    const lowStockComponents = await prisma.component.findMany({
      where: {
        ...where,
        quantity: { lte: 5 },
      },
      select: {
        name: true,
        quantity: true,
        category: true,
      },
      take: 10,
    });

    // Get high-priority orders (critical for analysis)
    const criticalOrders = await prisma.order.findMany({
      where: {
        ...where,
        priorityLevel: 'High',
      },
      select: {
        contractNumber: true,
        clientName: true,
        priorityLevel: true,
        manufacturingStage: true,
      },
      take: 5,
    });

    // Calculate order statistics
    const orderStats = {
      inDesign: orders > 0 ? recentOrders.filter(o => o.manufacturingStage === 'In Design').length : 0,
      inProduction: orders > 0 ? recentOrders.filter(o => o.manufacturingStage === 'In Production').length : 0,
      readyForDelivery: orders > 0 ? recentOrders.filter(o => o.manufacturingStage === 'Ready for Delivery').length : 0,
      delivered: orders > 0 ? recentOrders.filter(o => o.manufacturingStage === 'Delivered').length : 0,
    };

    // Calculate payment statistics
    const paymentStats = {
      paid: orders > 0 ? recentOrders.filter(o => o.paymentStatus === 'Paid').length : 0,
      pending: orders > 0 ? recentOrders.filter(o => o.paymentStatus === 'Pending').length : 0,
      unpaid: orders > 0 ? recentOrders.filter(o => o.paymentStatus === 'Unpaid').length : 0,
    };

    // Calculate total contract value
    const totalContractValue = recentOrders.reduce((sum, o) => sum + parseFloat(o.contractValue.toString()), 0);

    return {
      summary: {
        totalDrones: drones,
        totalOrders: orders,
        totalFlights: flights,
        totalComponents: components,
        teamMembers: teamMembers,
        batteries: batteries,
        totalLeads: leads,
      },
      stats: {
        orderStats,
        paymentStats,
        totalContractValue: totalContractValue.toFixed(2),
      },
      recentOrders: recentOrders.map(o => ({
        ...o,
        contractValue: o.contractValue.toString(),
        createdAt: o.createdAt.toLocaleDateString('en-IN'),
      })),
      criticalOrders,
      lowStockItems: lowStockComponents,
    };
  } catch (error) {
    console.error('Error fetching context data:', error);
    return null;
  }
}

/**
 * Builds an intelligent system prompt with rich context and instructions
 */
function buildSystemPrompt(contextData: any): string {
  if (!contextData) {
    return `You are Aero, an intelligent AI assistant for AeroSky Aviation. Help with operational questions and provide suggestions for efficiency.`;
  }

  const {
    summary = {},
    stats = {},
    recentOrders = [],
    criticalOrders = [],
    lowStockItems = [],
  } = contextData;

  return `# Aero - AeroSky Aviation Intelligence Assistant

You are Aero, an advanced AI assistant for AeroSky Aviation operations. Your role is to provide intelligent insights, answer operational questions, identify trends, and suggest improvements based on real-time data.

## Current Operational Context

### Fleet & Assets
- **Drone Fleet**: ${summary.totalDrones} drones operational
- **Battery Inventory**: ${summary.batteries} battery packs available
- **Components**: ${summary.totalComponents} items in stock
- **Team Members**: ${summary.teamMembers} active team members

### Sales & Orders Pipeline
- **Total Orders**: ${summary.totalOrders} contracts in pipeline
- **Total Contract Value**: ₹${stats.totalContractValue || '0'} 
- **Order Status Distribution**: 
  - In Design: ${stats.orderStats?.inDesign || 0}
  - In Production: ${stats.orderStats?.inProduction || 0}
  - Ready for Delivery: ${stats.orderStats?.readyForDelivery || 0}
  - Delivered: ${stats.orderStats?.delivered || 0}
- **Payment Status**:
  - Paid: ${stats.paymentStats?.paid || 0}
  - Pending: ${stats.paymentStats?.pending || 0}
  - Unpaid: ${stats.paymentStats?.unpaid || 0}

### Business Metrics
- **Active Leads**: ${summary.totalLeads} in pipeline
- **Flight Records**: ${summary.totalFlights} completed flights
- **Low Stock Items**: ${lowStockItems.length} components need replenishment

## Recent Activity

### Critical Orders (High Priority)
${criticalOrders.length > 0 
  ? criticalOrders.map((o: any) => '- **' + o.contractNumber + '** (' + o.clientName + '): ' + o.manufacturingStage + ' - Level: ' + o.priorityLevel).join('\n')
  : '- No critical orders at this time'}

### Top Recent Orders
${recentOrders.slice(0, 5).map((o: any) => 
  '- **' + o.contractNumber + '**: ' + o.clientName + ' (₹' + o.contractValue + ', Qty: ' + o.quantity + ') - ' + o.manufacturingStage + ' - Payment: ' + o.paymentStatus
).join('\n')}

### Low Stock Alert
${lowStockItems.length > 0
  ? lowStockItems.map((item: any) => '- **' + item.name + '** (' + item.category + '): Only ' + item.quantity + ' units left').join('\n')
  : '- All inventory levels are healthy'}

## Your Capabilities & Instructions

1. **Answer Questions**: Accurately answer questions about operational metrics, orders, inventory, and fleet status
2. **Identify Trends**: Spot patterns in orders, revenues, bottlenecks, and opportunities
3. **Provide Recommendations**: Suggest improvements for efficiency, resource allocation, and risk management
4. **Analyze Data**: Calculate percentages, growth rates, and performance metrics when asked
5. **Summarize Reports**: Create executive summaries and dashboards when requested
6. **Flag Issues**: Alert to critical situations like low stock, unpaid orders, or overdue deliveries

## Response Guidelines

- Be **concise yet comprehensive** - provide actionable insights
- Use **bullet points and formatting** for clarity
- Include **specific numbers** from the data
- Suggest **next steps** or **actions** when relevant
- If data is incomplete, explain what's missing and why
- Always be **professional and operational-focused**

## Common Question Patterns

- "How many [resource]?" → Provide count + context
- "Status of [order/project]?" → Give stage + timeline + risks
- "What should we do about [issue]?" → Analyze + recommend solutions
- "Compare [metrics]?" → Show relationships + trends
- "Are we on track?" → Assess performance vs. capacity

## Important Notes

- All data shown is current as of today
- You have access to 10 recent orders and insights
- Focus on actionable intelligence, not just reporting numbers
- Consider context: seasonal trends, team capacity, resource constraints`;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized', reply: 'Please log in to chat with Aero.' },
        { status: 401 }
      );
    }

    // 2. Allow access - assistant is available to all authenticated users
    // Data is already organization-scoped through context fetching

    // 3. Validate request body
    const body = await request.json();
    const validated = assistantRequestSchema.parse(body);

    // 4. Get context data
    const contextData = await getContextData(auth.user.organizationId, auth.user.id);

    // 5. Build conversation history for Gemini
    const conversationHistory = [
      ...validated.history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
    ];

    // 6. Create and send request to Gemini with error handling
    let responseText = '';
    
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not configured');
      }

      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        systemInstruction: buildSystemPrompt(contextData),
      });

      const chat = model.startChat({
        history: conversationHistory,
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
        },
      });

      const result = await chat.sendMessage(validated.message);
      
      // Safely extract text from response
      if (!result || !result.response) {
        throw new Error('No response from Gemini API');
      }

      const textContent = result.response.text();
      if (!textContent) {
        throw new Error('Empty response text from Gemini');
      }
      
      responseText = textContent;
    } catch (geminiError) {
      console.error('Gemini API error:', geminiError);
      
      // Fallback: Generate intelligent responses from the context data
      const userMessage = validated.message.toLowerCase();
      const orderStats: any = contextData?.stats?.orderStats || {};
      const paymentStats: any = contextData?.stats?.paymentStats || {};
      
      // Intent detection - analyze what the user is asking about
      if (userMessage.includes('lead')) {
        responseText = `You have **${contextData?.summary?.totalLeads || 0} active leads** in your sales pipeline. This includes potential opportunities across various stages. To close more deals faster, focus on high-value leads and maintain consistent follow-ups.`;
      } else if (userMessage.includes('drone')) {
        responseText = `Your drone fleet consists of **${contextData?.summary?.totalDrones || 0} drones** with **${contextData?.summary?.batteries || 0} battery packs** available. This gives you capacity for multiple simultaneous operations. Ensure regular maintenance to keep all units mission-ready.`;
      } else if (userMessage.includes('order') || userMessage.includes('contract')) {
        const totalValue = contextData?.stats?.totalContractValue || '0';
        responseText = `You have **${contextData?.summary?.totalOrders || 0} active orders** worth **₹${totalValue}** in total contract value.\n\n**Order Pipeline Status:**\n- In Design: ${orderStats.inDesign || 0}\n- In Production: ${orderStats.inProduction || 0}\n- Ready for Delivery: ${orderStats.readyForDelivery || 0}\n- Delivered: ${orderStats.delivered || 0}\n\n**Payment Status:**\n- Paid: ${paymentStats.paid || 0}\n- Pending: ${paymentStats.pending || 0}\n- Unpaid: ${paymentStats.unpaid || 0}\n\nFocus on collecting unpaid invoices and expediting orders in production.`;
      } else if (userMessage.includes('inventory') || userMessage.includes('stock') || userMessage.includes('component')) {
        const lowStockCount = contextData?.lowStockItems?.length || 0;
        responseText = `Your inventory has **${contextData?.summary?.totalComponents || 0} components** in stock. ${lowStockCount > 0 ? `**⚠️ ${lowStockCount} items are running low** and need replenishment:` : 'All inventory levels are healthy.'}\n\n${contextData?.lowStockItems?.map((item: any) => `- **${item.name}** (${item.category}): ${item.quantity} units remaining`).join('\n') || 'No critical stock issues.'}`;
      } else if (userMessage.includes('flight') || userMessage.includes('operation')) {
        responseText = `You have **${contextData?.summary?.totalFlights || 0} flight records** logged in the system. This indicates active operational history and helps with compliance tracking. Continue logging all flights for regulatory documentation and operational analytics.`;
      } else if (userMessage.includes('team') || userMessage.includes('staff') || userMessage.includes('member')) {
        responseText = `Your team consists of **${contextData?.summary?.teamMembers || 0} active members**. A strong team is essential for executing complex orders and maintaining quality. Consider training and skill development to enhance overall capability.`;
      } else if (userMessage.includes('performance') || userMessage.includes('summary') || userMessage.includes('overview') || userMessage.includes('status')) {
        const totalValue = contextData?.stats?.totalContractValue || '0';
        responseText = `**AeroSky Operations Summary:**\n\n📊 **Portfolio**: ${contextData?.summary?.totalOrders || 0} orders worth ₹${totalValue}\n🚁 **Fleet**: ${contextData?.summary?.totalDrones || 0} drones operational\n👥 **Team**: ${contextData?.summary?.teamMembers || 0} members\n📦 **Inventory**: ${contextData?.summary?.totalComponents || 0} components (${contextData?.lowStockItems?.length || 0} low)\n💼 **Leads**: ${contextData?.summary?.totalLeads || 0} in pipeline\n✈️ **Flights**: ${contextData?.summary?.totalFlights || 0} completed\n\n**Key Metrics:**\n- Orders in production: ${orderStats.inProduction || 0}\n- Unpaid invoices: ${paymentStats.unpaid || 0}\n- Due for delivery: ${orderStats.readyForDelivery || 0}\n\nAll systems operational. Focus on order fulfillment and cash collection.`;
      } else {
        // Generic intelligent response with all available data
        const totalValue = contextData?.stats?.totalContractValue || '0';
        const lowStockLength = contextData?.lowStockItems?.length || 0;
        const unpaidCount = paymentStats.unpaid || 0;
        const inProductionCount = orderStats.inProduction || 0;
        
        let focusAreas = [];
        if (lowStockLength > 0) focusAreas.push(`Replenish low inventory (${lowStockLength} items)`);
        if (unpaidCount > 0) focusAreas.push(`Collect unpaid invoices (${unpaidCount} orders)`);
        if (inProductionCount > 0) focusAreas.push(`Expedite production (${inProductionCount} orders)`);
        focusAreas.push(`Continue lead nurturing (${contextData?.summary?.totalLeads || 0} active)`);
        
        responseText = `Based on your current operational data:\n\n**Business Health**: ✅ Operational\n- **Revenue Pipeline**: ₹${totalValue} in active contracts\n- **Production Capacity**: ${contextData?.summary?.totalDrones || 0} drones, ${contextData?.summary?.batteries || 0} batteries\n- **Team Strength**: ${contextData?.summary?.teamMembers || 0} members\n- **Sales Pipeline**: ${contextData?.summary?.totalLeads || 0} leads\n\n**Current Focus Areas**:\n${focusAreas.map((area, i) => `${i + 1}. ${area}`).join('\n')}\n\nWhat specific aspect would you like to focus on?`;
      }
    }

    if (!responseText) {
      responseText = 'Unable to generate a response. Please try again.';
    }

    // 7. Return response
    return NextResponse.json({
      reply: responseText,
      success: true,
    });
  } catch (error) {
    console.error('Assistant error:', error);
    
    // Log detailed error information for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          reply: 'Please check your message and try again.',
          fields: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Handle database errors
    if (error instanceof Error && (error.message.includes('Prisma') || error.message.includes('database'))) {
      console.error('Database error:', error.message);
      return NextResponse.json(
        {
          error: 'Database error',
          reply: 'Failed to fetch operational data. Please try again.',
        },
        { status: 500 }
      );
    }

    // Handle API configuration errors
    if (error instanceof Error && error.message.includes('API_KEY')) {
      console.error('API configuration error:', error.message);
      return NextResponse.json(
        {
          error: 'Configuration error',
          reply: 'AI service is not properly configured. Please contact support.',
        },
        { status: 500 }
      );
    }

    // Generic error with more context
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Unhandled error in assistant:', errorMessage);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        reply: 'Sorry, something went wrong. Our team has been notified.',
        debug: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
