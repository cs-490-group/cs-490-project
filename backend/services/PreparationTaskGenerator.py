"""
Enhanced Preparation Task Generator
Generates tasks based on job details, interview details, and interviewer info
"""
import uuid
from typing import List, Dict, Optional


class PreparationTaskGenerator:
    """Generate interview preparation tasks based on context"""
    
    @staticmethod
    def generate_tasks(
        job_title: str = "Position",
        company_name: str = "Company",
        location_type: str = "video",
        interviewer_name: Optional[str] = None,
        interviewer_title: Optional[str] = None
    ) -> List[Dict]:
        """
        Generate comprehensive preparation tasks based on available information
        
        Args:
            job_title: The position being interviewed for
            company_name: The company name
            location_type: Type of interview (video, phone, in-person)
            interviewer_name: Name of the interviewer (optional)
            interviewer_title: Title/role of the interviewer (optional)
        
        Returns:
            List of preparation task dictionaries
        """
        tasks = []
        
        # ============================================================
        # RESEARCH TASKS - Always include these
        # ============================================================
        
        # Company research
        tasks.append({
            "task_id": str(uuid.uuid4()),
            "title": f"Research {company_name}",
            "description": f"Study {company_name}'s mission, values, products, recent news, and company culture. Check their website, recent press releases, and social media.",
            "category": "research",
            "priority": "high",
            "is_completed": False
        })
        
        # Role research
        tasks.append({
            "task_id": str(uuid.uuid4()),
            "title": f"Understand {job_title} role requirements",
            "description": f"Review the job description thoroughly. Identify key skills, responsibilities, and qualifications. Prepare examples of how your experience matches each requirement.",
            "category": "research",
            "priority": "high",
            "is_completed": False
        })
        
        # Industry research
        tasks.append({
            "task_id": str(uuid.uuid4()),
            "title": "Research industry trends",
            "description": f"Study current trends and challenges in the industry. Be prepared to discuss how these might affect {company_name} and the {job_title} role.",
            "category": "research",
            "priority": "medium",
            "is_completed": False
        })
        
        # Interviewer research (if name provided)
        if interviewer_name:
            interviewer_context = f"{interviewer_name}"
            if interviewer_title:
                interviewer_context += f" ({interviewer_title})"
            
            tasks.append({
                "task_id": str(uuid.uuid4()),
                "title": f"Research {interviewer_name}",
                "description": f"Look up {interviewer_context} on LinkedIn and company website. Understand their role, background, and any shared interests or connections. This helps build rapport and ask relevant questions.",
                "category": "research",
                "priority": "medium",
                "is_completed": False
            })
        
        # ============================================================
        # PRACTICE TASKS
        # ============================================================
        
        # Behavioral questions
        tasks.append({
            "task_id": str(uuid.uuid4()),
            "title": "Practice behavioral questions",
            "description": "Prepare STAR-method responses (Situation, Task, Action, Result) for common behavioral questions. Focus on examples relevant to the role's key competencies.",
            "category": "practice",
            "priority": "high",
            "is_completed": False
        })
        
        # Technical/role-specific prep
        if any(keyword in job_title.lower() for keyword in ['engineer', 'developer', 'technical', 'analyst', 'scientist']):
            tasks.append({
                "task_id": str(uuid.uuid4()),
                "title": "Review technical concepts",
                "description": f"Brush up on key technical concepts, tools, and methodologies relevant to the {job_title} role. Be prepared for technical questions or exercises.",
                "category": "practice",
                "priority": "high",
                "is_completed": False
            })
        
        # Questions to ask
        tasks.append({
            "task_id": str(uuid.uuid4()),
            "title": "Prepare questions for interviewer",
            "description": f"Prepare 5-10 thoughtful questions about the role, team, {company_name}'s goals, and growth opportunities. Shows your genuine interest and research.",
            "category": "practice",
            "priority": "high",
            "is_completed": False
        })
        
        # Elevator pitch
        tasks.append({
            "task_id": str(uuid.uuid4()),
            "title": "Practice your elevator pitch",
            "description": f"Prepare a concise 1-2 minute introduction covering your background, key achievements, and why you're interested in the {job_title} role at {company_name}.",
            "category": "practice",
            "priority": "medium",
            "is_completed": False
        })
        
        # ============================================================
        # LOGISTICS TASKS - Based on interview format
        # ============================================================
        
        if location_type == "video":
            tasks.append({
                "task_id": str(uuid.uuid4()),
                "title": "Test video setup",
                "description": "Test your camera, microphone, speakers, and internet connection. Ensure video conferencing software is updated and working properly.",
                "category": "logistics",
                "priority": "high",
                "is_completed": False
            })
            
            tasks.append({
                "task_id": str(uuid.uuid4()),
                "title": "Prepare video interview environment",
                "description": "Choose a quiet location with good lighting and a professional background. Remove distractions and ensure family/roommates know you'll be in an interview.",
                "category": "logistics",
                "priority": "high",
                "is_completed": False
            })
            
        elif location_type == "phone":
            tasks.append({
                "task_id": str(uuid.uuid4()),
                "title": "Prepare for phone interview",
                "description": "Find a quiet location with good phone reception. Have your resume, notes, and a notepad ready. Ensure phone is fully charged.",
                "category": "logistics",
                "priority": "high",
                "is_completed": False
            })
            
        elif location_type == "in-person":
            tasks.append({
                "task_id": str(uuid.uuid4()),
                "title": "Plan your route",
                "description": f"Look up directions to {company_name}'s office. Plan to arrive 10-15 minutes early. Consider doing a practice run if unfamiliar with the area.",
                "category": "logistics",
                "priority": "high",
                "is_completed": False
            })
            
            tasks.append({
                "task_id": str(uuid.uuid4()),
                "title": "Prepare professional attire",
                "description": "Choose and prepare appropriate professional clothing. Research company dress code if unsure.",
                "category": "logistics",
                "priority": "high",
                "is_completed": False
            })
        
        # ============================================================
        # MATERIALS TASKS
        # ============================================================
        
        tasks.append({
            "task_id": str(uuid.uuid4()),
            "title": "Prepare supporting materials",
            "description": "Have copies of your resume, portfolio (if applicable), references, and any work samples ready. Organize them for easy access during the interview.",
            "category": "materials",
            "priority": "medium",
            "is_completed": False
        })
        
        tasks.append({
            "task_id": str(uuid.uuid4()),
            "title": "Review your application materials",
            "description": "Re-read your resume, cover letter, and any materials you submitted. Be prepared to elaborate on anything you mentioned.",
            "category": "materials",
            "priority": "medium",
            "is_completed": False
        })
        
        # ============================================================
        # FINAL PREPARATION
        # ============================================================
        
        tasks.append({
            "task_id": str(uuid.uuid4()),
            "title": "Day-before preparation",
            "description": "Review all your notes, get a good night's sleep, and plan your morning routine. Prepare anything you need to bring with you.",
            "category": "logistics",
            "priority": "medium",
            "is_completed": False
        })
        
        return tasks


# Example usage:
"""
# With full details
tasks = PreparationTaskGenerator.generate_tasks(
    job_title="Senior Software Engineer",
    company_name="TechCorp Inc",
    location_type="video",
    interviewer_name="Jane Smith",
    interviewer_title="Engineering Manager"
)

# With minimal details (will still generate useful generic tasks)
tasks = PreparationTaskGenerator.generate_tasks(
    job_title="Position",
    company_name="Company",
    location_type="video"
)
"""