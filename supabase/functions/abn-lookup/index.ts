import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { abn } = await req.json();

    if (!abn) {
      return new Response(
        JSON.stringify({ error: 'ABN is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanAbn = abn.replace(/\s/g, '');
    if (!/^\d{11}$/.test(cleanAbn)) {
      return new Response(
        JSON.stringify({ error: 'Invalid ABN format. Must be 11 digits.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const abnLookupGuid = Deno.env.get('ABN_LOOKUP_GUID');
    if (!abnLookupGuid) {
      return new Response(
        JSON.stringify({ error: 'ABN Lookup service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const abnLookupUrl = `https://abr.business.gov.au/abrxmlsearch/AbrXmlSearch.asmx/SearchByABNv202001?searchString=${cleanAbn}&includeHistoricalDetails=N&authenticationGuid=${abnLookupGuid}`;
    const response = await fetch(abnLookupUrl);
    const xmlText = await response.text();

    const gstRegistered = xmlText.includes('<goodsAndServicesTax>') && !xmlText.includes('<goodsAndServicesTax />');

    // Extract entity name from multiple possible locations
    let entityName = null;
    const mainNameMatch = xmlText.match(/<mainName>[\s\S]*?<organisationName>(.*?)<\/organisationName>/i);
    if (mainNameMatch) entityName = mainNameMatch[1];

    if (!entityName) {
      const legalNameMatch = xmlText.match(/<legalName>[\s\S]*?<fullName>(.*?)<\/fullName>/i);
      if (legalNameMatch) entityName = legalNameMatch[1];
    }

    if (!entityName) {
      const givenNameMatch = xmlText.match(/<legalName>[\s\S]*?<givenName>(.*?)<\/givenName>/i);
      const familyNameMatch = xmlText.match(/<legalName>[\s\S]*?<familyName>(.*?)<\/familyName>/i);
      if (givenNameMatch || familyNameMatch) {
        const parts = [givenNameMatch?.[1], familyNameMatch?.[1]].filter(Boolean);
        if (parts.length > 0) entityName = parts.join(' ');
      }
    }

    if (!entityName) {
      const tradingNameMatch = xmlText.match(/<mainTradingName>[\s\S]*?<organisationName>(.*?)<\/organisationName>/i);
      if (tradingNameMatch) entityName = tradingNameMatch[1];
    }

    if (!entityName) {
      const businessNameMatch = xmlText.match(/<businessName>[\s\S]*?<organisationName>(.*?)<\/organisationName>/i);
      if (businessNameMatch) entityName = businessNameMatch[1];
    }

    const abnStatusMatch = xmlText.match(/<entityStatusCode>(.*?)<\/entityStatusCode>/i);
    const isActive = abnStatusMatch?.[1] === 'Active';

    const stateCodeMatch = xmlText.match(/<mainBusinessPhysicalAddress>[\s\S]*?<stateCode>(.*?)<\/stateCode>/i);
    const postcodeMatch = xmlText.match(/<mainBusinessPhysicalAddress>[\s\S]*?<postcode>(.*?)<\/postcode>/i);
    const addressParts = [stateCodeMatch?.[1], postcodeMatch?.[1]].filter(Boolean);
    const address = addressParts.length > 0 ? addressParts.join(' ') : null;

    const entityTypeMatch = xmlText.match(/<entityType>[\s\S]*?<entityDescription>(.*?)<\/entityDescription>/i);
    const entityType = entityTypeMatch?.[1] || null;

    const gstEffectiveDateMatch = xmlText.match(/<goodsAndServicesTax>[\s\S]*?<effectiveFrom>(.*?)<\/effectiveFrom>/i);
    const gstEffectiveDate = gstEffectiveDateMatch?.[1] || null;

    return new Response(
      JSON.stringify({
        abn: cleanAbn,
        isActive,
        entityName,
        entityType,
        gstRegistered,
        gstEffectiveDate,
        address,
        stateCode: stateCodeMatch?.[1] || null,
        postcode: postcodeMatch?.[1] || null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('ABN Lookup error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to lookup ABN' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
