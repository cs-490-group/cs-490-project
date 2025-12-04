import json
import os
from openai import AsyncOpenAI
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()
openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


async def call_cohere_api(prompt: str) -> str:
    """Call OpenAI API (formerly Cohere) - same interface, better results"""
    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert salary negotiation coach with deep knowledge of compensation packages, market rates, and negotiation strategies."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        text = response.choices[0].message.content

        if not text:
            raise Exception("OpenAI returned no text")

        return text
    except Exception as e:
        raise Exception(f"OpenAI API error: {str(e)}")


async def research_market_salary(
    role: str,
    location: str,
    years_of_experience: int,
    company: Optional[str] = None,
    company_size: Optional[str] = None
) -> Dict[str, Any]:
    """Research market salary data for a specific role and location using Cohere AI"""
    try:
        prompt = f"""Research market salary data for the following role and provide ONLY valid JSON output:
Role: {role}
Location: {location}
Years of Experience: {years_of_experience}
Company: {company or 'Not specified'}
Company Size: {company_size or 'Not specified'}

Return a JSON object with EXACTLY the following structure:
{{
  "median_salary": <number>,
  "percentile_25": <number>,
  "percentile_75": <number>,
  "percentile_90": <number>,
  "industry_average": <number>,
  "salary_trend": "<string>",
  "comparable_companies": ["<company1>", "<company2>"],
  "company_size_factor": "<string>"
}}

Rules:
- ALL FIELDS MUST BE FILLED. Never leave empty values.
- Use accurate, factual salary data when available.
- If something is not public, write a reasonable estimate, not empty.
- comparable_companies must be real companies.
- NO extra fields.
- NO markdown.
- ONLY return clean JSON."""

        response_text = await call_cohere_api(prompt)

        clean = response_text.replace("```json", "").replace("```", "").strip()

        if "{" in clean:
            clean = clean[clean.find("{"):]
        if "}" in clean:
            clean = clean[:clean.rfind("}") + 1]

        salary_data = json.loads(clean)
        return salary_data

    except Exception as e:
        print(f"Error researching market salary: {str(e)}")
        return {
            "median_salary": 100000,
            "percentile_25": 90000,
            "percentile_75": 120000,
            "percentile_90": 140000,
            "industry_average": 105000,
            "salary_trend": "Stable",
            "comparable_companies": [],
            "company_size_factor": "Standard"
        }


async def generate_negotiation_talking_points(
    role: str = "",
    company: str = "",
    location: str = "",
    years_of_experience: int = 0,
    achievements: Optional[list] = None,
    market_salary: Optional[Dict[str, Any]] = None,
    offered_salary: Optional[int] = None
) -> list:
    """Generate negotiation talking points based on candidate's achievements and market data"""
    try:
        # Prepare achievements text
        achievements_text = ""
        if achievements and len(achievements) > 0:
            achievements_text = "\n\nCandidate's Key Achievements:\n" + "\n".join([f"- {a}" for a in achievements[:5]])

        # Prepare market data context with defaults
        median = 100000
        percentile_25 = 85000
        percentile_75 = 125000
        percentile_90 = 150000
        market_context = ""

        if market_salary:
            median = market_salary.get("median_salary", 100000)
            percentile_25 = market_salary.get("percentile_25", 85000)
            percentile_75 = market_salary.get("percentile_75", 125000)
            percentile_90 = market_salary.get("percentile_90", 150000)
            market_context = f"\n\nMarket Data for {role} in {location}:\n- 25th percentile: ${percentile_25:,}\n- Median (50th): ${median:,}\n- 75th percentile: ${percentile_75:,}\n- 90th percentile: ${percentile_90:,}"

        # Determine salary strategy based on offer position
        if offered_salary and percentile_90 and offered_salary >= percentile_90:
            salary_focus = "SALARY IS COMPETITIVE/ABOVE 90TH PERCENTILE - DO NOT FOCUS TALKING POINTS ON SALARY. Instead, focus on: total compensation value, equity/benefits, long-term growth, why you're worth keeping happy, retention aspects."
        elif offered_salary and percentile_75 and offered_salary >= percentile_75:
            salary_focus = f"SALARY IS GOOD (75TH PERCENTILE) - Minimize salary focus. Instead emphasize: why this role at {company} is perfect for growth, other valuable components (equity, flexibility, learning), long-term value."
        elif offered_salary and median and offered_salary >= median:
            salary_focus = f"SALARY IS AT MARKET - You could negotiate salary OR other components. Focus talking points on: market data supporting higher salary, equity/benefits if salary is fixed, your unique value to {company}."
        else:
            salary_focus = f"SALARY IS BELOW MARKET - Make salary primary focus. Use market data heavily: median is ${median:,}, you're below that. Negotiate salary first, then other components."

        # Build examples based on salary position
        if offered_salary and percentile_90 and offered_salary >= percentile_90:
            # Salary is excellent - focus on OTHER value drivers
            example_points = f"""[
"Your compensation for the {role} role is already at the 90th percentile (${percentile_90:,}). What makes this role even more attractive is the opportunity to lead {company}'s [specific business initiative]. I want to ensure the equity package reflects the impact I'll have on [specific company goal].",
"I'm impressed {company} positions this {role} role competitively at ${offered_salary:,}. Given the work I'll do on [specific achievement area], I'm looking to discuss equity grants that align with top performers in {company}'s [relevant department]. Industry standard for this seniority at {company}'s scale is [equity range].",
"{company}'s base offer is competitive. What I want to focus on is career progression - I've successfully [specific achievement], and I want to ensure my growth path at {company} includes leadership opportunities in [specific area]. What does the 2-3 year progression look like for {role}?",
"The salary offer reflects market rates well. My interest is in long-term value with {company}. I'd like to discuss: signing bonus to offset current equity, PTO flexibility for the travel this {role} requires, and professional development budget - these matter more for retention than salary adjustments.",
"I'm satisfied with the base compensation at {offered_salary:,}. However, I've seen {company} offers for similar roles include remote flexibility and performance bonus structures. For a {role} delivering [your achievement type], are these components flexible in the negotiation?"
]"""
        elif offered_salary and percentile_75 and offered_salary >= percentile_75:
            # Salary is good - don't focus heavily on it, emphasize other components
            example_points = f"""[
"Your offer of ${offered_salary:,} puts the {role} role at the 75th percentile, which is solid. What I want to focus on is the total compensation picture. {company}'s equity package - I've heard it varies by level. For someone with my background in [achievement], what does the stock option package typically look like?",
"The base salary at ${offered_salary:,} is competitive in {location} for a {role}. I'm more interested in discussing the components that create real long-term value with {company}. Signing bonus, equity vesting schedules, and performance bonus structures - how flexible is {company} on these?",
"I'm excited about the {company} offer. The ${offered_salary:,} salary is at market rate. What I want to understand better is the equity and bonus components - these will be critical as I plan my [specific achievement area] work for {company}. Can we dive into those details?",
"For this {role} position in {location}, ${offered_salary:,} is appropriate. My focus now is maximizing total compensation through: signing bonus to support [personal need], PTO alignment with [industry standard], and clear bonus structure based on [specific role metrics].",
"Your offer reflects market research well. Rather than negotiate salary further, I'd like to explore what flexibility {company} has on: equity grants for top performers, professional development budget for [specific skill], and remote work policy for this {role}. These matter to my long-term success."
]"""
        else:
            # Salary is at or below market - keep focus on salary and market data
            example_points = f"""[
"Market research from Levels.fyi shows {company} compensation for {role} typically ranges ${percentile_75:,}-${percentile_90:,} in {location}. My background in [specific skill] and [achievement] positions me at the higher end of this range.",
"I've led [specific achievement] at previous role, which is exactly what {company} needs for [specific business goal]. The 75th percentile for {role} professionals at my experience level is ${percentile_75:,}, and I believe that's appropriate for what I bring.",
"{company} competes for talent by paying competitively. Industry data shows median {role} salary is ${median:,}, with top performers earning ${percentile_90:,}. My [achievement] warrants compensation closer to the 75th percentile.",
"Based on Glassdoor and payscale data, {role} professionals in {location} with my experience earn ${percentile_75:,}-${percentile_90:,}. For {company} to attract top talent, this range is standard for the value I provide.",
"I've demonstrated [concrete achievement] which directly impacts {company}'s [business goal]. Market compensation for this expertise is ${percentile_75:,}+ in {location}. I'd like to explore how {company} can meet this range."
]"""

        prompt = f"""You are an expert salary negotiation coach. Create 5 HIGHLY SPECIFIC talking points for negotiating a {role} offer at {company} in {location}.

OFFER POSITION: {salary_focus}

CANDIDATE PROFILE:
- Experience Level: {years_of_experience} years
{achievements_text}

{market_context}

YOUR TASK: Create 5 talking points that a candidate would ACTUALLY SAY in a real negotiation call. Each point MUST:

1. Explicitly mention {company} and show you understand their needs
2. Include a specific achievement or skill from the candidate's background
3. Reference relevant context (market data if salary is the focus, OR career/benefits if salary is already competitive)
4. Show CONCRETE VALUE - why {company} specifically needs to offer what you're asking for
5. Be a complete, natural sentence/statement - something a real person would say in negotiation
6. CRITICAL: ADJUST YOUR FOCUS based on salary position above

CRITICAL - DO NOT INCLUDE:
- Generic phrases like "Research market rates" or "My experience brings value"
- Vague statements or clichés
- Salary negotiation points if salary is already at/above market - focus on equity/benefits/career growth instead
- Asking for salary increase if salary is already 90th+ percentile (that's foolish and wastes credibility)

CONTEXT-SPECIFIC EXAMPLES (follow this approach):
{example_points}

Return a JSON array of exactly 5 talking points - NOT generic phrases, but complete statements:

RULES:
- Each point must be 2-3 complete sentences
- Must mention {company} OR specific data relevant to your focus
- Must reference an actual achievement or skill
- Use $ amounts only if salary is your focus area
- No generic phrases allowed
- **CRITICAL**: {salary_focus}
- Return ONLY the JSON array, no markdown, no explanation"""

        response_text = await call_cohere_api(prompt)

        clean = response_text.replace("```json", "").replace("```", "").strip()

        if "[" in clean:
            clean = clean[clean.find("["):]
        if "]" in clean:
            clean = clean[:clean.rfind("]") + 1]

        data = json.loads(clean)
        return data if isinstance(data, list) else ["Point not available"]

    except Exception as e:
        print(f"Error generating talking points: {str(e)}")
        # Fallback with actual data about market and company
        return [
            f"The market data for {role} positions in {location} shows a median of ${median:,}, with the 75th percentile at ${percentile_75:,}. This supports a competitive offer for {company}.",
            f"Based on industry research, experienced {role} professionals in {location} earn between ${percentile_75:,} and ${percentile_90:,}. I'm confident in requesting compensation within this range.",
            f"{company} requires strong expertise in this role, and my background directly aligns with their needs. The market supports ${percentile_75:,}+ for this level of experience.",
            f"Considering total market compensation for {role} roles - the 90th percentile reaches ${percentile_90:,}. With my qualifications, I'm positioned for above-median compensation.",
            f"For {company} to secure top talent in the {role} role, compensation of ${percentile_75:,}-${percentile_90:,} is standard in {location}'s market."
        ]


async def generate_total_compensation_framework(
    job_title: str,
    company: str,
    market_salary: Dict[str, Any]
) -> Dict[str, Any]:
    """Generate total compensation framework"""
    try:
        prompt = f"""For a {job_title} position at {company}, create a comprehensive total compensation framework.
Consider the following components and provide realistic estimates for the industry:

Return as JSON with this exact structure:
{{
  "base_salary": {{"description": "<description>", "percentage": 60}},
  "bonus": {{"description": "<description>", "percentage": 15}},
  "benefits": {{"description": "<description>", "percentage": 15}},
  "equity": {{"description": "<description>", "percentage": 10}},
  "total_compensation_note": "<explanation of how these add up>"
}}

Rules:
- All percentages must total 100
- Make percentages realistic for this industry
- NO markdown or extra text.
- ONLY return clean JSON."""

        response_text = await call_cohere_api(prompt)
        clean = response_text.replace("```json", "").replace("```", "").strip()

        if "{" in clean:
            clean = clean[clean.find("{"):]
        if "}" in clean:
            clean = clean[:clean.rfind("}") + 1]

        return json.loads(clean)
    except Exception as e:
        print(f"Error generating compensation framework: {str(e)}")
        return {
            "base_salary": {"description": "Core salary component", "percentage": 60},
            "bonus": {"description": "Annual performance bonus (typically 10-20% of salary)", "percentage": 15},
            "benefits": {"description": "Health insurance, 401k, PTO, etc.", "percentage": 15},
            "equity": {"description": "Stock options or equity grants", "percentage": 10},
            "total_compensation_note": "Total compensation accounts for salary, bonus, benefits, and equity"
        }


async def generate_negotiation_scripts(
    job_title: str,
    company: str,
    location: str = "",
    market_salary: Optional[Dict[str, Any]] = None,
    offered_salary: Optional[int] = None
) -> Dict[str, str]:
    """Generate detailed, company-personalized negotiation scripts for different scenarios"""
    try:
        # Add market context if available with all percentiles
        median = 100000
        p25 = 85000
        p75 = 125000
        p90 = 150000
        offer_position = "at"

        market_context = ""
        if market_salary and offered_salary:
            median = market_salary.get("median_salary", 100000)
            p25 = market_salary.get("percentile_25", 85000)
            p75 = market_salary.get("percentile_75", 125000)
            p90 = market_salary.get("percentile_90", 150000)

            if offered_salary >= p90:
                offer_position = "ABOVE (90th percentile)"
            elif offered_salary >= p75:
                offer_position = "ABOVE (75th percentile)"
            elif offered_salary >= median:
                offer_position = "AT (median)"
            else:
                offer_position = "BELOW (median)"

            market_context = f"""
MARKET DATA FOR NEGOTIATION:
- 25th percentile: ${p25:,}
- Median (50th): ${median:,}
- 75th percentile: ${p75:,}
- 90th percentile: ${p90:,}
- YOUR OFFER: ${offered_salary:,} ({offer_position})
- LOCATION: {location}"""

        prompt = f"""You are an expert salary negotiation coach. Create 3 HIGHLY SPECIFIC, company-personalized negotiation scripts for a {job_title} role at {company}.{market_context}

CRITICAL: These are real scripts a person would USE in an actual conversation. They must:
1. Mention {company} by name and reference their business/needs
2. Include actual market data figures (${median:,}, ${p75:,}, ${p90:,})
3. Sound natural - like a real person speaking, not robotic
4. Address the SPECIFIC offer position (you're {'above/at/below'} market)
5. Be 3-4 complete sentences each

BAD EXAMPLES (too generic - DO NOT DO THIS):
- "Thank you for the offer. I appreciate the opportunity." - Too vague
- "I'd like to discuss the compensation." - Doesn't mention company or data
- "Can we talk about salary?" - Meaningless and not specific

GOOD EXAMPLES (specific to company, role, and data):
- "Thank you so much for the offer. I'm genuinely excited about the {company} role and the impact I can have. Before I decide, I wanted to share that my research shows {job_title} positions in {location} typically range ${p75:,}-${p90:,}, and I'd love to discuss how this offer aligns with that market data."
- "I appreciate {company}'s offer, and I'm committed to joining the team. I've researched comparable positions at similar companies, and the market median for this role is around ${median:,}. Given my background, I was hoping we could explore ${p75:,} as a starting point."

Return JSON with this structure:
{{
  "initial_offer_response": "<Response when first receiving the offer. Thank them, show excitement about {company}, mention you need time to review and research>",
  "counteroffer_request": "<Request for higher salary. Mention {company}, specific market data (${p75:,}, ${p90:,}), and why you deserve it. 3-4 sentences>",
  "benefits_negotiation": "<If salary is fixed, negotiate other benefits. Mention {company} and specific benefits valuable for {job_title} roles>"
}}

RULES:
- EVERY script MUST mention {company} explicitly
- EVERY script MUST include at least one market figure (${median:,}, ${p75:,}, etc)
- Scripts must sound like natural conversation, not corporate templates
- Initial response: Show genuine interest in {company}, acknowledge you need time, mention market research
- Counteroffer: Reference market data, your value, why {company} should pay more
- Benefits: If salary is fixed, propose alternatives (equity, PTO, flexibility for {company}'s role)
- 3-4 complete sentences each, not bullet points
- NO markdown, NO extra text
- ONLY return clean JSON"""

        response_text = await call_cohere_api(prompt)
        clean = response_text.replace("```json", "").replace("```", "").strip()

        if "{" in clean:
            clean = clean[clean.find("{"):]
        if "}" in clean:
            clean = clean[:clean.rfind("}") + 1]

        return json.loads(clean)
    except Exception as e:
        print(f"Error generating negotiation scripts: {str(e)}")
        # Fallback with actual market data
        return {
            "initial_offer_response": f"Thank you so much for the offer. I'm genuinely excited about the {company} role and the impact I can make. I'd like to thoroughly review the complete compensation package and research market comparables - can I get back to you within 48 hours with my thoughts?",
            "counteroffer_request": f"I appreciate {company}'s offer and I'm committed to joining the team. I've researched {job_title} positions in {location}, and the market median is around ${median:,}, with competitive offers ranging up to ${p75:,}-${p90:,}. Based on my experience, I'd like to explore a salary closer to that range.",
            "benefits_negotiation": f"If {company}'s base salary is at its maximum, I'd love to discuss other valuable components that matter for a {job_title} role - such as signing bonus, additional PTO, flexible work arrangements, or professional development budget. What flexibility might be possible?"
        }


async def generate_counteroffer_template(
    job_title: str,
    company: str,
    market_salary: Optional[Dict[str, Any]] = None,
    offered_salary: Optional[int] = None,
    offered_salary_details: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Generate counteroffer evaluation template with market context, actual offer details, and specific guidance"""
    try:
        # Build offer details summary
        offer_summary = ""
        if offered_salary_details:
            offer_parts = []
            if offered_salary_details.get("base_salary"):
                offer_parts.append(f"Base Salary: ${offered_salary_details['base_salary']:,}")
            if offered_salary_details.get("signing_bonus"):
                offer_parts.append(f"Signing Bonus: ${offered_salary_details['signing_bonus']:,}")
            if offered_salary_details.get("annual_bonus"):
                offer_parts.append(f"Annual Bonus: {offered_salary_details['annual_bonus']}")
            if offered_salary_details.get("stock_options"):
                offer_parts.append(f"Stock Options: {offered_salary_details['stock_options']}")
            if offered_salary_details.get("rsus"):
                offer_parts.append(f"RSUs: {offered_salary_details['rsus']}")
            if offered_salary_details.get("pto_days"):
                offer_parts.append(f"PTO: {offered_salary_details['pto_days']} days")
            if offered_salary_details.get("remote_flexibility"):
                offer_parts.append(f"Remote: {offered_salary_details['remote_flexibility']}")
            if offer_parts:
                offer_summary = f"\n\nCURRENT OFFER:\n" + "\n".join(offer_parts)

        # Build market context for the prompt
        market_context = ""
        if market_salary and offered_salary:
            median = market_salary.get("median_salary", 0)
            p75 = market_salary.get("percentile_75", 0)
            p90 = market_salary.get("percentile_90", 0)

            if offered_salary < median:
                gap_info = f"Your offer (${offered_salary:,}) is ${median - offered_salary:,} below market median (${median:,})"
            elif offered_salary < p75:
                gap_info = f"Your offer (${offered_salary:,}) is below 75th percentile (${p75:,})"
            else:
                gap_info = f"Your offer (${offered_salary:,}) is competitive"

            market_context = f"""
Current Offer Context:
{gap_info}
- 75th percentile for {job_title}: ${p75:,}
- 90th percentile: ${p90:,}

Use these benchmarks when evaluating counteroffer importance."""

        # Determine priority strategy based on salary position
        if offered_salary and p90 and offered_salary >= p90:
            priority_strategy = "SALARY IS PERFECT (90th+ percentile) - Mark salary as Low/Medium priority. Focus on: Equity, Signing Bonus, Benefits, Remote Work, PTO as High priorities. User should negotiate on non-salary components."
        elif offered_salary and p75 and offered_salary >= p75:
            priority_strategy = "SALARY IS GOOD (75th percentile+) - Mark salary as Medium priority. Focus on: Signing Bonus, Equity, Benefits as High priorities. User can hold on salary and push for other components."
        elif offered_salary and median and offered_salary >= median:
            priority_strategy = "SALARY IS AT MARKET MEDIAN - Mark salary as High priority but not Critical. User could negotiate 5-10% more OR focus on other components (Bonus, Equity, Benefits)."
        else:
            priority_strategy = "SALARY IS BELOW MARKET - Mark salary as Critical priority. User MUST negotiate salary first and hard. Other components are secondary."

        prompt = f"""Create a detailed counteroffer evaluation template for a {job_title} position at {company}.{offer_summary}{market_context}

PRIORITY STRATEGY: {priority_strategy}

Your task: Generate the compensation components that are most important to negotiate for this SPECIFIC role at this SPECIFIC company, ordered by importance. REFERENCE THE ACTUAL OFFER ABOVE - make suggestions based on what's been offered and what's missing.

For {company}'s {job_title} role, determine:
1. Which components are non-negotiable vs flexible
2. What {company} typically negotiates on
3. What's realistic to push back on vs accept
4. Strategic order (start with what matters most)
5. ADJUST PRIORITIES based on the salary position above - don't mark salary as Critical if it's already competitive

Return JSON with this structure:
{{
  "offer_comparison_fields": [
    {{"field": "ComponentName", "importance": "Critical|High|Medium"}},
    {{"field": "ComponentName2", "importance": "..."}},
    ...
  ],
  "evaluation_note": "<Strategic guidance specific to {company} and {job_title} - what to negotiate first based on salary position>"
}}

CRITICAL REQUIREMENTS:
- Order STRATEGICALLY - most important/negotiable first
- Include 8-10 components realistic for {job_title}
- FOLLOW THE PRIORITY STRATEGY ABOVE - adjust component importance accordingly
- evaluation_note MUST be specific to {company}'s industry/size and this role
- Consider: Is this a tech company (equity matters), big corp (benefits), startup (equity), etc?
- If salary is already competitive, reduce its importance and elevate other components
- NO markdown or extra text
- ONLY return clean JSON"""

        response_text = await call_cohere_api(prompt)
        clean = response_text.replace("```json", "").replace("```", "").strip()

        if "{" in clean:
            clean = clean[clean.find("{"):]
        if "}" in clean:
            clean = clean[:clean.rfind("}") + 1]

        return json.loads(clean)
    except Exception as e:
        print(f"Error generating counteroffer template: {str(e)}")
        # Fallback with strategic guidance based on market position and actual offer details
        is_above_90 = offered_salary and p90 and offered_salary >= p90
        is_above_75 = offered_salary and p75 and offered_salary >= p75
        is_below_market = offered_salary and median and offered_salary < median

        # Build personalized strategy note based on what's actually offered
        offer_gaps = []
        if offered_salary_details:
            if not offered_salary_details.get("signing_bonus"):
                offer_gaps.append("Signing Bonus (missing)")
            if not offered_salary_details.get("stock_options") and not offered_salary_details.get("rsus"):
                offer_gaps.append("Equity (missing)")
            if offered_salary_details.get("pto_days", 0) < 20:
                offer_gaps.append(f"PTO ({offered_salary_details.get('pto_days', 0)} days - below standard)")

        if is_above_90:
            base_importance = "Medium"
            gap_note = f" Target: {', '.join(offer_gaps)}" if offer_gaps else " Offer is competitive overall"
            strategy_note = f"Your offer (${offered_salary:,}) is ABOVE 90th percentile (${p90:,}). Salary is excellent.{gap_note} Focus on negotiating missing components."
        elif is_above_75:
            base_importance = "Medium"
            gap_note = f" Target: {', '.join(offer_gaps)}" if offer_gaps else " Overall competitive"
            strategy_note = f"Your offer (${offered_salary:,}) is at 75th percentile (${p75:,}). Salary is good.{gap_note} Focus on Signing Bonus, Equity, Benefits instead of salary."
        elif not is_below_market:
            base_importance = "High"
            gap_note = f" Target: {', '.join(offer_gaps)}" if offer_gaps else ""
            strategy_note = f"Your offer (${offered_salary:,}) is AT market median (${median:,}).{gap_note} Could push for 5-10% more OR focus on other valuable components."
        else:
            base_importance = "Critical"
            strategy_note = f"Your offer (${offered_salary:,}) is BELOW market median (${median:,}). Make Base Salary your primary focus. Use the ${median - offered_salary:,} gap as negotiation leverage."

        return {
            "offer_comparison_fields": [
                {"field": "Base Salary", "importance": base_importance},
                {"field": "Signing Bonus", "importance": "High"},
                {"field": "Annual Bonus/Target Bonus", "importance": "High"},
                {"field": "Equity/Stock Options", "importance": "High"},
                {"field": "Health Insurance Coverage", "importance": "High"},
                {"field": "Retirement (401k/Match)", "importance": "High"},
                {"field": "PTO Days", "importance": "Medium"},
                {"field": "Remote Work Flexibility", "importance": "Medium"},
                {"field": "Professional Development Budget", "importance": "Medium"},
                {"field": "Career Growth Path", "importance": "Medium"}
            ],
            "evaluation_note": f"STRATEGY FOR {company}: {strategy_note}"
        }


async def generate_confidence_exercises(
    job_title: str,
    company: str
) -> list:
    """Generate confidence building exercises"""
    try:
        prompt = f"""Create 3 confidence-building exercises for negotiating a {job_title} offer at {company}.
These should be practical, actionable exercises someone can do before their negotiation conversation.

Return as JSON array like:
[
  {{"title": "<Exercise Title>", "description": "<How to do it>", "time": "<Time required>"}},
  {{"title": "<Exercise Title>", "description": "<How to do it>", "time": "<Time required>"}},
  {{"title": "<Exercise Title>", "description": "<How to do it>", "time": "<Time required>"}}
]

Rules:
- Each exercise should be practical and doable before the call
- Include time estimates
- Make them confidence-boosting
- NO markdown or extra text.
- ONLY return clean JSON array."""

        response_text = await call_cohere_api(prompt)
        clean = response_text.replace("```json", "").replace("```", "").strip()

        if "[" in clean:
            clean = clean[clean.find("["):]
        if "]" in clean:
            clean = clean[:clean.rfind("]") + 1]

        return json.loads(clean) if json.loads(clean) else []
    except Exception as e:
        print(f"Error generating confidence exercises: {str(e)}")
        return [
            {"title": "Practice Your Pitch", "description": "Record yourself explaining why you deserve the salary you're asking for. Watch it back and refine.", "time": "15 minutes"},
            {"title": "Role Play", "description": "Ask a friend or mentor to role play as the hiring manager. Practice your negotiation conversation.", "time": "20 minutes"},
            {"title": "Research Success Stories", "description": "Read 2-3 articles about successful salary negotiations. Build your confidence with real examples.", "time": "10 minutes"}
        ]


async def generate_job_salary_negotiation(
    job_title: str,
    company: str,
    location: str,
    company_size: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generate comprehensive salary negotiation research for a specific job posting.
    Includes market data, talking points, timing, scripts, templates, and exercises.
    """
    try:
        # Research market salary data for this role
        market_data = await research_market_salary(
            role=job_title,
            location=location,
            years_of_experience=3,
            company=company,
            company_size=company_size
        )

        # Generate basic talking points
        talking_points = await generate_negotiation_talking_points(
            role=job_title,
            company=company,
            location=location,
            years_of_experience=3,
            achievements=[]
        )

        # Generate timing strategy
        timing_prompt = f"""Provide a brief salary negotiation timing strategy for a {job_title} role at {company} in {location}.
Include best times to discuss salary and how to approach the conversation. Keep it concise (2-3 paragraphs).
NO markdown or extra formatting. Return only plain text."""

        timing_strategy = await call_cohere_api(timing_prompt)

        # Generate best practices
        practices_prompt = f"""Generate 5 best practices for negotiating salary for a {job_title} position at {company}.
Return as a numbered list like:
1. Practice 1
2. Practice 2
3. Practice 3
4. Practice 4
5. Practice 5

Rules:
- Return exactly 5 practices.
- Use numbered list format.
- NO markdown or extra text."""

        practices_text = await call_cohere_api(practices_prompt)

        best_practices = []
        for line in practices_text.split('\n'):
            if line.strip() and line.strip()[0].isdigit():
                practice = line.split('. ', 1)[-1].strip() if '. ' in line else line.strip()
                if practice and practice not in ["", "."]:
                    best_practices.append(practice)

        # Generate total compensation framework
        compensation_framework = await generate_total_compensation_framework(
            job_title, company, market_data
        )

        # Generate negotiation scripts
        negotiation_scripts = await generate_negotiation_scripts(
            job_title, company, location
        )

        # Generate counteroffer evaluation template
        counteroffer_template = await generate_counteroffer_template(
            job_title, company
        )

        # Generate confidence building exercises
        confidence_exercises = await generate_confidence_exercises(
            job_title, company
        )

        return {
            "job_title": job_title,
            "company": company,
            "location": location,
            "market_data": market_data,
            "talking_points": talking_points[:5],
            "timing_strategy": timing_strategy,
            "best_practices": best_practices,
            "compensation_framework": compensation_framework,
            "negotiation_scripts": negotiation_scripts,
            "counteroffer_template": counteroffer_template,
            "confidence_exercises": confidence_exercises
        }

    except Exception as e:
        print(f"Error generating job salary negotiation: {str(e)}")
        return {
            "error": "Failed to generate salary negotiation research",
            "details": str(e),
            "market_data": {
                "median_salary": 100000,
                "percentile_25": 90000,
                "percentile_75": 120000,
                "percentile_90": 140000,
                "industry_average": 105000,
                "salary_trend": "Stable",
                "comparable_companies": [],
                "company_size_factor": "Standard"
            },
            "talking_points": ["Research market rates", "Highlight experience", "Discuss demand"],
            "timing_strategy": "Discuss salary after initial offer and before final decision",
            "best_practices": ["Do your research", "Know your worth", "Be professional"],
            "compensation_framework": {},
            "negotiation_scripts": {},
            "counteroffer_template": {},
            "confidence_exercises": []
        }
