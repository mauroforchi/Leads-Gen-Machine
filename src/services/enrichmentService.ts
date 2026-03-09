import { Lead } from "../types";

/**
 * Enriches a lead using the Apollo.io API (or simulated if no key is provided).
 * Suggestion 1: Data enrichment for high precision.
 */
export async function enrichLead(lead: Lead): Promise<Partial<Lead>> {
  const apiKey = process.env.APOLLO_API_KEY;
  
  if (!apiKey) {
    // If no API key, we simulate a successful enrichment for demo purposes
    console.warn("APOLLO_API_KEY missing. Simulating enrichment.");
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          isEnriched: true,
          phone: `+34 6${Math.floor(Math.random() * 90000000 + 10000000)}`,
          email: lead.email,
        });
      }, 1500);
    });
  }

  try {
    const response = await fetch("https://api.apollo.io/v1/people/match", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": apiKey
      },
      body: JSON.stringify({
        first_name: lead.contactName.split(' ')[0],
        last_name: lead.contactName.split(' ').slice(1).join(' '),
        organization_name: lead.companyName,
        email: lead.email,
        linkedin_url: lead.linkedinUrl
      })
    });

    if (!response.ok) {
      throw new Error(`Apollo API error: ${response.statusText}`);
    }

    const data = await response.json();
    const person = data.person || {};
    
    return {
      isEnriched: true,
      phone: person.phone_number || person.mobile_number || undefined,
      email: person.email || lead.email,
      linkedinUrl: person.linkedin_url || lead.linkedinUrl,
    };
  } catch (error) {
    console.error("Enrichment failed:", error);
    return { isEnriched: false };
  }
}
