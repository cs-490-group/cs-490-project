"""
Enhanced Preparation Task Generator with Industry-Specific Tasks
Generates customized tasks based on job details, interview format, and industry
"""
import uuid
from typing import List, Dict, Optional


class PreparationTaskGenerator:
    """Generate interview preparation tasks based on context"""
    
    # Industry-specific task templates
    INDUSTRY_TASKS = {
        "Technology": [
            {
                "title": "Review technical stack and tools",
                "description": "Study the specific technologies, frameworks, and tools mentioned in the job description. Be prepared to discuss your experience with similar technologies.",
                "category": "practice",
                "priority": "high"
            },
            {
                "title": "Prepare coding examples",
                "description": "Review data structures, algorithms, and system design concepts. Practice coding problems on platforms like LeetCode or HackerRank relevant to the role.",
                "category": "practice",
                "priority": "high"
            },
            {
                "title": "Study the company's tech stack",
                "description": "Research the company's technical infrastructure, products, and engineering blog. Understand their technical challenges and solutions.",
                "category": "research",
                "priority": "medium"
            }
        ],
        "Finance": [
            {
                "title": "Review financial concepts",
                "description": "Brush up on key financial principles, regulations, and market trends relevant to the role. Be prepared to discuss financial analysis and modeling.",
                "category": "practice",
                "priority": "high"
            },
            {
                "title": "Study recent market events",
                "description": "Review recent financial news, market movements, and economic indicators. Be ready to discuss their potential impact on the company.",
                "category": "research",
                "priority": "high"
            },
            {
                "title": "Prepare for case studies",
                "description": "Practice financial case studies and valuation exercises. Review Excel/financial modeling skills if applicable to the role.",
                "category": "practice",
                "priority": "medium"
            }
        ],
        "Healthcare": [
            {
                "title": "Review healthcare regulations",
                "description": "Study relevant healthcare regulations (HIPAA, FDA guidelines, etc.) and compliance requirements for the role.",
                "category": "research",
                "priority": "high"
            },
            {
                "title": "Understand patient care principles",
                "description": "Review best practices in patient care, safety protocols, and quality improvement methodologies relevant to the position.",
                "category": "practice",
                "priority": "high"
            },
            {
                "title": "Study healthcare technology",
                "description": "Research electronic health records (EHR) systems, telemedicine platforms, and other healthcare technologies the organization uses.",
                "category": "research",
                "priority": "medium"
            }
        ],
        "Education": [
            {
                "title": "Review teaching methodologies",
                "description": "Prepare to discuss various teaching strategies, learning theories, and assessment methods relevant to the role.",
                "category": "practice",
                "priority": "high"
            },
            {
                "title": "Study curriculum standards",
                "description": "Review relevant curriculum standards, learning objectives, and educational frameworks for the grade level or subject area.",
                "category": "research",
                "priority": "high"
            },
            {
                "title": "Prepare lesson plan examples",
                "description": "Have examples of lesson plans, student engagement strategies, and differentiation techniques ready to discuss.",
                "category": "materials",
                "priority": "medium"
            }
        ],
        "Marketing": [
            {
                "title": "Review marketing campaigns",
                "description": "Study the company's recent marketing campaigns, brand positioning, and target audience. Prepare to discuss what worked and potential improvements.",
                "category": "research",
                "priority": "high"
            },
            {
                "title": "Analyze competitor strategies",
                "description": "Research competitors' marketing approaches, strengths, and weaknesses. Be ready to discuss differentiation opportunities.",
                "category": "research",
                "priority": "high"
            },
            {
                "title": "Prepare campaign ideas",
                "description": "Develop 2-3 creative campaign concepts or marketing strategy ideas relevant to the company's products or services.",
                "category": "practice",
                "priority": "medium"
            }
        ],
        "Design": [
            {
                "title": "Prepare portfolio presentation",
                "description": "Curate your best work samples relevant to the role. Prepare to walk through your design process, decisions, and outcomes.",
                "category": "materials",
                "priority": "high"
            },
            {
                "title": "Study design trends",
                "description": "Review current design trends, tools, and methodologies in the field. Be ready to discuss how you stay current with design evolution.",
                "category": "research",
                "priority": "medium"
            },
            {
                "title": "Review design critique skills",
                "description": "Practice giving and receiving design feedback. Be prepared to discuss how you collaborate with stakeholders and iterate on designs.",
                "category": "practice",
                "priority": "medium"
            }
        ],
        "Consulting": [
            {
                "title": "Practice case interviews",
                "description": "Review case interview frameworks (profitability, market entry, M&A). Practice solving business cases with structured thinking.",
                "category": "practice",
                "priority": "high"
            },
            {
                "title": "Study the firm's clients",
                "description": "Research the consulting firm's key clients, industries served, and recent projects or case studies they've published.",
                "category": "research",
                "priority": "high"
            },
            {
                "title": "Prepare business examples",
                "description": "Have examples ready of complex problems you've solved, analytical approaches you've used, and insights you've delivered.",
                "category": "practice",
                "priority": "medium"
            }
        ],
        "Manufacturing": [
            {
                "title": "Review production methodologies",
                "description": "Study relevant manufacturing processes, quality control systems (Six Sigma, Lean), and production optimization techniques.",
                "category": "research",
                "priority": "high"
            },
            {
                "title": "Understand supply chain",
                "description": "Research the company's supply chain, logistics operations, and any recent challenges or innovations in their production.",
                "category": "research",
                "priority": "medium"
            },
            {
                "title": "Study safety protocols",
                "description": "Review workplace safety standards, OSHA regulations, and safety management systems relevant to the manufacturing environment.",
                "category": "research",
                "priority": "high"
            }
        ],
        "Retail": [
            {
                "title": "Analyze customer experience",
                "description": "Visit the company's stores or website. Analyze the customer journey, pain points, and opportunities for improvement.",
                "category": "research",
                "priority": "high"
            },
            {
                "title": "Study retail metrics",
                "description": "Review key retail performance indicators (conversion rates, average transaction value, inventory turnover). Prepare to discuss how you've impacted these metrics.",
                "category": "practice",
                "priority": "medium"
            },
            {
                "title": "Research retail trends",
                "description": "Study current retail trends (omnichannel, personalization, sustainability). Be ready to discuss how the company can leverage these trends.",
                "category": "research",
                "priority": "medium"
            }
        ]
    }
    
    @staticmethod
    def generate_tasks(
        job_title: str = "Position",
        company_name: str = "Company",
        location_type: str = "video",
        interviewer_name: Optional[str] = None,
        interviewer_title: Optional[str] = None,
        industry: Optional[str] = None,
        job_description: Optional[str] = None,
        company_info: Optional[Dict] = None
    ) -> List[Dict]:
        """
        Generate comprehensive preparation tasks based on available information
        
        Args:
            job_title: The position being interviewed for
            company_name: The company name
            location_type: Type of interview (video, phone, in-person)
            interviewer_name: Name of the interviewer (optional)
            interviewer_title: Title/role of the interviewer (optional)
            industry: Industry category (optional)
            job_description: Full job description text (optional)
            company_info: Additional company information (optional)
        
        Returns:
            List of preparation task dictionaries
        """
        tasks = []
        
        # ============================================================
        # RESEARCH TASKS - Customized based on available info
        # ============================================================
        
        # Company research - customized based on company_info
        company_research_desc = f"Study {company_name}'s mission, values, products, and recent news."
        if company_info:
            if company_info.get('website'):
                company_research_desc += f" Start with their website: {company_info['website']}"
            if company_info.get('size'):
                company_research_desc += f" They have approximately {company_info['size']} employees."
        company_research_desc += " Check recent press releases, social media, and company reviews."
        
        tasks.append({
            "task_id": str(uuid.uuid4()),
            "title": f"Research {company_name}",
            "description": company_research_desc,
            "category": "research",
            "priority": "high",
            "is_completed": False
        })
        
        # Role research - customized based on job_description
        role_research_desc = f"Review the job description thoroughly for the {job_title} role. Identify key skills, responsibilities, and qualifications."
        if job_description:
            role_research_desc += " Prepare specific examples from your experience that match each major requirement mentioned."
        else:
            role_research_desc += " Prepare examples of how your experience matches typical requirements for this role."
        
        tasks.append({
            "task_id": str(uuid.uuid4()),
            "title": f"Understand {job_title} role requirements",
            "description": role_research_desc,
            "category": "research",
            "priority": "high",
            "is_completed": False
        })
        
        # Industry research - generic or specific
        if industry and industry != "Other":
            industry_desc = f"Study current trends and challenges in the {industry} industry. Research how these trends might affect {company_name} and the {job_title} role."
        else:
            industry_desc = f"Research the industry landscape, key competitors, and market trends relevant to {company_name}."
        
        tasks.append({
            "task_id": str(uuid.uuid4()),
            "title": "Research industry trends",
            "description": industry_desc,
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
                "description": f"Look up {interviewer_context} on LinkedIn and the company website. Understand their role, background, career path, and any shared interests or connections. This helps build rapport and ask relevant questions.",
                "category": "research",
                "priority": "medium",
                "is_completed": False
            })
        
        # ============================================================
        # INDUSTRY-SPECIFIC TASKS
        # ============================================================
        
        if industry and industry in PreparationTaskGenerator.INDUSTRY_TASKS:
            for task_template in PreparationTaskGenerator.INDUSTRY_TASKS[industry]:
                # Customize the description with company/role context
                customized_desc = task_template["description"].replace(
                    "the company", company_name
                ).replace(
                    "the role", f"the {job_title} role"
                )
                
                tasks.append({
                    "task_id": str(uuid.uuid4()),
                    "title": task_template["title"],
                    "description": customized_desc,
                    "category": task_template["category"],
                    "priority": task_template["priority"],
                    "is_completed": False
                })
        
        # ============================================================
        # PRACTICE TASKS
        # ============================================================
        
        # Behavioral questions
        tasks.append({
            "task_id": str(uuid.uuid4()),
            "title": "Practice behavioral questions",
            "description": f"Prepare STAR-method responses (Situation, Task, Action, Result) for common behavioral questions. Focus on examples that demonstrate skills critical for the {job_title} role, such as leadership, problem-solving, teamwork, and adaptability.",
            "category": "practice",
            "priority": "high",
            "is_completed": False
        })
        
        # Questions to ask - customized
        questions_desc = f"Prepare 5-10 thoughtful questions about the {job_title} role, team structure, success metrics, and growth opportunities at {company_name}."
        if interviewer_title:
            questions_desc += f" Tailor some questions specifically for a {interviewer_title}."
        questions_desc += " Avoid questions easily answered by basic research."
        
        tasks.append({
            "task_id": str(uuid.uuid4()),
            "title": "Prepare questions for interviewer",
            "description": questions_desc,
            "category": "practice",
            "priority": "high",
            "is_completed": False
        })
        
        # Elevator pitch - customized
        tasks.append({
            "task_id": str(uuid.uuid4()),
            "title": "Practice your elevator pitch",
            "description": f"Prepare a concise 1-2 minute introduction covering your background, key achievements, and why you're specifically interested in the {job_title} role at {company_name}. Practice delivering it naturally, not memorized.",
            "category": "practice",
            "priority": "medium",
            "is_completed": False
        })
        
        # Weakness/challenge question prep
        tasks.append({
            "task_id": str(uuid.uuid4()),
            "title": "Prepare for challenging questions",
            "description": "Practice answering difficult questions like 'Tell me about a time you failed' or 'What's your biggest weakness?' Focus on lessons learned and growth, not just the challenge itself.",
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
                "description": "Test your camera, microphone, speakers, and internet connection 24 hours before and again 30 minutes before the interview. Ensure video conferencing software is updated and working properly. Have a backup plan (phone number) ready.",
                "category": "logistics",
                "priority": "high",
                "is_completed": False
            })
            
            tasks.append({
                "task_id": str(uuid.uuid4()),
                "title": "Prepare video interview environment",
                "description": "Choose a quiet, well-lit location with a clean, professional background. Remove distractions, silence notifications, and inform family/roommates about your interview time. Position camera at eye level.",
                "category": "logistics",
                "priority": "high",
                "is_completed": False
            })
            
        elif location_type == "phone":
            tasks.append({
                "task_id": str(uuid.uuid4()),
                "title": "Prepare for phone interview",
                "description": "Find a quiet location with excellent phone reception. Have your resume, job description, notes, and a notepad with pen ready. Ensure your phone is fully charged. Consider using a landline or high-quality headset if available.",
                "category": "logistics",
                "priority": "high",
                "is_completed": False
            })
            
        elif location_type == "in-person":
            tasks.append({
                "task_id": str(uuid.uuid4()),
                "title": "Plan your route and timing",
                "description": f"Look up directions to {company_name}'s office and plan your route. Account for traffic and parking. Plan to arrive 10-15 minutes early (not too early). Consider doing a practice run if you're unfamiliar with the area.",
                "category": "logistics",
                "priority": "high",
                "is_completed": False
            })
            
            tasks.append({
                "task_id": str(uuid.uuid4()),
                "title": "Prepare professional attire",
                "description": f"Choose and prepare appropriate professional clothing. Research {company_name}'s dress code if unsure - when in doubt, dress slightly more formal than the typical office attire. Ensure clothes are clean, pressed, and fit well.",
                "category": "logistics",
                "priority": "high",
                "is_completed": False
            })
        
        # ============================================================
        # MATERIALS TASKS
        # ============================================================
        
        materials_desc = "Have copies of your resume, references list, and any work samples ready."
        if industry in ["Design", "Marketing", "Technology"]:
            materials_desc += " Prepare a portfolio of relevant work with clear explanations of your role and impact."
        materials_desc += " Organize everything for easy access during the interview."
        
        tasks.append({
            "task_id": str(uuid.uuid4()),
            "title": "Prepare supporting materials",
            "description": materials_desc,
            "category": "materials",
            "priority": "medium",
            "is_completed": False
        })
        
        tasks.append({
            "task_id": str(uuid.uuid4()),
            "title": "Review your application materials",
            "description": "Re-read your resume, cover letter, and any materials you submitted to the company. Be prepared to elaborate on anything you mentioned. Ensure your stories are consistent across all materials.",
            "category": "materials",
            "priority": "medium",
            "is_completed": False
        })
        
        # ============================================================
        # FINAL PREPARATION
        # ============================================================
        
        tasks.append({
            "task_id": str(uuid.uuid4()),
            "title": "Day-before final review",
            "description": "Review all your notes, questions, and key talking points. Get a good night's sleep (aim for 7-8 hours). Avoid cramming new information. Prepare your outfit and materials. Set multiple alarms.",
            "category": "logistics",
            "priority": "medium",
            "is_completed": False
        })
        
        tasks.append({
            "task_id": str(uuid.uuid4()),
            "title": "Morning of interview preparation",
            "description": "Eat a good breakfast, do a final check of your appearance/setup, review your elevator pitch one last time, and do a brief meditation or breathing exercise to calm nerves. Arrive with confidence and a positive mindset.",
            "category": "logistics",
            "priority": "medium",
            "is_completed": False
        })
        
        return tasks