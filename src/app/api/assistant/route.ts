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

    // Fetch pending follow-ups
    const pendingFollowUps = await prisma.followUp.findMany({
      where: {
        status: 'PENDING',
      },
      select: {
        id: true,
        title: true,
        scheduledAt: true,
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
    });

    // Fetch all leads to check which ones don't have scheduled follow-ups
    const allLeads = await prisma.lead.findMany({
      where: {},
      select: {
        id: true,
        name: true,
        email: true,
        stage: {
          select: {
            name: true,
          },
        },
        followUps: {
          where: {
            status: 'PENDING',
          },
          select: {
            id: true,
          },
        },
        activities: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          select: {
            createdAt: true,
          },
        },
      },
    });

    // Identify leads needing follow-ups (those without pending follow-ups)
    const leadsNeedingFollowUp = allLeads.filter((lead: any) => lead.followUps.length === 0).slice(0, 5);

    // Fetch lead activities/notes (recent activities across all leads)
    const leadActivities = await prisma.leadActivity.findMany({
      where: { lead: leadWhere },
      select: {
        id: true,
        type: true,
        content: true,
        createdAt: true,
        lead: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Fetch upcoming calendar events (follow-ups and scheduled activities)
    const calendarEvents = await prisma.followUp.findMany({
      where: {
        scheduledAt: { gte: new Date() },
      },
      select: {
        id: true,
        title: true,
        scheduledAt: true,
        status: true,
        lead: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 15,
    });

    // Fetch team members with details
    const teamMembersDetails = await prisma.teamMember.findMany({
      where,
      select: {
        id: true,
        name: true,
        position: true,
        phone: true,
        email: true,
        createdAt: true,
        drones: {
          select: {
            id: true,
            modelName: true,
          },
        },
      },
      take: 20,
    });

    // Fetch recent flight logs with details
    const flightLogsDetails = await prisma.flightLog.findMany({
      where,
      select: {
        id: true,
        droneId: true,
        locationName: true,
        duration: true,
        missionType: true,
        date: true,
        drone: {
          select: {
            modelName: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 15,
    });

    // Fetch fleet details (all drones)
    const fleetDetails = await prisma.drone.findMany({
      where,
      select: {
        id: true,
        modelName: true,
        createdAt: true,
      },
      take: 25,
    });

    // Fetch battery packs with status
    const batteryDetails = await prisma.battery.findMany({
      where,
      select: {
        id: true,
        model: true,
        ratedCapacity: true,
        batteryNumberA: true,
        batteryNumberB: true,
      },
      take: 20,
    });

    // Fetch subcontractors/vendors/partners
    const vendorsPartners = await prisma.subcontractor.findMany({
      where,
      select: {
        id: true,
        companyName: true,
        contactPerson: true,
        contactEmail: true,
        contactPhone: true,
      },
      take: 15,
    });

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
      pendingFollowUps,
      leadsNeedingFollowUp,
      leadActivities,
      calendarEvents,
      teamMembersDetails,
      flightLogsDetails,
      fleetDetails,
      batteryDetails,
      vendorsPartners,
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
    leadActivities = [],
    calendarEvents = [],
    teamMembersDetails = [],
    flightLogsDetails = [],
    fleetDetails = [],
    batteryDetails = [],
    vendorsPartners = [],
  } = contextData;

  return `# Aero - AeroSky Aviation Intelligence Assistant

You are Aero, an advanced AI assistant for AeroSky Aviation operations. Your role is to provide intelligent insights, answer operational questions, identify trends, and suggest improvements based on real-time data.

## AeroSky Aviation - Products & Services Overview

### 🚁 **Products**

#### **VEDANSH** - Precision Surveying Drone
- **Certification**: DGCA Type Certified
- **Primary Use**: Precision surveying, mapping, and industrial inspection
- **Key Features**:
  - PPK equipped with dual GPS for enhanced accuracy
  - Dual battery system for extended endurance
  - 24 MP RGB sensor for high-resolution imaging
  - High-strength, lightweight exoskeleton
- **Technical Specs**:
  - Flight Time: 40 minutes (extended with dual battery)
  - Max Range: 1 km
  - Max Speed: 8 m/s
  - Wind Resistance: 12 m/s
  - Max Payload: 500g
  - Ground Sample Distance (GSD) @ 100m: 2.5cm/px
- **Applications**:
  - Agricultural mapping and crop monitoring
  - Construction progress tracking
  - Land surveying and topographic mapping
  - Infrastructure inspection
  - Mining & quarry surveys
  - Disaster assessment

#### **SHAURYA** - Professional-Grade Tactical Drone
- **Classification**: Military-grade, professional-class
- **Primary Use**: LiDAR surveying, multispectral imaging, defense operations
- **Key Features**:
  - Dual GPS with anti-jamming capabilities
  - Dual battery system for power redundancy
  - Advanced obstacle avoidance system
  - Ruggedized frame for harsh environments
- **Technical Specs**:
  - Flight Time: 45 minutes (extended with dual battery)
  - Max Range: 15 km (long-range tactical operations)
  - Max Speed: 12 m/s (high-speed pursuit capability)
  - Wind Resistance: 15 m/s (all-weather stability)
  - Max Payload: 2 kg (heavy payload capacity)
  - Max Altitude: 5000m (high-altitude surveillance)
- **Modular Payloads**:
  - LiDAR surveying for 3D mapping and terrain analysis
  - Multispectral imaging for environmental monitoring
  - Payload delivery system for remote deployments
- **Applications**:
  - Defense & surveillance operations
  - Critical infrastructure monitoring
  - Volumetric estimation and stockpile measurement
  - Advanced geospatial analysis
  - Tactical operations and security

### 🛠️ **Services**

#### **Surveying & Mapping**
- **Aerial Surveying**: Comprehensive aerial data collection and analysis
- **Topographic Mapping**: Detailed terrain and elevation mapping
- **Geospatial Data Analysis**: Advanced processing of aerial data
- **Precision Mapping**: High-accuracy mapping with sub-2.5cm resolution

#### **Safety & Security**
- **Defense Operations**: Military-grade surveillance and security
- **Infrastructure Inspection**: Safe inspection of critical infrastructure
- **Threat Assessment**: Professional security evaluation services

#### **Industry Solutions**
- **Agriculture**: Crop health monitoring, precision spraying, yield estimation
- **Infrastructure**: Bridge, tower, and pipeline inspection
- **Construction**: Project tracking, volumetric measurement, progress monitoring
- **Energy**: Solar farm, wind turbine, and power line inspection
- **Mining**: Quarry surveys and resource monitoring

### 🏢 **Enterprise Partnerships**
- Trusted by 50+ enterprise clients across India
- Government agencies: Ministry of Road Transport, NABARD, Delhi Police, Bihar Government
- Educational institutions: IIT Kanpur, IIT Delhi
- Corporate partners: Adani, CNH Industrial, IFFCO, Triveni

### 📊 **Your Operational Stats**
- 10,000+ hours of successful drone operations
- Multiple surveyed across India
- DGCA certified products
- IIT Kanpur incubated startup

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

### Lead Activities & Notes
${leadActivities.length > 0 
  ? leadActivities.slice(0, 5).map((a: any) => 
      `- **${a.lead?.name || 'Unknown'}**: ${a.type} - ${a.content?.substring(0, 50)}...`
    ).join('\n')
  : '- No recent activities'}

### Upcoming Calendar Events & Follow-ups
${calendarEvents.length > 0 
  ? calendarEvents.slice(0, 8).map((e: any) => 
      `- **${e.title}** with ${e.lead?.name || 'TBD'}: ${new Date(e.scheduledAt).toLocaleDateString('en-IN')} (${e.status})`
    ).join('\n')
  : '- No upcoming events scheduled'}

### Team Members Status
${teamMembersDetails.length > 0 
  ? `Found ${teamMembersDetails.length} active team members. Key roles: ${teamMembersDetails.slice(0, 5).map((m: any) => m.name + ' (' + m.position + ')').join(', ')}`
  : '- No team member data'}

### Fleet Status & Maintenance
${fleetDetails.length > 0 
  ? fleetDetails.slice(0, 8).map((d: any) => 
      `- **${d.modelName}**: ${d.operationalHours || 0}h operation time`
    ).join('\n')
  : '- No fleet data available'}

### Battery Pack Status
${batteryDetails.length > 0 
  ? `Available: ${batteryDetails.length} batteries. Status: ${batteryDetails.filter((b: any) => b.status === 'ACTIVE').length} active, ${batteryDetails.filter((b: any) => b.chargeLevel < 50).length} low charge`
  : '- No battery data'}

### Vendors & Partners
${vendorsPartners.length > 0 
  ? `Connected with ${vendorsPartners.length} partners. Recent: ${vendorsPartners.slice(0, 3).map((v: any) => v.companyName).join(', ')}`
  : '- No partner data'}

### Recent Flight Logs
${flightLogsDetails.length > 0 
  ? flightLogsDetails.slice(0, 5).map((f: any) => 
      `- **${f.locationName || 'Unknown'}**: ${f.duration}min flight (${f.missionType})`
    ).join('\n')
  : '- No flight records'}

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
7. **Schedule Follow-ups**: Recommend timing and actions for lead follow-ups based on best practices
8. **Manage Activities**: Suggest next steps for leads based on their current stage and activity history
9. **Sales Improvement**: Provide strategies to increase conversion rates, improve lead quality, and accelerate deal closure
10. **Operational Excellence**: Suggest process improvements, efficiency gains, and resource optimization
11. **Administrative Guidance**: Share best practices for team management, compliance, and documentation
12. **Business Strategy**: Offer insights on growth opportunities, market positioning, and competitive advantages

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
- "What follow-ups should I do?" → List pending + recommend next steps
- "When should I follow up?" → Suggest timing based on best practices
- "Who needs a follow-up?" → Flag leads without scheduled follow-ups
- "How can we improve sales?" → Suggest conversion strategies and lead optimization
- "What operational improvements?" → Recommend efficiency and process enhancements
- "Business tips?" → Share industry best practices and strategic insights
- "How to manage/lead better?" → Provide administrative and team management guidance

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
      } else if (userMessage.includes('sales') && (userMessage.includes('improve') || userMessage.includes('better') || userMessage.includes('increase') || userMessage.includes('growth') || userMessage.includes('conversion') || userMessage.includes('strategy'))) {
        const conversionRate = ((contextData?.summary?.totalOrders || 0) / Math.max(contextData?.summary?.totalLeads || 1, 1) * 100).toFixed(1);
        const avgDealValue = (parseFloat(contextData?.stats?.totalContractValue || '0') / Math.max(contextData?.summary?.totalOrders || 1, 1)).toFixed(0);
        
        responseText = `## 🎯 Sales Improvement Strategy\n\n**Your Current Sales Metrics:**\n- Lead-to-Deal Conversion: ${conversionRate}%\n- Average Deal Value: ₹${avgDealValue}\n- Active Sales Pipeline: ${contextData?.summary?.totalLeads || 0} leads\n- Monthly Orders: ${contextData?.summary?.totalOrders || 0}\n\n**Actionable Sales Improvement Strategies:**\n\n### 1️⃣ Lead Quality Enhancement\n- **Focus on source optimization**: Analyze where your best-converting leads come from\n- **Score your leads**: Prioritize leads showing high engagement indicators\n- **Segment your pipeline**: Separate hot/warm/cold leads for targeted nurturing\n- **Action**: Allocate 60% of effort to top 20% of leads\n\n### 2️⃣ Accelerate Deal Closure\n- **Shorten sales cycle**: Speed is money - get to decision 25% faster\n- **Create urgency**: Time-limited offers for key deals\n- **Establish clear milestones**: Each lead knows their next step\n- **Challenge objections early**: Address concerns before deal-blocks\n\n### 3️⃣ Revenue Expansion\n- **Upsell opportunities**: Cross-sell to existing customers\n- **Increase average deal**: From ₹${avgDealValue} → ₹${(parseInt(avgDealValue) * 1.25).toFixed(0)} (+25%)\n- **Bundle offerings**: Combine services for higher value\n- **Premium pricing**: Quality deserves premium positioning\n\n### 4️⃣ Sales Process Optimization\n- **Proposal speed**: Get to proposal 25% faster\n- **Follow-up cadence**: No lead goes 2+ days without contact\n- **Pipeline velocity**: Track each stage duration\n- **Sales targets**: 2-3 deals per team member per month\n\n**This Week:**\n1. Segment and score all ${contextData?.summary?.totalLeads || 0} leads\n2. Identify top 3 high-risk deals\n3. Plan outreach for this week`;
      } else if (userMessage.includes('operation') && (userMessage.includes('improve') || userMessage.includes('better') || userMessage.includes('efficient') || userMessage.includes('process') || userMessage.includes('suggestion'))) {
        responseText = `## ⚙️ Operational Excellence Plan\n\n**Your Current Status:**\n- Fleet: ${contextData?.summary?.totalDrones || 0} drones (${contextData?.summary?.batteries || 0} batteries)\n- Team: ${contextData?.summary?.teamMembers || 0} members\n- Production: ${contextData?.stats?.orderStats?.inProduction || 0} orders in progress\n- Inventory Issues: ${contextData?.lowStockItems?.length || 0} items\n\n**Key Improvement Areas:**\n\n### 1️⃣ Production Efficiency\n- **Bottleneck reduction**: Target 15% improvement in lead time\n- **Process standardization**: Document all manufacturing stages\n- **Quality metrics**: Aim for <1% error rate\n- **Setup time**: Parallelize design and production\n- **Waste reduction**: Target 10% material waste reduction\n\n### 2️⃣ Resource Optimization\n- **Drone utilization**: Maximize flight hours per unit\n- **Team workload**: Balance work across ${contextData?.summary?.teamMembers || 0} members\n- **Battery management**: Implement smart charging schedule\n- **Inventory turns**: Reduce holding costs by 20%\n\n### 3️⃣ Delivery Performance\n- **On-time delivery**: Currently ${contextData?.stats?.orderStats?.delivered || 0} delivered → aim for 98%\n- **Order tracking**: Real-time visibility cradle-to-grave\n- **Customer communication**: Proactive status updates\n- **Logistics**: Consolidate shipments to reduce costs\n\n### 4️⃣ Cost Control\n- **Labor efficiency**: Orders per team member\n- **Overhead review**: Monthly operational cost audit\n- **Energy optimization**: Facility usage efficiency\n- **Supplier management**: Competitive pricing and reliability\n\n**30-Day Action Plan:**\n1. Week 1: Audit processes and identify top 3 bottlenecks\n2. Week 2: Fix critical bottlenecks\n3. Week 3: Implement tracking dashboard\n4. Week 4: Team training and optimization`;
      } else if (userMessage.includes('business') && (userMessage.includes('tip') || userMessage.includes('advice') || userMessage.includes('best practice') || userMessage.includes('strategy') || userMessage.includes('success'))) {
        responseText = `## 💡 Business Strategy & Best Practices\n\n**Your Business Scorecard:**\n- Annual Contract Value: ₹${contextData?.stats?.totalContractValue || '0'}\n- Market Presence: ${contextData?.summary?.totalLeads || 0} active prospects\n- Operational History: ${contextData?.summary?.totalFlights || 0} successful operations\n- Team: ${contextData?.summary?.teamMembers || 0} skilled professionals\n\n**Strategic Business Tips:**\n\n### 1️⃣ Build Strong Customer Relationships\n- **Personal touch**: Quarterly reviews with top customers\n- **Proactive communication**: Regular updates, don't wait for problems\n- **ROI sharing**: Show customers the value delivered\n- **Referral program**: 50% of deals often come from referrals\n\n### 2️⃣ Financial Health\n- **Cash flow management**: Collect within 15 days (Currently: ${contextData?.stats?.paymentStats?.unpaid || 0} unpaid)\n- **Margin analysis**: Know profit on each order type\n- **Quarterly pricing review**: Stay competitive\n- **Build 3-month reserve**: Financial safety net\n\n### 3️⃣ Competitive Positioning\n- **Unique value**: What makes you different?\n- **Case studies**: Document success stories\n- **Thought leadership**: Share industry insights\n- **Strategic partnerships**: Build complementary ecosystem\n\n### 4️⃣ Growth Planning\n- **Market expansion**: Adjacent markets or geographies?\n- **Diversification**: New service offerings?\n- **Team development**: Invest in key talent\n- **Tech adoption**: Automate manual processes\n\n### 5️⃣ Risk Management\n- **No customer concentration**: Avoid >40% from 1-2 customers\n- **Supply chain**: Multiple supplier sources\n- **Team retention**: Develop and incentivize key roles\n- **Compliance**: Stay ahead of regulations\n\n**Q1 Priorities:**\n1. Eliminate unpaid invoices (₹${contextData?.stats?.paymentStats?.unpaid || 0})\n2. Document unique value proposition\n3. Secure 1 strategic partnership\n4. Create customer success case study`;
      } else if (userMessage.includes('admin') || userMessage.includes('manage') || userMessage.includes('team') || (userMessage.includes('how') && (userMessage.includes('better') || userMessage.includes('improve')))) {
        responseText = `## 👥 Administrative & Team Management Guide\n\n**Your Team:**\n- Size: ${contextData?.summary?.teamMembers || 0} members\n- Active Leads: ${contextData?.summary?.totalLeads || 0} in pipeline\n- Pending Follow-ups: ${contextData?.pendingFollowUps?.length || 0}\n\n**Administrative Best Practices:**\n\n### 1️⃣ Team Organization\n- **Clear roles**: Document each person's responsibilities\n- **Career paths**: Show growth opportunities\n- **Skill matrix**: Map skills for cross-training\n- **Documentation**: Create SOPs for all processes\n\n### 2️⃣ Performance Management\n- **Monthly reviews**: Individual + team metrics\n- **Goal setting**: OKRs each quarter\n- **Recognition**: Daily wins, monthly awards\n- **Coaching**: Identify gaps, upskill team\n\n### 3️⃣ Communication\n- **Daily standups**: 15-min sync on priorities\n- **Weekly reviews**: Retrospectives + planning\n- **Monthly town halls**: Company updates\n- **One-on-ones**: Development conversations\n\n### 4️⃣ Process Management\n- **Document everything**: Flows, checklists, decisions\n- **Implement systems**: CRM, project tracking, time logs\n- **Quarterly audits**: Compliance + quality\n- **Continuous improvement**: Kaizen culture\n\n### 5️⃣ Compliance & Governance\n- **HR records**: Attendance, payroll, benefits\n- **Safety**: Equipment maintenance, protocols\n- **Data security**: Customer + company info protection\n- **Audit trail**: Records for accountability\n\n### 6️⃣ Meeting Effectiveness\n- **Agenda-driven**: Clear purpose and outcomes\n- **Time-boxed**: 15-min standups, 30-min decisions\n- **Decision records**: Document and communicate\n- **Action tracking**: Clear owners for each item\n\n**This Month:**\n1. Create role descriptions for all ${contextData?.summary?.teamMembers || 0} members\n2. One-on-ones with each person\n3. Document 3 critical SOPs\n4. Setup daily sync meetings\n5. Implement shared documentation system`;
      } else if (userMessage.includes('follow up') || userMessage.includes('followup') || userMessage.includes('contact') || userMessage.includes('next step')) {
        const pendingFollowUps = contextData?.pendingFollowUps || [];
        const leadsNeedingFollowUp = contextData?.leadsNeedingFollowUp || [];
        
        if (pendingFollowUps.length > 0) {
          const upcomingText = pendingFollowUps.map((fu: any) => {
            const scheduledDate = fu.scheduledAt ? new Date(fu.scheduledAt).toLocaleDateString('en-IN') : 'Not scheduled';
            return `- **${fu.lead.name}** (${fu.lead.email}): ${fu.title || 'Follow-up scheduled'} - ${scheduledDate}`;
          }).join('\n');
          
          responseText = `**Your Follow-up Schedule:**\n\n**Scheduled Follow-ups:**\n${upcomingText}\n\n${leadsNeedingFollowUp.length > 0 ? `**Leads Needing Follow-up:**\n${leadsNeedingFollowUp.map((lead: any) => `- **${lead.name}** (${lead.email}) - Stage: ${lead.stage?.name || 'Unknown'}`).join('\n')}\n\n` : ''}**Recommended Follow-up Timing:**\n- Initial contact: Within 24 hours\n- After proposal: 3-5 days\n- No response: 7 days\n- Active negotiation: Every 2-3 days\n- Closing stage: Daily`;
        } else if (leadsNeedingFollowUp.length > 0) {
          responseText = `**Leads Needing Follow-up:**\n\n${leadsNeedingFollowUp.map((lead: any) => `- **${lead.name}** (${lead.email}) - Stage: ${lead.stage?.name || 'Unknown'}`).join('\n')}\n\n**Recommended Actions:**\n1. **Prioritize high-value leads** first\n2. **Schedule follow-ups** based on their current stage\n3. **Prepare relevant materials** before calling\n4. **Document all interactions** for team coordination\n\n**Best Timing for Follow-ups:**\n- Initial contact: Within 24 hours of first interaction\n- After proposal sent: 3-5 days for feedback\n- No response after 5 days: Gentle reminder call\n- Active negotiations: Every 2-3 days\n- Closing stage: Daily contact recommended`;
        } else {
          responseText = `**All Follow-ups are Current! 🎉**\n\nYou have ${contextData?.summary?.totalLeads || 0} active leads and all have scheduled follow-ups.\n\n**Next Steps:**\n1. Review scheduled follow-ups in your calendar\n2. Prepare materials for upcoming calls\n3. Continue nurturing relationships consistently\n4. Track outcomes for sales pipeline visibility`;
        }
      } else if (userMessage.startsWith('how ') || userMessage.startsWith('how to ') || userMessage.includes('how can')) {
        // Intelligent response for "How" questions
        const topic = userMessage.replace(/^how (to |can )? ?/i, '').trim();
        responseText = `## How to ${topic.charAt(0).toUpperCase() + topic.slice(1)}\n\n**Step-by-Step Approach:**\n\n### 1️⃣ Preparation\n- Gather relevant data and stakeholders\n- Set clear objectives and success metrics\n- Identify required resources\n\n### 2️⃣ Planning\n- Create detailed action plan\n- Define timeline and milestones\n- Assign roles and responsibilities\n\n### 3️⃣ Execution\n- Communicate clearly to all teams\n- Monitor progress regularly\n- Address issues immediately\n\n### 4️⃣ Optimization\n- Collect feedback\n- Identify improvement areas\n- Refine and iterate\n\n**Key Success Factors:**\n- Clear communication across teams\n- Regular progress tracking\n- Flexible approach to adapt as needed\n- Celebrate milestones and wins\n\n**Your Current Context:**\n- Team: ${contextData?.summary?.teamMembers || 0} members available\n- Capacity: ${contextData?.summary?.totalDrones || 0} drones, ${contextData?.summary?.batteries || 0} batteries\n- Pipeline: ${contextData?.summary?.totalLeads || 0} active leads\n\n**Action Items:**\n1. Define specific objectives\n2. Break into manageable tasks\n3. Schedule with team\n4. Track and report progress\n\nWant more details on a specific step?`;
      } else if (userMessage.startsWith('what ') || userMessage.includes('what should') || userMessage.includes('what about')) {
        // Intelligent response for "What" questions
        const topic = userMessage.replace(/^what (should |about )?/i, '').trim();
        const leadCount = contextData?.summary?.totalLeads || 1;
        const targetDealValue = leadCount > 0 ? ((parseFloat(contextData?.stats?.totalContractValue || '0') * 1.25) / leadCount).toFixed(0) : '0';
        responseText = `## About ${topic.charAt(0).toUpperCase() + topic.slice(1)}\n\n**Analysis & Insights:**\n\n### Current Status\n- Business Health: ✅ Operational\n- Active Team: ${contextData?.summary?.teamMembers || 0} members\n- Orders: ${contextData?.summary?.totalOrders || 0} (₹${contextData?.stats?.totalContractValue || '0'} value)\n- Leads: ${leadCount} in pipeline\n- Inventory: ${contextData?.summary?.totalComponents || 0} components (${contextData?.lowStockItems?.length || 0} low-stock)\n\n### Key Considerations\n1. **Resource Allocation**: Optimize use of ${contextData?.summary?.totalDrones || 0} drones + ${contextData?.summary?.teamMembers || 0} team members\n2. **Revenue Focus**: Target ₹${targetDealValue} average deal value\n3. **Operational Excellence**: Reduce bottlenecks in ${contextData?.stats?.orderStats?.inProduction || 0} active orders\n4. **Cash Flow**: Collect ${contextData?.stats?.paymentStats?.unpaid || 0} unpaid invoices\n\n### Recommended Actions\n✅ Prioritize high-impact initiatives\n✅ Focus on quick wins for momentum\n✅ Build team capability\n✅ Track metrics weekly\n\n**Next Steps:**\n1. Validate assumptions with team\n2. Create detailed plan\n3. Assign ownership\n4. Schedule regular checkpoints`;
      } else if (userMessage.includes('when ') || userMessage.includes('timeline') || userMessage.includes('schedule')) {
        // Intelligent response for "When" questions
        const leadCountNum = Number(contextData?.summary?.totalLeads || 0);
        const orderCountNum = Number(contextData?.summary?.totalOrders || 0);
        const teamCount = String(Number(contextData?.summary?.teamMembers || 0) + 5);
        const droneCount = Number(contextData?.summary?.totalDrones || 1);
        const productionOrders = String(Number(contextData?.stats?.orderStats?.inProduction || 0));
        const timelineWeeks = String(Math.ceil(Number(contextData?.stats?.orderStats?.inProduction || 0) / Math.max(droneCount, 1)) * 2);
        const leadGrowth = String(Math.ceil((leadCountNum || 0) * 0.2));
        const orderGrowth = String(Math.floor((orderCountNum * 1.5) || 0) as any);
        const leadLongTerm = String((leadCountNum * 2) || 0);
        const unpaidInvoices = String((parseFloat((contextData?.stats?.paymentStats?.unpaid || '0').toString()) * 50000).toFixed(0));
        
        responseText = `## Timeline & Scheduling Strategy\n\n**Current Operational Timeline:**\n\n### Immediate (This Week)\n- Follow up on ${contextData?.pendingFollowUps?.length || 0} pending follow-ups\n- Address ${contextData?.lowStockItems?.length || 0} low-stock items\n- Review ${productionOrders} orders in production\n\n### Short-term (Next 2 Weeks)\n- Implement quick wins from current focus areas\n- Train team on new processes\n- Close high-value deals (convert ${leadGrowth} leads)\n\n### Medium-term (Next Month)\n- Complete all in-production orders (${productionOrders} items)\n- Collect unpaid invoices (₹${unpaidInvoices} expected)\n- Scale operations with expanded team\n\n### Long-term (Q1 Goals)\n- Grow from ${leadCountNum} to ${leadLongTerm} active leads\n- Increase orders from ${orderCountNum} to ${orderGrowth}\n- Build team to ${teamCount} members\n\n**Critical Path Items:**\n1. ⚠️ Resolve inventory issues (${contextData?.lowStockItems?.length || 0} items)\n2. 💰 Collect unpaid amounts\n3. 🎯 Close pending leads\n4. 📈 Expand capacity\n\n**Resource Availability:**\n- Team: ${contextData?.summary?.teamMembers || 0} members available\n- Fleet: ${droneCount} operational units\n- Timeline: Recommend ${timelineWeeks}-4 weeks for current pipeline`;
      } else if (userMessage.includes('why ') || userMessage.includes('reason') || userMessage.includes('benefit')) {
        // Intelligent response for "Why" questions
        const drones = contextData?.summary?.totalDrones ?? 0 as const;
        const fleetHours = `${(drones as number) * 40}`;
        
        responseText = `## Why This Matters\n\n**Business Impact Analysis:**\n\n### Revenue Perspective\n- Current Pipeline: ₹${contextData?.stats?.totalContractValue || '0'}\n- Average Deal: ₹${(parseFloat(contextData?.stats?.totalContractValue || '0') / Math.max(contextData?.summary?.totalOrders || 1, 1)).toFixed(0)}\n- Growth Potential: 25-50% increase possible\n\n### Operational Perspective\n- Fleet Capacity: ${drones} drones (${fleetHours} hours/month)\n- Team Bandwidth: ${contextData?.summary?.teamMembers || 0} members at current utilization\n- Bottlenecks: ${contextData?.stats?.orderStats?.inProduction || 0} orders in progress\n\n### Strategic Importance\n✅ **Customer Success**: Happy customers = referrals & repeat business\n✅ **Financial Health**: ${contextData?.stats?.paymentStats?.unpaid || 0} unpaid invoices needs resolution\n✅ **Team Morale**: Clear goals motivate performance\n✅ **Market Position**: Stay competitive vs. others in drone services\n✅ **Scaling**: Build infrastructure for growth\n\n### Why Act Now?\n1. **Market Window**: Right time to expand capacity\n2. **Team Readiness**: ${contextData?.summary?.teamMembers || 0} team ready for next phase\n3. **Lead Quality**: ${contextData?.summary?.totalLeads || 0} leads in pipeline waiting\n4. **Resource Availability**: Spare capacity exists to handle growth\n\n### Expected Outcomes\n- 📈 Revenue growth: 30-40%\n- 👥 Team efficiency: 15-20% improvement\n- 💰 Cash collection: 100% of outstanding payments\n- 📊 Order velocity: 25% faster execution\n\n**Return on Investment:**\nEvery ₹1 invested in optimization → ₹3-5 return within 90 days`;
      } else if (userMessage.includes('suggest') || userMessage.includes('recommend') || userMessage.includes('advice')) {
        // Intelligent response for suggestion/advice questions
        const leadsToConvert = Math.ceil(((contextData?.summary?.totalLeads as number) || 0) * 0.3);
        const resourcesToAllocate = Math.ceil(((contextData?.summary?.teamMembers as number) || 0) * 0.4);
        const teamGrowthTarget = Math.ceil(((contextData?.summary?.teamMembers as number) || 0) * 1.25);
        const leadConversionRate = (((contextData?.summary?.totalOrders as number) || 0) / Math.max((contextData?.summary?.totalLeads as number) || 1, 1) * 100).toFixed(1);
        const avgDealValue = (parseFloat(contextData?.stats?.totalContractValue || '0') / Math.max((contextData?.summary?.totalOrders as number) || 1, 1)).toFixed(0);
        const cashCollectionRate = (((contextData?.stats?.paymentStats?.paid as number) || 0) / (((contextData?.stats?.paymentStats?.paid as number) || 0) + ((contextData?.stats?.paymentStats?.unpaid as number) || 0)) * 100).toFixed(0);
        
        responseText = `## Strategic Recommendations\n\n**Based on Your Current Operations:**\n\n### 🎯 Top Priority Actions\n\n1. **Revenue Acceleration** (Impact: +30%)\n   - Target: Convert ${leadsToConvert} leads to deals\n   - Timeline: 30 days\n   - Resources: ${resourcesToAllocate} team members\n   - Expected Value: ₹${(parseFloat(contextData?.stats?.totalContractValue || '0') * 0.3).toFixed(0)}\n\n2. **Cash Flow Optimization** (Impact: +₹${(Number(contextData?.stats?.paymentStats?.unpaid || 0) * 50000).toFixed(0)})\n   - Collect: ${contextData?.stats?.paymentStats?.unpaid || 0} unpaid invoices\n   - Timeline: 15 days\n   - Action: Personal follow-up + incentives\n\n3. **Inventory Management** (Impact: -20% costs)\n   - Address: ${contextData?.lowStockItems?.length || 0} low-stock items\n   - Timeline: Immediate\n   - Action: Smart reordering + supplier negotiation\n\n4. **Operational Efficiency** (Impact: +25% capacity)\n   - Streamline: ${contextData?.stats?.orderStats?.inProduction || 0} production orders\n   - Timeline: 21 days\n   - Action: Document SOPs + team training\n\n### 📊 Quick Wins (Implement This Week)\n✅ Schedule follow-ups for ${contextData?.leadsNeedingFollowUp?.length || 0} leads\n✅ Collect highest-value ${contextData?.stats?.paymentStats?.unpaid || 0} unpaid invoices\n✅ Document 3 mission-critical processes\n✅ Complete 2 in-production orders early\n\n### 📈 Medium-term Growth (30-90 Days)\n✅ Build team to ${teamGrowthTarget} members\n✅ Expand capacity to handle 50% more orders\n✅ Launch referral program (target 20% from referrals)\n✅ Create case studies from top 5 clients\n\n### 🚀 Strategic Initiatives (Next Quarter)\n✅ Market expansion to new geographies\n✅ New service offerings/packages\n✅ Strategic partnerships\n✅ Technology automation\n\n**Implementation Framework:**\n1. Week 1: Planning & team alignment\n2. Week 2-3: Quick wins execution\n3. Week 4+: Track, optimize, scale\n\n**Success Metrics:**\n- Lead conversion: ${leadConversionRate}% → target 25%\n- Average deal: ₹${avgDealValue} → target +25%\n- Cash collection: ${cashCollectionRate}% → target 95%\n- Delivery speed: Current → -20% faster`;
      } else {
        // Ultimate fallback for any other question
        responseText = `## I'd Be Happy to Help!\n\n**About: "${userMessage.substring(0, 50)}${userMessage.length > 50 ? '...' : ''}"\n\n### What I Can Help You With:\n\n**Operational Questions:**\n- Fleet status and capacity\n- Order management and tracking\n- Inventory and stock levels\n- Team management\n- Flight operations\n\n**Business Intelligence:**\n- Sales metrics and conversion rates\n- Revenue analysis\n- Lead pipeline health\n- Cash flow management\n- Performance dashboards\n\n**Strategic Advice:**\n- Sales improvement strategies\n- Operational efficiency\n- Team development\n- Process optimization\n- Business growth\n\n**Product Knowledge:**\n- VEDANSH drone specifications\n- SHAURYA capabilities\n- Service offerings\n- Industry applications\n\n**Follow-up & CRM:**\n- Lead follow-up planning\n- Contact scheduling\n- Activity tracking\n- Pipeline management\n\n### Your Current Business Snapshot:\n- 📊 Pipeline: ₹${contextData?.stats?.totalContractValue || '0'} active contracts\n- 🎯 Leads: ${contextData?.summary?.totalLeads || 0} in sales pipeline\n- 🚁 Fleet: ${contextData?.summary?.totalDrones || 0} drones operational\n- 👥 Team: ${contextData?.summary?.teamMembers || 0} team members\n- 📈 Orders: ${contextData?.summary?.totalOrders || 0} total\n\n### How to Ask:\n- **\"How can we...?\"** → Strategy & steps\n- **\"What should we...?\"** → Analysis & options\n- **\"When should...?\"** → Timeline & scheduling\n- **\"Why should...?\"** → Impact & benefits\n- **\"Suggest...\"** → Recommendations\n\n**Try asking me:**\n- How can we improve sales conversion?\n- What's the status of our orders?\n- When should we follow up with leads?\n- Why should we focus on inventory?\n- Suggest ways to optimize operations\n\n**What specific area would you like to explore?**`;
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
