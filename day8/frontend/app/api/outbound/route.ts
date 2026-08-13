import { NextResponse } from 'next/server';
import { AccessToken, RoomServiceClient, AgentDispatchClient } from 'livekit-server-sdk';
import { RoomConfiguration } from '@livekit/protocol';

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;
const AGENT_NAME = process.env.AGENT_NAME || 'krishivani-agent';

export const revalidate = 0;

export async function POST(req: Request) {
  try {
    if (!LIVEKIT_URL || !API_KEY || !API_SECRET) {
      return NextResponse.json(
        { error: 'LiveKit environment variables are missing.' },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const farmerName = body.farmer_name || 'रामेश्वर जी';
    const district = body.district || 'करनाल (Karnal)';
    const alertType = body.alert_type || 'heavy_rain_warning';
    const crop = body.crop || 'धान (Paddy)';
    const voice = body.voice || 'Anisha';
    const simulateOutcome = body.simulate_outcome || 'answered';
    const phoneOrSip = body.phone || '+919876543210';

    const alertDescriptions: Record<string, string> = {
      heavy_rain_warning: 'आज रात करनाल जिले में भारी बारिश और 50km/h की आंधी की गंभीर चेतावनी जारी की गई है।',
      mandi_price_surge: `करनाल मंडी में आज ${crop} का भाव ₹2,400 से बढ़कर ₹2,680 प्रति क्विंटल हो गया है।`,
      pest_advisory: `${crop} की फसल में तना छेदक कीट (Stem Borer) का प्रकोप देखा गया है, तुरंत नीम तेल का छिड़काव करें।`,
      routine_practice: 'आपकी साप्ताहिक फसल समीक्षा का समय हो गया है।',
    };

    const details = alertDescriptions[alertType] || alertDescriptions.heavy_rain_warning;

    // Mandatory Step 4 Opening Statement
    const openingStatement =
      `नमस्ते ${farmerName} जी, मैं कृषिवाणी से एआई किसान मित्र बोल रहा हूँ। ` +
      `आपके ज़िले ${district} के लिए ${details} ` +
      `यदि आप आगे से ऐसे आपातकालीन फोन अलर्ट प्राप्त नहीं करना चाहते हैं, तो आप बस 'कॉल बंद करो' या 'अनसब्सक्राइब' कह सकते हैं।`;

    const metadataObj = {
      outbound_call: true,
      farmer_name: farmerName,
      district,
      crop,
      alert_type: alertType,
      alert_details: details,
      opening_statement: openingStatement,
      voice,
      simulate_outcome: simulateOutcome,
      phone_or_sip: phoneOrSip,
      timestamp: new Date().toISOString(),
    };

    const metadataStr = JSON.stringify(metadataObj);
    const roomName = `outbound_${alertType}_${Math.floor(Math.random() * 100000)}`;

    // Create Agent Dispatch via LiveKit AgentDispatchClient if available
    let dispatchId = '';
    try {
      const httpUrl = LIVEKIT_URL.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:');
      const dispatchClient = new AgentDispatchClient(httpUrl, API_KEY, API_SECRET);
      const dispatch = await dispatchClient.createDispatch(roomName, AGENT_NAME, {
        metadata: metadataStr,
      });
      dispatchId = dispatch.id;
    } catch (dispatchErr) {
      console.warn('Direct AgentDispatch creation note:', dispatchErr);
    }

    // Generate participant token for Web simulator / Callee preview
    const at = new AccessToken(API_KEY, API_SECRET, {
      identity: `callee_${farmerName.replace(/\s+/g, '_')}_${Math.floor(Math.random() * 1000)}`,
      name: `${farmerName} (Outbound Call)`,
      ttl: '15m',
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    });

    const roomConfig = RoomConfiguration.fromJson({
      agents: [{ agentName: AGENT_NAME }],
    });
    at.roomConfig = roomConfig;

    const participantToken = await at.toJwt();

    return NextResponse.json({
      status: 'success',
      serverUrl: LIVEKIT_URL,
      roomName,
      dispatchId,
      farmerName,
      phoneOrSip,
      alertType,
      voice,
      openingStatement,
      simulateOutcome,
      participantToken,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Outbound API Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
