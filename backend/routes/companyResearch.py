from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import os
from openai import OpenAI
from sessions.session_authorizer import authorize
from mongo.jobs_dao import jobs_dao

company_research_router = APIRouter(prefix="/company-research")

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class ResearchRequest(BaseModel):
    job_id: str
    company: str

@company_research_router.post("")
async def run_company_research(body: ResearchRequest, uuid: str = Depends(authorize)):
    job_id = body.job_id
    company = body.company

    if not company:
        raise HTTPException(400, "Company not provided")

    try:
        # Call OpenAI
        completion = client.responses.create(
            model="gpt-4.1-mini",
            input=f"""
                Give me structured company research for {company}.
                Return ONLY JSON in this format:

                {{
                  "overview": "",
                  "industry": "",
                  "size": "",
                  "mission": "",
                  "values": "",
                  "culture": "",
                  "products": [],
                  "competitors": [],
                  "news": [
                    {{"title": "", "date": "", "source": ""}}
                  ],
                  "summary": ""
                }}
            """
        )

        # Extract text properly from new API
        research_text = completion.output_text

        # Try converting into dict — but if it's not valid JSON, keep the string
        import json
        try:
            research_json = json.loads(research_text)
        except:
            research_json = {"raw": research_text}

        # Save to Job root
        await jobs_dao.update_job(job_id, {
            "company_research": research_json
        })

        return {
            "detail": "Company research stored",
            "research": research_json
        }

    except Exception as e:
        print("Company research error:", e)
        raise HTTPException(500, f"Research failed: {str(e)}")





