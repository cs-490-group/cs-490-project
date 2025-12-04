"""
Database seeding script to populate MongoDB with comprehensive role-specific question data
Generates 12 questions per role (4 categories × 3 difficulties)
Total: 39 roles × 12 questions = 468 questions
All questions are tailored to specific roles, categories, and difficulty levels
"""
import asyncio
from datetime import datetime, timezone
from mongo.dao_setup import db_client
from mongo.question_bank_dao import (
    QuestionIndustryDAO,
    QuestionRoleDAO,
    QuestionDAO,
)

# All industries with their roles
INDUSTRIES_AND_ROLES = {
    "ind-001": {
        "name": "Software Engineering",
        "icon": "code-bracket",
        "description": "Engineering & Technology roles",
        "category": "Technology",
        "roles": [
            {"uuid": "role-001", "name": "Software Engineer"},
            {"uuid": "role-002", "name": "Senior Software Engineer"},
            {"uuid": "role-003", "name": "Full-Stack Developer"},
            {"uuid": "role-004", "name": "Frontend Engineer"},
            {"uuid": "role-005", "name": "Backend Engineer"},
        ],
    },
    "ind-002": {
        "name": "Data Science",
        "icon": "sparkles",
        "description": "Data & Analytics roles",
        "category": "Technology",
        "roles": [
            {"uuid": "role-006", "name": "Data Scientist"},
            {"uuid": "role-007", "name": "Data Engineer"},
            {"uuid": "role-008", "name": "ML Engineer"},
            {"uuid": "role-009", "name": "Analytics Engineer"},
        ],
    },
    "ind-003": {
        "name": "Product & Design",
        "icon": "paint-brush",
        "description": "Product Management & UX Design",
        "category": "Product Design",
        "roles": [
            {"uuid": "role-010", "name": "Product Manager"},
            {"uuid": "role-011", "name": "UX Designer"},
            {"uuid": "role-012", "name": "UI Designer"},
        ],
    },
    "ind-004": {
        "name": "Finance",
        "icon": "building-library",
        "description": "Financial Services & Accounting",
        "category": "Finance",
        "roles": [
            {"uuid": "role-013", "name": "Financial Analyst"},
            {"uuid": "role-014", "name": "Investment Banker"},
            {"uuid": "role-015", "name": "Accountant"},
        ],
    },
    "ind-005": {
        "name": "Sales & Marketing",
        "icon": "megaphone",
        "description": "Sales, Marketing & Business Development",
        "category": "Sales & Marketing",
        "roles": [
            {"uuid": "role-016", "name": "Sales Executive"},
            {"uuid": "role-017", "name": "Marketing Manager"},
            {"uuid": "role-018", "name": "Business Development"},
        ],
    },
    "ind-006": {
        "name": "Healthcare",
        "icon": "check-circle",
        "description": "Healthcare & Medical Professions",
        "category": "Healthcare",
        "roles": [
            {"uuid": "role-019", "name": "Nurse"},
            {"uuid": "role-020", "name": "Medical Doctor"},
            {"uuid": "role-021", "name": "Healthcare Administrator"},
        ],
    },
    "ind-007": {
        "name": "Education",
        "icon": "academic-cap",
        "description": "Education & Training",
        "category": "Education",
        "roles": [
            {"uuid": "role-022", "name": "Teacher"},
            {"uuid": "role-023", "name": "Curriculum Developer"},
            {"uuid": "role-024", "name": "Education Coordinator"},
        ],
    },
    "ind-008": {
        "name": "Operations",
        "icon": "cog",
        "description": "Operations & Supply Chain",
        "category": "Operations",
        "roles": [
            {"uuid": "role-025", "name": "Operations Manager"},
            {"uuid": "role-026", "name": "Supply Chain Analyst"},
            {"uuid": "role-027", "name": "Logistics Coordinator"},
        ],
    },
    "ind-009": {
        "name": "Human Resources",
        "icon": "user-group",
        "description": "HR & Talent Management",
        "category": "HR",
        "roles": [
            {"uuid": "role-028", "name": "HR Manager"},
            {"uuid": "role-029", "name": "Recruiter"},
            {"uuid": "role-030", "name": "Talent Acquisition Specialist"},
        ],
    },
    "ind-010": {
        "name": "Legal",
        "icon": "scale",
        "description": "Legal Services & Compliance",
        "category": "Legal",
        "roles": [
            {"uuid": "role-031", "name": "Lawyer"},
            {"uuid": "role-032", "name": "Compliance Officer"},
            {"uuid": "role-033", "name": "Legal Analyst"},
        ],
    },
    "ind-011": {
        "name": "DevOps & Infrastructure",
        "icon": "bolt",
        "description": "Cloud & Infrastructure Management",
        "category": "Technology",
        "roles": [
            {"uuid": "role-034", "name": "DevOps Engineer"},
            {"uuid": "role-035", "name": "Cloud Architect"},
            {"uuid": "role-036", "name": "Systems Administrator"},
        ],
    },
    "ind-012": {
        "name": "Consulting",
        "icon": "briefcase",
        "description": "Management & Business Consulting",
        "category": "Consulting",
        "roles": [
            {"uuid": "role-037", "name": "Consultant"},
            {"uuid": "role-038", "name": "Senior Consultant"},
            {"uuid": "role-039", "name": "Strategy Analyst"},
        ],
    },
}

# Role-specific question templates
ROLE_SPECIFIC_QUESTIONS = {
    "role-001": {  # Software Engineer
        "behavioral": {
            "entry": "Tell me about a time you had to debug a complex issue in production code.",
            "mid": "Describe a situation where you had to refactor legacy code while maintaining functionality.",
            "senior": "Tell me about a time you had to make a critical decision about code architecture that impacted the entire team.",
        },
        "technical": {
            "entry": "Explain your approach to writing clean, maintainable code. What principles do you follow?",
            "mid": "Design a solution for handling concurrent requests in a distributed system.",
            "senior": "How would you architect a microservices system to handle millions of requests per day?",
        },
        "situational": {
            "entry": "What would you do if you received feedback that your code is difficult to understand?",
            "mid": "How would you handle a situation where a critical bug was introduced due to your code change?",
            "senior": "How would you approach modernizing a legacy codebase while the team continues development?",
        },
        "company": {
            "entry": "Why are you interested in this software engineering role, and what attracts you to our company?",
            "mid": "How do you see yourself growing as an engineer in our organization?",
            "senior": "How would you contribute to raising the engineering standards and best practices in our organization?",
        },
    },
    "role-002": {  # Senior Software Engineer
        "behavioral": {
            "entry": "Tell me about a time you mentored a junior engineer through a challenging technical problem.",
            "mid": "Describe a situation where you had to lead the technical direction on a major project.",
            "senior": "Tell me about a time you had to make a difficult architectural trade-off that affected multiple teams.",
        },
        "technical": {
            "entry": "How do you approach system design for large-scale applications? Walk me through your process.",
            "mid": "Design a highly scalable architecture for a real-time data processing platform.",
            "senior": "How would you design a system that can handle petabyte-scale data while maintaining sub-second latency?",
        },
        "situational": {
            "entry": "How would you handle disagreement with other senior engineers about technical direction?",
            "mid": "Describe your approach to managing technical debt in a fast-growing organization.",
            "senior": "How would you navigate a situation where business needs conflict with technical excellence?",
        },
        "company": {
            "entry": "What does technical leadership mean to you, and how do you practice it?",
            "mid": "How would you help establish engineering best practices across multiple teams?",
            "senior": "What is your vision for the technical direction and culture of our engineering organization?",
        },
    },
    "role-003": {  # Full-Stack Developer
        "behavioral": {
            "entry": "Tell me about a time you had to coordinate between frontend and backend teams.",
            "mid": "Describe a situation where you had to optimize performance across the entire stack.",
            "senior": "Tell me about a time you architected an end-to-end solution that improved user experience significantly.",
        },
        "technical": {
            "entry": "Explain your experience with full-stack development. What are your strengths in frontend vs backend?",
            "mid": "Design a full-stack solution for a real-time collaborative application.",
            "senior": "How would you architect a full-stack system that scales horizontally and maintains data consistency?",
        },
        "situational": {
            "entry": "What would you do if a feature breaks both frontend and backend components simultaneously?",
            "mid": "How would you handle a situation where frontend and backend teams have conflicting priorities?",
            "senior": "How would you approach bridging the gap between frontend and backend when designing a new system?",
        },
        "company": {
            "entry": "Why do you prefer full-stack development over specializing in one area?",
            "mid": "How do you stay updated with both frontend and backend technologies?",
            "senior": "How would you mentor other full-stack developers to excel across the entire stack?",
        },
    },
    "role-004": {  # Frontend Engineer
        "behavioral": {
            "entry": "Tell me about a time you had to implement a complex UI feature from design specifications.",
            "mid": "Describe a situation where you had to optimize a slow-performing user interface.",
            "senior": "Tell me about a time you had to establish a component library or design system.",
        },
        "technical": {
            "entry": "Explain your proficiency with modern frontend frameworks and your approach to choosing them.",
            "mid": "Design a responsive, accessible UI component system for a large-scale application.",
            "senior": "How would you architect a frontend application that supports millions of daily active users?",
        },
        "situational": {
            "entry": "What would you do if a design change breaks existing functionality?",
            "mid": "How would you handle performance issues caused by the complexity of your components?",
            "senior": "How would you approach the transition to a new frontend framework without disrupting the product?",
        },
        "company": {
            "entry": "Why does frontend engineering interest you, and what are your career goals?",
            "mid": "How do you balance design aesthetics with technical performance?",
            "senior": "How would you shape the frontend culture and best practices in our organization?",
        },
    },
    "role-005": {  # Backend Engineer
        "behavioral": {
            "entry": "Tell me about a time you designed an API that other teams found easy to integrate with.",
            "mid": "Describe a situation where you had to scale a backend system to handle unexpected traffic.",
            "senior": "Tell me about a time you had to redesign a critical system with minimal downtime.",
        },
        "technical": {
            "entry": "Explain your approach to designing robust, scalable APIs.",
            "mid": "Design a backend system for handling high-frequency transactions with strict consistency requirements.",
            "senior": "How would you design a globally distributed backend system with automatic failover?",
        },
        "situational": {
            "entry": "What would you do if a database query starts taking too long in production?",
            "mid": "How would you handle a situation where a backend service becomes a bottleneck?",
            "senior": "How would you approach decomposing a monolithic backend into microservices?",
        },
        "company": {
            "entry": "Why does backend engineering excite you, and what type of systems interest you most?",
            "mid": "How do you stay updated with backend technologies and practices?",
            "senior": "How would you contribute to the reliability and scalability of our backend infrastructure?",
        },
    },
    "role-006": {  # Data Scientist
        "behavioral": {
            "entry": "Tell me about a time you had to present complex findings to non-technical stakeholders.",
            "mid": "Describe a situation where your analysis led to a significant business decision.",
            "senior": "Tell me about a time you led a data science initiative that transformed the organization.",
        },
        "technical": {
            "entry": "Walk me through your approach to exploratory data analysis on a new dataset.",
            "mid": "Design a machine learning model to predict customer churn. How would you evaluate it?",
            "senior": "How would you build an end-to-end ML system that continuously learns and improves?",
        },
        "situational": {
            "entry": "What would you do if the data quality is poor and affects your analysis?",
            "mid": "How would you handle a situation where your model predictions don't match business expectations?",
            "senior": "How would you approach implementing ethical AI practices across data science projects?",
        },
        "company": {
            "entry": "What type of data problems excite you most, and why are you interested in our company?",
            "mid": "How do you balance statistical rigor with business pragmatism?",
            "senior": "How would you build a data science capability that drives strategic business value?",
        },
    },
    "role-007": {  # Data Engineer
        "behavioral": {
            "entry": "Tell me about a time you built a data pipeline that improved data accessibility.",
            "mid": "Describe a situation where you had to optimize data infrastructure for performance.",
            "senior": "Tell me about a time you designed a data architecture that scaled to handle massive data volume.",
        },
        "technical": {
            "entry": "Explain your experience with data warehousing and data pipeline tools.",
            "mid": "Design a data pipeline that ingests, transforms, and serves data for ML models in real-time.",
            "senior": "How would you architect a data platform that supports petabyte-scale analytics?",
        },
        "situational": {
            "entry": "What would you do if a data pipeline fails and delays analysis for downstream teams?",
            "mid": "How would you handle a situation where data quality issues affect model accuracy?",
            "senior": "How would you approach modernizing a legacy data warehouse architecture?",
        },
        "company": {
            "entry": "Why are you passionate about data engineering, and what appeals to you about our company?",
            "mid": "How do you ensure data quality and reliability in your pipelines?",
            "senior": "How would you establish data engineering best practices and standards in our organization?",
        },
    },
    "role-008": {  # ML Engineer
        "behavioral": {
            "entry": "Tell me about a time you deployed a machine learning model to production.",
            "mid": "Describe a situation where you had to iterate on a model based on feedback.",
            "senior": "Tell me about a time you led the end-to-end development of a mission-critical ML system.",
        },
        "technical": {
            "entry": "Explain your approach to feature engineering and model selection.",
            "mid": "Design an ML system for real-time recommendations. How would you handle cold start?",
            "senior": "How would you design an ML platform that enables rapid experimentation and deployment?",
        },
        "situational": {
            "entry": "What would you do if a model performs well in testing but poorly in production?",
            "mid": "How would you handle model drift and ensure continuous performance monitoring?",
            "senior": "How would you approach building ML systems that are interpretable and fair?",
        },
        "company": {
            "entry": "What type of ML problems are you most interested in solving?",
            "mid": "How do you balance model complexity with interpretability?",
            "senior": "How would you lead the adoption of ML across different product teams?",
        },
    },
    "role-009": {  # Analytics Engineer
        "behavioral": {
            "entry": "Tell me about a time you created an analytics solution that informed a major decision.",
            "mid": "Describe a situation where you had to work across analytics, engineering, and product teams.",
            "senior": "Tell me about a time you established analytics practices that scaled across the organization.",
        },
        "technical": {
            "entry": "Explain your approach to building metrics and dashboards for business stakeholders.",
            "mid": "Design an analytics solution that provides real-time insights for a fast-growing product.",
            "senior": "How would you architect an analytics platform that scales to handle billion-row datasets?",
        },
        "situational": {
            "entry": "What would you do if a dashboard shows conflicting metrics?",
            "mid": "How would you handle a situation where analytics infrastructure can't keep up with query demand?",
            "senior": "How would you approach establishing data-driven decision making culture in the organization?",
        },
        "company": {
            "entry": "Why are you interested in analytics engineering, and how do you see it contributing to our success?",
            "mid": "How do you ensure data integrity and trustworthiness in your analytics solutions?",
            "senior": "How would you shape the analytics strategy and vision for our organization?",
        },
    },
    "role-010": {  # Product Manager
        "behavioral": {
            "entry": "Tell me about a time you had to make a difficult trade-off between features.",
            "mid": "Describe a situation where you had to align multiple stakeholders with different priorities.",
            "senior": "Tell me about a time you led a product pivot that required organizational change.",
        },
        "technical": {
            "entry": "Explain how you approach understanding technical constraints and their impact on product decisions.",
            "mid": "How would you approach building a roadmap for a complex product with multiple teams?",
            "senior": "How do you think about product strategy and long-term vision?",
        },
        "situational": {
            "entry": "What would you do if a major competitor launches a similar feature?",
            "mid": "How would you handle a situation where your product hypothesis was wrong?",
            "senior": "How would you navigate a market shift that requires redefining your product strategy?",
        },
        "company": {
            "entry": "Why are you passionate about product management, and what attracts you to our company?",
            "mid": "How do you balance user needs with business objectives?",
            "senior": "How would you contribute to building a world-class product organization?",
        },
    },
    "role-011": {  # UX Designer
        "behavioral": {
            "entry": "Tell me about a time you conducted user research that changed your design perspective.",
            "mid": "Describe a situation where you had to advocate for user needs against business pressure.",
            "senior": "Tell me about a time you led a design system that improved product consistency.",
        },
        "technical": {
            "entry": "Explain your proficiency with design tools and your approach to prototyping.",
            "mid": "Design a user experience for a complex workflow used by enterprise customers.",
            "senior": "How would you approach designing a scalable design system for a product used by millions?",
        },
        "situational": {
            "entry": "What would you do if user testing revealed that your design approach was wrong?",
            "mid": "How would you handle a situation where engineering constraints conflict with your design vision?",
            "senior": "How would you establish a user-centric design culture across product and engineering?",
        },
        "company": {
            "entry": "Why do you love UX design, and what draws you to our company?",
            "mid": "How do you balance aesthetics with usability and accessibility?",
            "senior": "How would you shape the design vision and standards for our organization?",
        },
    },
    "role-012": {  # UI Designer
        "behavioral": {
            "entry": "Tell me about a time you had to adapt your design to meet technical constraints.",
            "mid": "Describe a situation where you had to iterate on a design based on feedback.",
            "senior": "Tell me about a time you established a design system that was adopted across teams.",
        },
        "technical": {
            "entry": "Explain your proficiency with UI design tools and your approach to component design.",
            "mid": "Design a comprehensive UI system for a mobile and web application.",
            "senior": "How would you architect a design system that scales across multiple products?",
        },
        "situational": {
            "entry": "What would you do if your design is difficult for developers to implement?",
            "mid": "How would you handle a situation where design and engineering have different visions?",
            "senior": "How would you approach modernizing a product's visual design without breaking existing experiences?",
        },
        "company": {
            "entry": "Why are you passionate about UI design, and what attracts you to our company?",
            "mid": "How do you stay current with design trends while maintaining brand consistency?",
            "senior": "How would you build and mentor a high-performing design team?",
        },
    },
    "role-013": {  # Financial Analyst
        "behavioral": {
            "entry": "Tell me about a time you had to present financial findings to senior management.",
            "mid": "Describe a situation where your analysis led to cost savings or revenue optimization.",
            "senior": "Tell me about a time you led a complex financial project with significant business impact.",
        },
        "technical": {
            "entry": "Walk me through your approach to financial modeling and forecasting.",
            "mid": "Build a financial model to evaluate the viability of a new business initiative.",
            "senior": "How would you approach strategic financial planning for a high-growth organization?",
        },
        "situational": {
            "entry": "What would you do if your analysis reveals an unexpected financial issue?",
            "mid": "How would you handle conflicting assumptions in a financial forecast?",
            "senior": "How would you approach financial strategy during uncertain market conditions?",
        },
        "company": {
            "entry": "Why are you interested in financial analysis, and what appeals to you about our company?",
            "mid": "How do you balance accuracy with the need to make timely recommendations?",
            "senior": "How would you contribute to our financial strategy and organizational growth?",
        },
    },
    "role-014": {  # Investment Banker
        "behavioral": {
            "entry": "Tell me about a time you managed a client relationship through a complex transaction.",
            "mid": "Describe a situation where you had to work under extreme pressure to close a deal.",
            "senior": "Tell me about a time you led a high-profile M&A transaction.",
        },
        "technical": {
            "entry": "Explain your approach to valuation methodologies and their applications.",
            "mid": "Build an investment case for acquiring a company. What metrics would you analyze?",
            "senior": "How would you advise a client on a complex financial restructuring?",
        },
        "situational": {
            "entry": "What would you do if a transaction falls apart at the last minute?",
            "mid": "How would you handle a situation where client expectations don't align with market realities?",
            "senior": "How would you navigate a market downturn that affects deal flow and valuations?",
        },
        "company": {
            "entry": "Why are you passionate about investment banking, and what interests you about our firm?",
            "mid": "How do you build and maintain strong client relationships?",
            "senior": "How would you contribute to establishing our firm's market position and advisory reputation?",
        },
    },
    "role-015": {  # Accountant
        "behavioral": {
            "entry": "Tell me about a time you identified an accounting issue that prevented errors.",
            "mid": "Describe a situation where you had to explain complex accounting concepts to non-finance staff.",
            "senior": "Tell me about a time you led an accounting transformation or process improvement.",
        },
        "technical": {
            "entry": "Explain your knowledge of GAAP and accounting standards relevant to our industry.",
            "mid": "How would you approach preparing financial statements for a complex organization?",
            "senior": "How would you ensure compliance and accuracy in accounting systems at scale?",
        },
        "situational": {
            "entry": "What would you do if you discover a discrepancy in the accounts?",
            "mid": "How would you handle a situation where accounting processes are inefficient and error-prone?",
            "senior": "How would you navigate a regulatory audit and ensure organizational compliance?",
        },
        "company": {
            "entry": "Why are you interested in accounting, and what attracts you to our organization?",
            "mid": "How do you stay updated with accounting standards and regulations?",
            "senior": "How would you establish accounting best practices and controls in our organization?",
        },
    },
    "role-016": {  # Sales Executive
        "behavioral": {
            "entry": "Tell me about a time you built a strong relationship with a challenging client.",
            "mid": "Describe a situation where you had to close a deal against competing offers.",
            "senior": "Tell me about a time you turned around a failing sales territory.",
        },
        "technical": {
            "entry": "Explain your understanding of our products and how you position them to clients.",
            "mid": "Walk me through your approach to consultative selling and needs analysis.",
            "senior": "How do you develop account strategy for large, complex enterprise accounts?",
        },
        "situational": {
            "entry": "What would you do if a key client threatens to leave?",
            "mid": "How would you handle a situation where competitors are undercutting your prices?",
            "senior": "How would you approach building a high-performing sales team?",
        },
        "company": {
            "entry": "Why are you excited about sales, and what appeals to you about our company?",
            "mid": "How do you balance short-term quota with long-term relationship building?",
            "senior": "How would you contribute to our sales growth and market expansion?",
        },
    },
    "role-017": {  # Marketing Manager
        "behavioral": {
            "entry": "Tell me about a time you launched a successful marketing campaign.",
            "mid": "Describe a situation where you had to pivot your marketing strategy.",
            "senior": "Tell me about a time you built a marketing program that significantly impacted revenue.",
        },
        "technical": {
            "entry": "Explain your proficiency with marketing tools, analytics, and campaign management.",
            "mid": "Design a comprehensive marketing strategy for a new product launch.",
            "senior": "How would you approach building a scalable marketing organization?",
        },
        "situational": {
            "entry": "What would you do if a marketing campaign underperforms?",
            "mid": "How would you handle a situation where your audience is different from projections?",
            "senior": "How would you navigate a competitive market and establish brand differentiation?",
        },
        "company": {
            "entry": "Why are you passionate about marketing, and what draws you to our company?",
            "mid": "How do you measure marketing effectiveness and optimize campaigns?",
            "senior": "How would you shape our brand and marketing strategy for growth?",
        },
    },
    "role-018": {  # Business Development
        "behavioral": {
            "entry": "Tell me about a time you identified and pursued a new business opportunity.",
            "mid": "Describe a situation where you negotiated a complex partnership agreement.",
            "senior": "Tell me about a time you led a transformational business development initiative.",
        },
        "technical": {
            "entry": "Explain your approach to market analysis and opportunity evaluation.",
            "mid": "Design a business development strategy for entering a new market segment.",
            "senior": "How would you approach strategic partnerships and alliances to drive growth?",
        },
        "situational": {
            "entry": "What would you do if a promising partnership falls through?",
            "mid": "How would you handle a situation where market conditions change rapidly?",
            "senior": "How would you navigate complex negotiations with strategic importance?",
        },
        "company": {
            "entry": "Why are you interested in business development, and what excites you about our company?",
            "mid": "How do you balance relationship building with closing deals?",
            "senior": "How would you contribute to our strategic growth and market position?",
        },
    },
    "role-019": {  # Nurse
        "behavioral": {
            "entry": "Tell me about a time you provided compassionate care to a difficult patient.",
            "mid": "Describe a situation where you had to coordinate care across multiple team members.",
            "senior": "Tell me about a time you led quality improvement in patient care.",
        },
        "technical": {
            "entry": "Explain your clinical nursing skills and certifications relevant to this role.",
            "mid": "How would you approach managing a complex patient with multiple conditions?",
            "senior": "How would you ensure evidence-based nursing practices are consistently applied?",
        },
        "situational": {
            "entry": "What would you do if a patient refuses a necessary treatment?",
            "mid": "How would you handle a situation where staffing is insufficient during a crisis?",
            "senior": "How would you approach improving patient outcomes in your unit?",
        },
        "company": {
            "entry": "Why are you passionate about nursing, and what appeals to you about our healthcare organization?",
            "mid": "How do you balance patient care with documentation and administrative tasks?",
            "senior": "How would you mentor junior nurses and build a strong nursing culture?",
        },
    },
    "role-020": {  # Medical Doctor
        "behavioral": {
            "entry": "Tell me about a time you had to deliver difficult news to a patient.",
            "mid": "Describe a situation where you had to collaborate with specialists for a complex case.",
            "senior": "Tell me about a time you led a medical initiative that improved patient outcomes.",
        },
        "technical": {
            "entry": "Walk me through your approach to diagnosis and differential diagnosis.",
            "mid": "Present a complex case and your diagnostic reasoning.",
            "senior": "How would you approach evidence-based medicine and clinical decision making?",
        },
        "situational": {
            "entry": "What would you do if a patient doesn't comply with your treatment recommendations?",
            "mid": "How would you handle a situation where diagnosis is uncertain?",
            "senior": "How would you navigate ethical dilemmas in patient care?",
        },
        "company": {
            "entry": "Why are you interested in practicing medicine with our organization?",
            "mid": "How do you stay current with medical advances in your specialty?",
            "senior": "How would you contribute to advancing medical practice and patient care excellence?",
        },
    },
    "role-021": {  # Healthcare Administrator
        "behavioral": {
            "entry": "Tell me about a time you improved operations in a healthcare setting.",
            "mid": "Describe a situation where you had to manage conflicting interests of different departments.",
            "senior": "Tell me about a time you led a major organizational change in healthcare.",
        },
        "technical": {
            "entry": "Explain your understanding of healthcare regulations and compliance requirements.",
            "mid": "How would you approach optimizing operations while maintaining quality and safety?",
            "senior": "How would you develop a strategic plan for a healthcare organization?",
        },
        "situational": {
            "entry": "What would you do if a compliance issue is discovered?",
            "mid": "How would you handle budget constraints while maintaining service quality?",
            "senior": "How would you navigate healthcare industry changes and financial pressures?",
        },
        "company": {
            "entry": "Why are you interested in healthcare administration, and what appeals to you about our organization?",
            "mid": "How do you balance financial sustainability with patient-centric care?",
            "senior": "How would you shape the strategic direction and culture of our healthcare organization?",
        },
    },
    "role-022": {  # Teacher
        "behavioral": {
            "entry": "Tell me about a time you helped a struggling student succeed.",
            "mid": "Describe a situation where you had to manage a difficult classroom dynamic.",
            "senior": "Tell me about a time you developed a curriculum or program that improved student outcomes.",
        },
        "technical": {
            "entry": "Explain your teaching philosophy and approach to student engagement.",
            "mid": "How would you differentiate instruction for students with varied learning needs?",
            "senior": "How would you lead educational initiatives that advance teaching practices?",
        },
        "situational": {
            "entry": "What would you do if a student is disruptive in class?",
            "mid": "How would you handle a parent who disagrees with your assessment of their child?",
            "senior": "How would you navigate education policy changes and implement them effectively?",
        },
        "company": {
            "entry": "Why are you passionate about teaching, and what attracts you to our school?",
            "mid": "How do you stay current with pedagogical approaches and subject knowledge?",
            "senior": "How would you contribute to improving educational outcomes across our institution?",
        },
    },
    "role-023": {  # Curriculum Developer
        "behavioral": {
            "entry": "Tell me about a time you gathered feedback from teachers to improve curriculum.",
            "mid": "Describe a situation where you had to align curriculum with new standards.",
            "senior": "Tell me about a time you led a comprehensive curriculum redesign.",
        },
        "technical": {
            "entry": "Explain your approach to designing learning objectives and assessments.",
            "mid": "Design a curriculum unit that addresses diverse learning styles and needs.",
            "senior": "How would you develop a comprehensive curriculum framework aligned with outcomes?",
        },
        "situational": {
            "entry": "What would you do if curriculum materials are not aligned with standards?",
            "mid": "How would you handle resistance from teachers implementing new curriculum?",
            "senior": "How would you approach modernizing curriculum in a changing education landscape?",
        },
        "company": {
            "entry": "Why are you interested in curriculum development, and what excites you about our organization?",
            "mid": "How do you ensure curriculum materials are engaging and effective?",
            "senior": "How would you establish a curriculum development process that drives educational innovation?",
        },
    },
    "role-024": {  # Education Coordinator
        "behavioral": {
            "entry": "Tell me about a time you coordinated between multiple departments to support education.",
            "mid": "Describe a situation where you had to solve a complex operational challenge.",
            "senior": "Tell me about a time you led an education program initiative.",
        },
        "technical": {
            "entry": "Explain your experience with education systems, databases, and administrative tools.",
            "mid": "How would you approach improving education program operations and efficiency?",
            "senior": "How would you design systems and processes to support educational excellence?",
        },
        "situational": {
            "entry": "What would you do if there's a scheduling conflict that affects multiple programs?",
            "mid": "How would you handle a situation where resources are insufficient for programs?",
            "senior": "How would you navigate strategic planning for education program expansion?",
        },
        "company": {
            "entry": "Why are you interested in education coordination, and what appeals to you about our organization?",
            "mid": "How do you balance support for multiple educational programs?",
            "senior": "How would you contribute to the strategic growth and quality of education programs?",
        },
    },
    "role-025": {  # Operations Manager
        "behavioral": {
            "entry": "Tell me about a time you streamlined a process that improved efficiency.",
            "mid": "Describe a situation where you had to manage a crisis and maintain operations.",
            "senior": "Tell me about a time you transformed operations at scale.",
        },
        "technical": {
            "entry": "Explain your approach to process improvement and operational efficiency.",
            "mid": "Design an operations strategy for a multi-facility organization.",
            "senior": "How would you approach building a world-class operations organization?",
        },
        "situational": {
            "entry": "What would you do if operations are disrupted due to unexpected circumstances?",
            "mid": "How would you handle a situation where operational costs exceed budget?",
            "senior": "How would you navigate supply chain disruptions and ensure business continuity?",
        },
        "company": {
            "entry": "Why are you interested in operations management, and what appeals to you about our company?",
            "mid": "How do you balance efficiency with quality and safety?",
            "senior": "How would you contribute to operational excellence and organizational growth?",
        },
    },
    "role-026": {  # Supply Chain Analyst
        "behavioral": {
            "entry": "Tell me about a time you solved a supply chain problem that improved delivery.",
            "mid": "Describe a situation where you had to manage supplier relationships.",
            "senior": "Tell me about a time you redesigned supply chain processes.",
        },
        "technical": {
            "entry": "Explain your knowledge of supply chain management tools and methodologies.",
            "mid": "Design a supply chain strategy to minimize costs while maintaining service levels.",
            "senior": "How would you approach supply chain transformation and optimization?",
        },
        "situational": {
            "entry": "What would you do if a supplier fails to deliver on time?",
            "mid": "How would you handle a situation where demand forecasting is significantly wrong?",
            "senior": "How would you build supply chain resilience against disruptions?",
        },
        "company": {
            "entry": "Why are you passionate about supply chain, and what attracts you to our company?",
            "mid": "How do you balance cost reduction with supply chain reliability?",
            "senior": "How would you shape our supply chain strategy to support business growth?",
        },
    },
    "role-027": {  # Logistics Coordinator
        "behavioral": {
            "entry": "Tell me about a time you coordinated a complex shipment successfully.",
            "mid": "Describe a situation where you had to solve a logistics problem under pressure.",
            "senior": "Tell me about a time you improved logistics efficiency and reduced costs.",
        },
        "technical": {
            "entry": "Explain your experience with logistics software and transportation management.",
            "mid": "How would you approach optimizing routes and reducing shipping costs?",
            "senior": "How would you design logistics operations that scale efficiently?",
        },
        "situational": {
            "entry": "What would you do if a shipment is delayed and impacts customers?",
            "mid": "How would you handle coordinating multiple vendors and carriers?",
            "senior": "How would you navigate logistics challenges during peak demand periods?",
        },
        "company": {
            "entry": "Why are you interested in logistics coordination, and what appeals to you about our company?",
            "mid": "How do you ensure accuracy and reliability in logistics operations?",
            "senior": "How would you contribute to logistics excellence and customer satisfaction?",
        },
    },
    "role-028": {  # HR Manager
        "behavioral": {
            "entry": "Tell me about a time you resolved a complex employee relations issue.",
            "mid": "Describe a situation where you had to manage a difficult personnel situation fairly.",
            "senior": "Tell me about a time you transformed HR practices in an organization.",
        },
        "technical": {
            "entry": "Explain your knowledge of employment law and HR best practices.",
            "mid": "How would you approach designing compensation and benefits strategies?",
            "senior": "How would you build a strategic HR function that drives organizational success?",
        },
        "situational": {
            "entry": "What would you do if an employee files a discrimination complaint?",
            "mid": "How would you handle a situation where you must reduce staff?",
            "senior": "How would you navigate cultural transformation in an organization?",
        },
        "company": {
            "entry": "Why are you passionate about HR, and what appeals to you about our company?",
            "mid": "How do you balance employee advocacy with organizational needs?",
            "senior": "How would you shape HR strategy and organizational culture?",
        },
    },
    "role-029": {  # Recruiter
        "behavioral": {
            "entry": "Tell me about a time you filled a difficult-to-fill position.",
            "mid": "Describe a situation where you had to manage multiple stakeholders in hiring.",
            "senior": "Tell me about a time you built a high-performing recruiting function.",
        },
        "technical": {
            "entry": "Explain your sourcing strategies and recruiting tools proficiency.",
            "mid": "How would you approach building a talent pipeline for critical roles?",
            "senior": "How would you develop a recruiting strategy that supports organizational growth?",
        },
        "situational": {
            "entry": "What would you do if top candidates decline offers?",
            "mid": "How would you handle a situation where hiring manager expectations are unrealistic?",
            "senior": "How would you scale recruiting to support rapid business growth?",
        },
        "company": {
            "entry": "Why are you excited about recruiting, and what appeals to you about our company?",
            "mid": "How do you ensure diversity and inclusion in the recruiting process?",
            "senior": "How would you contribute to building an employer brand and attracting top talent?",
        },
    },
    "role-030": {  # Talent Acquisition Specialist
        "behavioral": {
            "entry": "Tell me about a time you successfully closed a candidate.",
            "mid": "Describe a situation where you had to manage a tough hiring negotiation.",
            "senior": "Tell me about a time you improved the candidate experience.",
        },
        "technical": {
            "entry": "Explain your experience with applicant tracking systems and recruiting platforms.",
            "mid": "How would you approach screening and interviewing candidates effectively?",
            "senior": "How would you design talent acquisition processes that support scaling?",
        },
        "situational": {
            "entry": "What would you do if a candidate has great skills but cultural misalignment?",
            "mid": "How would you handle competing offers from multiple positions?",
            "senior": "How would you navigate hiring during economic uncertainty?",
        },
        "company": {
            "entry": "Why are you interested in talent acquisition, and what attracts you to our company?",
            "mid": "How do you ensure fair and unbiased hiring practices?",
            "senior": "How would you shape our talent acquisition strategy and improve hiring outcomes?",
        },
    },
    "role-031": {  # Lawyer
        "behavioral": {
            "entry": "Tell me about a time you advised a client on a complex legal matter.",
            "mid": "Describe a situation where you had to advocate strongly for a client's interests.",
            "senior": "Tell me about a time you led a high-stakes legal case or transaction.",
        },
        "technical": {
            "entry": "Explain your knowledge of relevant practice areas and legal principles.",
            "mid": "How would you approach researching and analyzing complex legal issues?",
            "senior": "How would you advise clients on strategic legal and business decisions?",
        },
        "situational": {
            "entry": "What would you do if opposing counsel makes unethical arguments?",
            "mid": "How would you handle a situation where legal and client interests diverge?",
            "senior": "How would you navigate complex litigation while protecting client interests?",
        },
        "company": {
            "entry": "Why are you interested in practicing law with our firm?",
            "mid": "How do you build strong client relationships and trust?",
            "senior": "How would you contribute to our firm's reputation and legal excellence?",
        },
    },
    "role-032": {  # Compliance Officer
        "behavioral": {
            "entry": "Tell me about a time you identified and resolved a compliance issue.",
            "mid": "Describe a situation where you had to enforce compliance standards across the organization.",
            "senior": "Tell me about a time you built a compliance program from the ground up.",
        },
        "technical": {
            "entry": "Explain your knowledge of relevant regulations and compliance requirements.",
            "mid": "How would you design compliance controls for a complex organization?",
            "senior": "How would you approach compliance strategy and enterprise risk management?",
        },
        "situational": {
            "entry": "What would you do if you discover a significant compliance violation?",
            "mid": "How would you handle resistance to compliance changes from business teams?",
            "senior": "How would you navigate regulatory changes and ensure organizational compliance?",
        },
        "company": {
            "entry": "Why are you passionate about compliance, and what appeals to you about our company?",
            "mid": "How do you balance compliance with business operations?",
            "senior": "How would you establish a strong compliance culture across the organization?",
        },
    },
    "role-033": {  # Legal Analyst
        "behavioral": {
            "entry": "Tell me about a time you supported an attorney with critical research.",
            "mid": "Describe a situation where you took initiative on a legal project.",
            "senior": "Tell me about a time you managed complex legal projects and timelines.",
        },
        "technical": {
            "entry": "Explain your legal research skills and proficiency with legal databases.",
            "mid": "How would you approach managing documents and organizing complex legal matters?",
            "senior": "How would you support attorneys in developing legal strategies?",
        },
        "situational": {
            "entry": "What would you do if you find discrepancies in legal documents?",
            "mid": "How would you handle tight deadlines on complex legal analysis?",
            "senior": "How would you coordinate across multiple legal projects and stakeholders?",
        },
        "company": {
            "entry": "Why are you interested in legal analysis, and what appeals to you about our firm?",
            "mid": "How do you stay organized and detail-oriented with complex legal matters?",
            "senior": "How would you contribute to legal excellence and client service?",
        },
    },
    "role-034": {  # DevOps Engineer
        "behavioral": {
            "entry": "Tell me about a time you improved deployment processes.",
            "mid": "Describe a situation where you had to respond to a production incident.",
            "senior": "Tell me about a time you architected infrastructure that supported significant growth.",
        },
        "technical": {
            "entry": "Explain your proficiency with CI/CD tools and infrastructure automation.",
            "mid": "Design a deployment pipeline for a microservices application.",
            "senior": "How would you approach building highly available, scalable infrastructure?",
        },
        "situational": {
            "entry": "What would you do if a deployment fails and impacts users?",
            "mid": "How would you handle infrastructure bottlenecks during peak usage?",
            "senior": "How would you approach disaster recovery and business continuity planning?",
        },
        "company": {
            "entry": "Why are you excited about DevOps, and what appeals to you about our company?",
            "mid": "How do you balance automation with system reliability?",
            "senior": "How would you contribute to infrastructure excellence and operational stability?",
        },
    },
    "role-035": {  # Cloud Architect
        "behavioral": {
            "entry": "Tell me about a time you designed a cloud solution that solved a business problem.",
            "mid": "Describe a situation where you had to migrate systems to the cloud.",
            "senior": "Tell me about a time you led a cloud transformation initiative.",
        },
        "technical": {
            "entry": "Explain your proficiency with cloud platforms and architectural design.",
            "mid": "Design a multi-region cloud architecture for a global application.",
            "senior": "How would you approach designing cloud systems for enterprise scale and complexity?",
        },
        "situational": {
            "entry": "What would you do if cloud costs exceed budget?",
            "mid": "How would you handle a situation where legacy systems resist cloud migration?",
            "senior": "How would you navigate cloud vendor decisions and multi-cloud strategies?",
        },
        "company": {
            "entry": "Why are you passionate about cloud architecture, and what attracts you to our company?",
            "mid": "How do you balance cost, performance, and security in cloud design?",
            "senior": "How would you shape our cloud strategy and technology roadmap?",
        },
    },
    "role-036": {  # Systems Administrator
        "behavioral": {
            "entry": "Tell me about a time you resolved a critical system issue.",
            "mid": "Describe a situation where you had to manage system upgrades with minimal downtime.",
            "senior": "Tell me about a time you improved system management and reduced operational burden.",
        },
        "technical": {
            "entry": "Explain your proficiency with operating systems, networking, and system management tools.",
            "mid": "How would you design IT infrastructure for a growing organization?",
            "senior": "How would you architect enterprise IT systems for reliability and scalability?",
        },
        "situational": {
            "entry": "What would you do if a critical system fails during business hours?",
            "mid": "How would you handle resource constraints while supporting business needs?",
            "senior": "How would you navigate IT modernization and legacy system retirement?",
        },
        "company": {
            "entry": "Why are you interested in systems administration, and what appeals to you about our company?",
            "mid": "How do you balance security and user productivity?",
            "senior": "How would you contribute to IT excellence and business continuity?",
        },
    },
    "role-037": {  # Consultant
        "behavioral": {
            "entry": "Tell me about a time you provided valuable recommendations to a client.",
            "mid": "Describe a situation where you had to manage expectations with challenging clients.",
            "senior": "Tell me about a time you led a transformational consulting engagement.",
        },
        "technical": {
            "entry": "Explain your approach to problem solving and business analysis.",
            "mid": "Design a consulting proposal to address a client's strategic challenge.",
            "senior": "How would you approach developing insights and recommendations for C-suite executives?",
        },
        "situational": {
            "entry": "What would you do if your initial analysis reveals the client's strategy is flawed?",
            "mid": "How would you handle a situation where client teams resist your recommendations?",
            "senior": "How would you navigate complex organizational dynamics and implement change?",
        },
        "company": {
            "entry": "Why are you excited about consulting, and what appeals to you about our firm?",
            "mid": "How do you balance analytical rigor with pragmatism?",
            "senior": "How would you contribute to our firm's reputation and thought leadership?",
        },
    },
    "role-038": {  # Senior Consultant
        "behavioral": {
            "entry": "Tell me about a time you mentored junior consultants on a project.",
            "mid": "Describe a situation where you led a complex multi-team engagement.",
            "senior": "Tell me about a time you drove strategic impact for a major client.",
        },
        "technical": {
            "entry": "Explain your expertise in frameworks and analytical methodologies.",
            "mid": "Design a comprehensive consulting approach to solve a complex business problem.",
            "senior": "How would you develop strategic recommendations that transform organizational performance?",
        },
        "situational": {
            "entry": "How would you handle disagreement with the client on recommendations?",
            "mid": "How would you manage a high-risk engagement with significant at-stake value?",
            "senior": "How would you approach driving organizational change and building adoption?",
        },
        "company": {
            "entry": "What attracted you to a senior consultant role with our firm?",
            "mid": "How do you develop and mentor the next generation of consultants?",
            "senior": "How would you contribute to growing the firm and developing its capabilities?",
        },
    },
    "role-039": {  # Strategy Analyst
        "behavioral": {
            "entry": "Tell me about a time you influenced strategy through analysis.",
            "mid": "Describe a situation where you had to present findings to senior leadership.",
            "senior": "Tell me about a time you developed strategy recommendations that shaped organizational direction.",
        },
        "technical": {
            "entry": "Explain your approach to market analysis and competitive intelligence.",
            "mid": "Analyze a market opportunity and develop a strategic recommendation.",
            "senior": "How would you approach developing long-term strategic plans?",
        },
        "situational": {
            "entry": "What would you do if your analysis contradicts leadership's current direction?",
            "mid": "How would you handle a situation where strategy execution is failing?",
            "senior": "How would you navigate strategic decisions under uncertainty?",
        },
        "company": {
            "entry": "Why are you interested in strategy work, and what appeals to you about our company?",
            "mid": "How do you balance quantitative analysis with qualitative insights?",
            "senior": "How would you contribute to our strategic success and long-term growth?",
        },
    },
}


async def seed_database():
    """Seed the MongoDB database with all role-specific questions"""
    print("🌱 Starting comprehensive database seeding...")
    print("📊 Generating role-specific questions for all 39 roles...")

    db = db_client

    try:
        industry_dao = QuestionIndustryDAO(db)
        role_dao = QuestionRoleDAO(db)
        question_dao = QuestionDAO(db)

        now = datetime.now(timezone.utc)
        total_questions = 0

        # Seed industries and roles
        print("\n📍 Seeding industries and roles...")
        for industry_uuid, industry_data in INDUSTRIES_AND_ROLES.items():
            # Seed industry
            industry = {
                "uuid": industry_uuid,
                "name": industry_data["name"],
                "icon": industry_data["icon"],
                "description": industry_data["description"],
                "category": industry_data["category"],
                "roles": [role["uuid"] for role in industry_data["roles"]],
                "date_created": now,
                "date_updated": now,
            }

            existing_industry = await db["question_industries"].find_one({"uuid": industry_uuid})
            if not existing_industry:
                await industry_dao.add_industry(industry)
                print(f"  ✓ Added industry: {industry_data['name']}")

            # Seed roles for this industry
            for role in industry_data["roles"]:
                role_data = {
                    "uuid": role["uuid"],
                    "industry_uuid": industry_uuid,
                    "name": role["name"],
                    "description": f"{role['name']} role in {industry_data['name']}",
                    "question_ids": [],
                    "date_created": now,
                    "date_updated": now,
                }

                existing_role = await db["question_roles"].find_one({"uuid": role["uuid"]})
                if not existing_role:
                    await role_dao.add_role(role_data)
                    print(f"    ✓ Added role: {role['name']}")

        # Seed role-specific questions
        print("\n❓ Seeding role-specific questions (12 per role × 39 roles = 468 questions)...")
        for industry_uuid, industry_data in INDUSTRIES_AND_ROLES.items():
            for role in industry_data["roles"]:
                role_uuid = role["uuid"]
                role_name = role["name"]

                # Get role-specific questions
                role_questions_dict = ROLE_SPECIFIC_QUESTIONS.get(role_uuid, {})
                question_id = 1

                for category in ["behavioral", "technical", "situational", "company"]:
                    category_questions = role_questions_dict.get(category, {})

                    for difficulty in ["entry", "mid", "senior"]:
                        prompt = category_questions.get(difficulty, f"Question for {role_name}")

                        question = {
                            "uuid": f"q-{int(role_uuid.replace('role-', '')) * 100 + question_id}",
                            "role_uuid": role_uuid,
                            "category": category,
                            "difficulty": difficulty,
                            "prompt": prompt,
                            "expected_skills": [
                                "Communication",
                                "Problem Solving",
                                "Teamwork",
                            ],
                            "interviewer_guidance": f"Evaluate the candidate's {category} skills and {difficulty}-level competency in the context of a {role_name} role.",
                            "sample_answers": [f"A strong answer should demonstrate {difficulty}-level proficiency in {category} competencies relevant to this {role_name} position."],
                            "date_created": now,
                            "date_updated": now,
                        }

                        existing = await db["questions"].find_one({"uuid": question["uuid"]})
                        if not existing:
                            await question_dao.add_question(question)
                            total_questions += 1

                        question_id += 1

                print(f"    ✓ Added 12 questions for {role_name}")

        print(f"\n✅ Database seeding complete!")
        print(f"\n📊 Summary:")
        print(f"   ✓ Industries: {len(INDUSTRIES_AND_ROLES)}")
        print(f"   ✓ Roles: 39")
        print(f"   ✓ Questions: {total_questions}")
        print(f"\n📋 Coverage:")
        print(f"   ✓ Categories: behavioral, technical, situational, company")
        print(f"   ✓ Difficulties: entry, mid, senior")
        print(f"   ✓ All questions tailored to specific roles and difficulty levels")

    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        raise


async def seed_technical_challenges():
    """Seed technical interview challenges (coding, system design, case studies)"""
    from datetime import datetime, timezone

    db = db_client

    # Coding Challenges - Easy
    EASY_CODING_CHALLENGES = [
        {
            "title": "Two Sum",
            "description": "Given an array of integers, find the two numbers that add up to a target value.",
            "difficulty": "easy",
            "challenge_type": "coding",
            "required_skills": ["Arrays", "Hash Maps"],
            "required_tech_stack": ["Python", "JavaScript", "Java"],
            "time_limit_minutes": 20,
            "tags": ["array", "hash-map", "two-pointer"],
            "source": "template",
            "ai_generated": False,
            "coding_challenge": {
                "title": "Two Sum",
                "description": "Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target.",
                "difficulty": "easy",
                "required_languages": ["Python", "JavaScript", "Java"],
                "required_skills": ["Arrays", "Hash Maps"],
                "time_limit_minutes": 20,
                "constraints": ["1 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9"],
                "example_input": "nums = [2,7,11,15], target = 9",
                "example_output": "[0,1]",
                "test_cases": [
                    {"input": {"nums": [2, 7, 11, 15], "target": 9}, "expected_output": [0, 1], "description": "Basic case", "is_hidden": False},
                    {"input": {"nums": [3, 2, 4], "target": 6}, "expected_output": [1, 2], "description": "Another case", "is_hidden": False}
                ],
                "solution_framework": {
                    "title": "Hash Map Approach",
                    "overview": "Use a hash map to store values and their indices for O(n) solution",
                    "steps": ["Create a hash map", "Iterate through array", "Check if complement exists", "Return indices"],
                    "pseudocode": "hash_map = {}\nfor i, num in enumerate(nums):\n    if target - num in hash_map:\n        return [hash_map[target - num], i]\n    hash_map[num] = i",
                    "time_complexity": "O(n)",
                    "space_complexity": "O(n)",
                    "common_mistakes": ["Using nested loops", "Not handling duplicates correctly"],
                    "alternative_approaches": ["Brute force O(n^2)", "Two pointer on sorted array"],
                    "real_world_correlation": "Recommendation systems use similar pair-finding techniques",
                    "whiteboard_checklist": ["Clarify requirements", "Discuss tradeoffs", "Code clearly"]
                },
                "follow_up_questions": ["What if we need all pairs?", "Can we do O(1) space?"]
            }
        },
        {
            "title": "Reverse String",
            "description": "Reverse a given string in-place.",
            "difficulty": "easy",
            "challenge_type": "coding",
            "required_skills": ["Strings"],
            "required_tech_stack": ["Python", "JavaScript"],
            "time_limit_minutes": 15,
            "tags": ["string", "two-pointer"],
            "source": "template",
            "ai_generated": False,
            "coding_challenge": {
                "title": "Reverse String",
                "description": "Reverse a given string",
                "difficulty": "easy",
                "required_languages": ["Python", "JavaScript"],
                "required_skills": ["Strings"],
                "time_limit_minutes": 15,
                "constraints": ["0 <= s.length <= 10^5"],
                "example_input": "s = 'hello'",
                "example_output": "'olleh'",
                "test_cases": [
                    {"input": {"s": "hello"}, "expected_output": "olleh", "description": "Basic string", "is_hidden": False}
                ],
                "solution_framework": {
                    "title": "Two Pointer Approach",
                    "overview": "Swap characters from both ends moving towards center",
                    "steps": ["Initialize pointers at both ends", "Swap characters", "Move pointers inward"],
                    "time_complexity": "O(n)",
                    "space_complexity": "O(1)",
                    "common_mistakes": ["Forgetting to move pointers"],
                    "real_world_correlation": "String manipulation is fundamental in text processing",
                    "whiteboard_checklist": ["Explain approach", "Code the solution"]
                }
            }
        },
        {
            "title": "Palindrome Check",
            "description": "Check if a string is a palindrome.",
            "difficulty": "easy",
            "challenge_type": "coding",
            "required_skills": ["Strings"],
            "required_tech_stack": ["Python", "JavaScript"],
            "time_limit_minutes": 15,
            "tags": ["string"],
            "source": "template",
            "ai_generated": False,
            "coding_challenge": {
                "title": "Palindrome Check",
                "description": "Check if a string is a palindrome (ignoring spaces and punctuation)",
                "difficulty": "easy",
                "required_languages": ["Python", "JavaScript"],
                "required_skills": ["Strings"],
                "time_limit_minutes": 15,
                "test_cases": [
                    {"input": {"s": "A man, a plan, a canal: Panama"}, "expected_output": True, "description": "Valid palindrome", "is_hidden": False}
                ],
                "solution_framework": {
                    "title": "Two Pointer Approach",
                    "overview": "Compare characters from both ends, ignoring non-alphanumeric",
                    "time_complexity": "O(n)",
                    "space_complexity": "O(1)",
                    "real_world_correlation": "Palindrome detection is used in spell-checking and data validation"
                }
            }
        },
        {
            "title": "Fibonacci Number",
            "description": "Return the nth Fibonacci number.",
            "difficulty": "easy",
            "challenge_type": "coding",
            "required_skills": ["Recursion", "Dynamic Programming"],
            "required_tech_stack": ["Python", "JavaScript", "Java"],
            "time_limit_minutes": 20,
            "tags": ["recursion", "dynamic-programming"],
            "source": "template",
            "ai_generated": False,
            "coding_challenge": {
                "title": "Fibonacci",
                "description": "Return the nth Fibonacci number",
                "difficulty": "easy",
                "required_languages": ["Python", "JavaScript", "Java"],
                "required_skills": ["Recursion", "DP"],
                "time_limit_minutes": 20,
                "test_cases": [
                    {"input": {"n": 6}, "expected_output": 8, "description": "Fib(6) = 8", "is_hidden": False}
                ],
                "solution_framework": {
                    "title": "Dynamic Programming Approach",
                    "overview": "Use memoization to avoid recalculating values",
                    "time_complexity": "O(n)",
                    "space_complexity": "O(n)",
                    "common_mistakes": ["Naive recursion is O(2^n)"],
                    "real_world_correlation": "DP is used in optimization algorithms"
                }
            }
        },
        {
            "title": "Contains Duplicate",
            "description": "Check if array contains duplicate elements.",
            "difficulty": "easy",
            "challenge_type": "coding",
            "required_skills": ["Hash Sets"],
            "required_tech_stack": ["Python", "JavaScript"],
            "time_limit_minutes": 15,
            "tags": ["hash-set", "array"],
            "source": "template",
            "ai_generated": False,
            "coding_challenge": {
                "title": "Contains Duplicate",
                "description": "Check if an array contains any duplicate values",
                "difficulty": "easy",
                "required_languages": ["Python", "JavaScript"],
                "required_skills": ["Hash Sets"],
                "time_limit_minutes": 15,
                "test_cases": [
                    {"input": {"nums": [1, 2, 3, 1]}, "expected_output": True, "description": "Has duplicate", "is_hidden": False}
                ],
                "solution_framework": {
                    "title": "Hash Set Approach",
                    "overview": "Track seen numbers in a set",
                    "time_complexity": "O(n)",
                    "space_complexity": "O(n)",
                    "real_world_correlation": "Duplicate detection is used in data validation"
                }
            }
        },
        {
            "title": "Valid Parentheses",
            "description": "Check if parentheses are balanced in a string.",
            "difficulty": "easy",
            "challenge_type": "coding",
            "required_skills": ["Stack"],
            "required_tech_stack": ["Python", "JavaScript"],
            "time_limit_minutes": 20,
            "tags": ["stack", "string"],
            "source": "template",
            "ai_generated": False,
            "coding_challenge": {
                "title": "Valid Parentheses",
                "description": "Check if brackets are balanced",
                "difficulty": "easy",
                "required_languages": ["Python", "JavaScript"],
                "required_skills": ["Stack"],
                "time_limit_minutes": 20,
                "test_cases": [
                    {"input": {"s": "()"}, "expected_output": True, "description": "Valid", "is_hidden": False}
                ],
                "solution_framework": {
                    "title": "Stack Approach",
                    "overview": "Use stack to match opening and closing brackets",
                    "time_complexity": "O(n)",
                    "space_complexity": "O(n)",
                    "real_world_correlation": "Compiler syntax validation uses this technique"
                }
            }
        },
        {
            "title": "Max Subarray",
            "description": "Find the contiguous subarray with maximum sum.",
            "difficulty": "easy",
            "challenge_type": "coding",
            "required_skills": ["Dynamic Programming"],
            "required_tech_stack": ["Python", "JavaScript"],
            "time_limit_minutes": 25,
            "tags": ["dynamic-programming", "array"],
            "source": "template",
            "ai_generated": False,
            "coding_challenge": {
                "title": "Maximum Subarray",
                "description": "Find the contiguous subarray with the largest sum (Kadane's Algorithm)",
                "difficulty": "easy",
                "required_languages": ["Python", "JavaScript"],
                "required_skills": ["DP"],
                "time_limit_minutes": 25,
                "test_cases": [
                    {"input": {"nums": [-2, 1, -3, 4, -1, 2, 1, -5, 4]}, "expected_output": 6, "description": "[4, -1, 2, 1]", "is_hidden": False}
                ],
                "solution_framework": {
                    "title": "Kadane's Algorithm",
                    "overview": "Keep track of max sum ending at current position",
                    "time_complexity": "O(n)",
                    "space_complexity": "O(1)",
                    "real_world_correlation": "Stock trading: find best time to buy and sell"
                }
            }
        },
        {
            "title": "Missing Number",
            "description": "Find the missing number in an array of n unique numbers from 1 to n.",
            "difficulty": "easy",
            "challenge_type": "coding",
            "required_skills": ["Math", "Arrays"],
            "required_tech_stack": ["Python", "JavaScript"],
            "time_limit_minutes": 15,
            "tags": ["array", "math"],
            "source": "template",
            "ai_generated": False,
            "coding_challenge": {
                "title": "Missing Number",
                "description": "Find the single missing number in array containing 0 to n",
                "difficulty": "easy",
                "required_languages": ["Python", "JavaScript"],
                "required_skills": ["Math"],
                "time_limit_minutes": 15,
                "test_cases": [
                    {"input": {"nums": [3, 0, 1]}, "expected_output": 2, "description": "Missing 2", "is_hidden": False}
                ],
                "solution_framework": {
                    "title": "XOR or Math Approach",
                    "overview": "Use XOR or sum formula",
                    "time_complexity": "O(n)",
                    "space_complexity": "O(1)",
                    "real_world_correlation": "Data integrity checking in distributed systems"
                }
            }
        },
        {
            "title": "Merge Two Sorted Lists",
            "description": "Merge two sorted arrays into one sorted array.",
            "difficulty": "easy",
            "challenge_type": "coding",
            "required_skills": ["Arrays", "Two Pointers"],
            "required_tech_stack": ["Python", "JavaScript"],
            "time_limit_minutes": 20,
            "tags": ["array", "two-pointer", "merge"],
            "source": "template",
            "ai_generated": False,
            "coding_challenge": {
                "title": "Merge Sorted Array",
                "description": "Merge two sorted arrays in-place",
                "difficulty": "easy",
                "required_languages": ["Python", "JavaScript"],
                "required_skills": ["Arrays", "Two Pointers"],
                "time_limit_minutes": 20,
                "test_cases": [
                    {"input": {"nums1": [1, 2, 3], "nums2": [2, 5, 6]}, "expected_output": [1, 2, 2, 3, 5, 6], "description": "Merge sorted", "is_hidden": False}
                ],
                "solution_framework": {
                    "title": "Two Pointer Approach",
                    "overview": "Compare elements from both arrays and place smaller one",
                    "time_complexity": "O(n + m)",
                    "space_complexity": "O(1)",
                    "real_world_correlation": "Merge step in Merge Sort, database query optimization"
                }
            }
        },
        {
            "title": "First Unique Character",
            "description": "Find the first unique character in a string.",
            "difficulty": "easy",
            "challenge_type": "coding",
            "required_skills": ["Hash Maps"],
            "required_tech_stack": ["Python", "JavaScript"],
            "time_limit_minutes": 15,
            "tags": ["hash-map", "string"],
            "source": "template",
            "ai_generated": False,
            "coding_challenge": {
                "title": "First Unique Character",
                "description": "Find the index of first non-repeating character",
                "difficulty": "easy",
                "required_languages": ["Python", "JavaScript"],
                "required_skills": ["Hash Maps"],
                "time_limit_minutes": 15,
                "test_cases": [
                    {"input": {"s": "leetcode"}, "expected_output": 0, "description": "l is first unique", "is_hidden": False}
                ],
                "solution_framework": {
                    "title": "Hash Map Approach",
                    "overview": "Count character frequencies, find first with count 1",
                    "time_complexity": "O(n)",
                    "space_complexity": "O(1)",
                    "real_world_correlation": "Text analysis and compression algorithms"
                }
            }
        }
    ]

    # Medium Challenges (10)
    MEDIUM_CODING_CHALLENGES = [
        {
            "title": "Longest Substring Without Repeating Characters",
            "description": "Find the length of the longest substring without repeating characters.",
            "difficulty": "medium",
            "challenge_type": "coding",
            "required_skills": ["Strings", "Sliding Window"],
            "required_tech_stack": ["Python", "JavaScript", "Java"],
            "time_limit_minutes": 30,
            "tags": ["string", "sliding-window"],
            "source": "template",
            "ai_generated": False,
            "coding_challenge": {
                "title": "Longest Substring Without Repeating",
                "description": "Find length of longest substring with unique characters",
                "difficulty": "medium",
                "required_languages": ["Python", "JavaScript", "Java"],
                "required_skills": ["Strings", "Sliding Window"],
                "time_limit_minutes": 30,
                "test_cases": [
                    {"input": {"s": "abcabcbb"}, "expected_output": 3, "description": "abc", "is_hidden": False}
                ],
                "solution_framework": {
                    "title": "Sliding Window",
                    "overview": "Use two pointers to track window of unique characters",
                    "time_complexity": "O(n)",
                    "space_complexity": "O(min(m,n))",
                    "real_world_correlation": "Token identification in compilers"
                }
            }
        },
        {
            "title": "3Sum",
            "description": "Find all unique triplets that sum to zero.",
            "difficulty": "medium",
            "challenge_type": "coding",
            "required_skills": ["Arrays", "Sorting"],
            "required_tech_stack": ["Python", "JavaScript"],
            "time_limit_minutes": 35,
            "tags": ["array", "sorting"],
            "source": "template",
            "ai_generated": False,
            "coding_challenge": {
                "title": "3Sum",
                "description": "Find all unique triplets that sum to 0",
                "difficulty": "medium",
                "required_languages": ["Python", "JavaScript"],
                "required_skills": ["Arrays", "Sorting"],
                "time_limit_minutes": 35,
                "test_cases": [
                    {"input": {"nums": [-1, 0, 1, 2, -1, -4]}, "expected_output": [[-1, -1, 2], [-1, 0, 1]], "description": "Unique triplets", "is_hidden": False}
                ],
                "solution_framework": {
                    "title": "Sort + Two Pointer",
                    "overview": "Sort array, fix one element, use two pointers for remainder",
                    "time_complexity": "O(n^2)",
                    "space_complexity": "O(1)",
                    "real_world_correlation": "Portfolio optimization in finance"
                }
            }
        },
        {
            "title": "Binary Tree Level Order Traversal",
            "description": "Traverse a binary tree level by level.",
            "difficulty": "medium",
            "challenge_type": "coding",
            "required_skills": ["Trees", "BFS"],
            "required_tech_stack": ["Python", "JavaScript"],
            "time_limit_minutes": 30,
            "tags": ["tree", "bfs", "queue"],
            "source": "template",
            "ai_generated": False,
            "coding_challenge": {
                "title": "Level Order Traversal",
                "description": "Return nodes at each level of a binary tree",
                "difficulty": "medium",
                "required_languages": ["Python", "JavaScript"],
                "required_skills": ["Trees", "BFS"],
                "time_limit_minutes": 30,
                "solution_framework": {
                    "title": "BFS with Queue",
                    "overview": "Use queue to process nodes level by level",
                    "time_complexity": "O(n)",
                    "space_complexity": "O(w)",
                    "real_world_correlation": "Graph algorithms in social networks"
                }
            }
        },
        {
            "title": "LRU Cache",
            "description": "Implement an LRU (Least Recently Used) cache.",
            "difficulty": "medium",
            "challenge_type": "coding",
            "required_skills": ["Hash Maps", "Linked Lists"],
            "required_tech_stack": ["Python", "Java"],
            "time_limit_minutes": 40,
            "tags": ["hash-map", "linked-list"],
            "source": "template",
            "ai_generated": False,
            "coding_challenge": {
                "title": "LRU Cache",
                "description": "Design and implement an LRU cache with get and put operations",
                "difficulty": "medium",
                "required_languages": ["Python", "Java"],
                "required_skills": ["Hash Maps", "Linked Lists"],
                "time_limit_minutes": 40,
                "solution_framework": {
                    "title": "Hash Map + Doubly Linked List",
                    "overview": "Combine hash map for O(1) access with linked list for ordering",
                    "time_complexity": "O(1) for get/put",
                    "space_complexity": "O(capacity)",
                    "real_world_correlation": "CPU caching, web server caching, CDN optimization"
                }
            }
        },
        {
            "title": "Word Ladder",
            "description": "Find the shortest path between two words by changing one letter at a time.",
            "difficulty": "medium",
            "challenge_type": "coding",
            "required_skills": ["Graphs", "BFS"],
            "required_tech_stack": ["Python", "JavaScript"],
            "time_limit_minutes": 40,
            "tags": ["graph", "bfs"],
            "source": "template",
            "ai_generated": False,
            "coding_challenge": {
                "title": "Word Ladder",
                "description": "Find shortest transformation sequence from start to end word",
                "difficulty": "medium",
                "required_languages": ["Python", "JavaScript"],
                "required_skills": ["Graphs", "BFS"],
                "time_limit_minutes": 40,
                "solution_framework": {
                    "title": "BFS Approach",
                    "overview": "Model as graph where edges connect words differing by one letter",
                    "time_complexity": "O(n * l^2)",
                    "space_complexity": "O(n)",
                    "real_world_correlation": "Spell checking, autocorrection algorithms"
                }
            }
        },
        {
            "title": "Coin Change",
            "description": "Find minimum number of coins to make a given amount.",
            "difficulty": "medium",
            "challenge_type": "coding",
            "required_skills": ["Dynamic Programming"],
            "required_tech_stack": ["Python", "JavaScript"],
            "time_limit_minutes": 35,
            "tags": ["dynamic-programming"],
            "source": "template",
            "ai_generated": False,
            "coding_challenge": {
                "title": "Coin Change",
                "description": "Find fewest coins needed to make target amount",
                "difficulty": "medium",
                "required_languages": ["Python", "JavaScript"],
                "required_skills": ["DP"],
                "time_limit_minutes": 35,
                "solution_framework": {
                    "title": "DP Bottom-Up",
                    "overview": "Build up solutions for amounts from 0 to target",
                    "time_complexity": "O(n * amount)",
                    "space_complexity": "O(amount)",
                    "real_world_correlation": "Vending machines, payment processing"
                }
            }
        },
        {
            "title": "Rotate Matrix",
            "description": "Rotate an n×n matrix 90 degrees clockwise in-place.",
            "difficulty": "medium",
            "challenge_type": "coding",
            "required_skills": ["Arrays", "Matrix"],
            "required_tech_stack": ["Python", "JavaScript"],
            "time_limit_minutes": 30,
            "tags": ["array", "matrix"],
            "source": "template",
            "ai_generated": False,
            "coding_challenge": {
                "title": "Rotate Matrix",
                "description": "Rotate an n×n matrix 90 degrees clockwise in-place",
                "difficulty": "medium",
                "required_languages": ["Python", "JavaScript"],
                "required_skills": ["Arrays", "Matrix"],
                "time_limit_minutes": 30,
                "solution_framework": {
                    "title": "Layer-by-layer rotation",
                    "overview": "Rotate matrix layer by layer from outside to inside",
                    "time_complexity": "O(n^2)",
                    "space_complexity": "O(1)",
                    "real_world_correlation": "Image processing and computer graphics"
                }
            }
        },
        {
            "title": "Backtracking: Combinations",
            "description": "Generate all combinations of k elements from n elements.",
            "difficulty": "medium",
            "challenge_type": "coding",
            "required_skills": ["Backtracking", "Recursion"],
            "required_tech_stack": ["Python", "JavaScript"],
            "time_limit_minutes": 35,
            "tags": ["backtracking", "recursion"],
            "source": "template",
            "ai_generated": False,
            "coding_challenge": {
                "title": "Combinations",
                "description": "Generate all k-length combinations of 1..n",
                "difficulty": "medium",
                "required_languages": ["Python", "JavaScript"],
                "required_skills": ["Backtracking"],
                "time_limit_minutes": 35,
                "solution_framework": {
                    "title": "Backtracking",
                    "overview": "Recursively build combinations by choosing/not choosing elements",
                    "time_complexity": "O(C(n,k))",
                    "space_complexity": "O(k)",
                    "real_world_correlation": "Scheduling algorithms, game tree search"
                }
            }
        },
        {
            "title": "Decode String",
            "description": "Decode a string encoded with numbers and brackets.",
            "difficulty": "medium",
            "challenge_type": "coding",
            "required_skills": ["Stack", "Strings"],
            "required_tech_stack": ["Python", "JavaScript"],
            "time_limit_minutes": 30,
            "tags": ["stack", "string"],
            "source": "template",
            "ai_generated": False,
            "coding_challenge": {
                "title": "Decode String",
                "description": "Decode a string like '3[a2[c]]' to 'accaccacc'",
                "difficulty": "medium",
                "required_languages": ["Python", "JavaScript"],
                "required_skills": ["Stack"],
                "time_limit_minutes": 30,
                "solution_framework": {
                    "title": "Stack-based approach",
                    "overview": "Use stack to handle nested encodings",
                    "time_complexity": "O(max_depth * n)",
                    "space_complexity": "O(max_depth)",
                    "real_world_correlation": "Compression algorithms, template processing"
                }
            }
        },
        {
            "title": "Graph Valid Tree",
            "description": "Check if a graph is a valid tree.",
            "difficulty": "medium",
            "challenge_type": "coding",
            "required_skills": ["Graphs", "Union-Find"],
            "required_tech_stack": ["Python", "JavaScript"],
            "time_limit_minutes": 35,
            "tags": ["graph", "union-find"],
            "source": "template",
            "ai_generated": False,
            "coding_challenge": {
                "title": "Valid Tree",
                "description": "Check if undirected graph is a valid tree",
                "difficulty": "medium",
                "required_languages": ["Python", "JavaScript"],
                "required_skills": ["Graphs", "Union-Find"],
                "time_limit_minutes": 35,
                "solution_framework": {
                    "title": "Union-Find Approach",
                    "overview": "Use union-find to detect cycles",
                    "time_complexity": "O(n * α(n))",
                    "space_complexity": "O(n)",
                    "real_world_correlation": "Network topology verification, social networks"
                }
            }
        }
    ]

    # Hard Challenges (10)
    HARD_CODING_CHALLENGES = [
        {
            "title": "Serialize and Deserialize Binary Tree",
            "description": "Serialize a binary tree and deserialize it back.",
            "difficulty": "hard",
            "challenge_type": "coding",
            "required_skills": ["Trees", "Design"],
            "required_tech_stack": ["Python", "Java"],
            "time_limit_minutes": 45,
            "tags": ["tree", "serialization"],
            "source": "template",
            "ai_generated": False,
            "coding_challenge": {
                "title": "Serialize/Deserialize Tree",
                "description": "Convert tree to string and back",
                "difficulty": "hard",
                "required_languages": ["Python", "Java"],
                "required_skills": ["Trees", "Design"],
                "time_limit_minutes": 45,
                "solution_framework": {
                    "title": "Pre-order Traversal approach",
                    "overview": "Use pre-order traversal with markers for null nodes",
                    "time_complexity": "O(n)",
                    "space_complexity": "O(n)",
                    "real_world_correlation": "Message serialization in distributed systems, database storage"
                }
            }
        },
        {
            "title": "Word Ladder II",
            "description": "Find all shortest transformation sequences between two words.",
            "difficulty": "hard",
            "challenge_type": "coding",
            "required_skills": ["Graphs", "Backtracking", "BFS"],
            "required_tech_stack": ["Python"],
            "time_limit_minutes": 50,
            "tags": ["graph", "backtracking", "bfs"],
            "source": "template",
            "ai_generated": False,
            "coding_challenge": {
                "title": "Word Ladder II",
                "description": "Find all shortest transformation sequences",
                "difficulty": "hard",
                "required_languages": ["Python"],
                "required_skills": ["Graphs", "Backtracking", "BFS"],
                "time_limit_minutes": 50,
                "solution_framework": {
                    "title": "BFS + Backtracking",
                    "overview": "Use BFS to find levels, then backtrack to build paths",
                    "time_complexity": "O(n * 26^l)",
                    "space_complexity": "O(n)",
                    "real_world_correlation": "Search algorithm optimization"
                }
            }
        },
        {
            "title": "Median of Two Sorted Arrays",
            "description": "Find median of two sorted arrays in O(log(min(m,n))) time.",
            "difficulty": "hard",
            "challenge_type": "coding",
            "required_skills": ["Binary Search"],
            "required_tech_stack": ["Python", "Java"],
            "time_limit_minutes": 50,
            "tags": ["binary-search"],
            "source": "template",
            "ai_generated": False,
            "coding_challenge": {
                "title": "Median Two Arrays",
                "description": "Find median in O(log(min(m,n))) time",
                "difficulty": "hard",
                "required_languages": ["Python", "Java"],
                "required_skills": ["Binary Search"],
                "time_limit_minutes": 50,
                "solution_framework": {
                    "title": "Binary Search approach",
                    "overview": "Partition arrays to find median",
                    "time_complexity": "O(log(min(m,n)))",
                    "space_complexity": "O(1)",
                    "real_world_correlation": "Statistical analysis, database queries"
                }
            }
        },
        {
            "title": "Trapping Rain Water",
            "description": "Calculate how much rain water can be trapped between elevation heights.",
            "difficulty": "hard",
            "challenge_type": "coding",
            "required_skills": ["Arrays", "Two Pointers"],
            "required_tech_stack": ["Python", "JavaScript"],
            "time_limit_minutes": 45,
            "tags": ["array", "two-pointer"],
            "source": "template",
            "ai_generated": False,
            "coding_challenge": {
                "title": "Trapping Rain",
                "description": "Calculate trapped rainwater between elevations",
                "difficulty": "hard",
                "required_languages": ["Python", "JavaScript"],
                "required_skills": ["Arrays", "Two Pointers"],
                "time_limit_minutes": 45,
                "solution_framework": {
                    "title": "Two Pointer approach",
                    "overview": "Track max heights from both sides",
                    "time_complexity": "O(n)",
                    "space_complexity": "O(1)",
                    "real_world_correlation": "Terrain analysis, water resource management"
                }
            }
        },
        {
            "title": "Edit Distance",
            "description": "Find minimum edits (insert, delete, replace) to transform one string to another.",
            "difficulty": "hard",
            "challenge_type": "coding",
            "required_skills": ["Dynamic Programming", "Strings"],
            "required_tech_stack": ["Python"],
            "time_limit_minutes": 45,
            "tags": ["dynamic-programming", "string"],
            "source": "template",
            "ai_generated": False,
            "coding_challenge": {
                "title": "Edit Distance (Levenshtein)",
                "description": "Minimum operations to transform word1 to word2",
                "difficulty": "hard",
                "required_languages": ["Python"],
                "required_skills": ["DP"],
                "time_limit_minutes": 45,
                "solution_framework": {
                    "title": "DP 2D Table",
                    "overview": "Build table of minimum edits for substrings",
                    "time_complexity": "O(m*n)",
                    "space_complexity": "O(m*n)",
                    "real_world_correlation": "Spell checking, DNA sequence alignment, plagiarism detection"
                }
            }
        },
        {
            "title": "Largest Rectangle in Histogram",
            "description": "Find the largest rectangle in a histogram.",
            "difficulty": "hard",
            "challenge_type": "coding",
            "required_skills": ["Stack", "Arrays"],
            "required_tech_stack": ["Python", "Java"],
            "time_limit_minutes": 45,
            "tags": ["stack", "array"],
            "source": "template",
            "ai_generated": False,
            "coding_challenge": {
                "title": "Largest Rectangle",
                "description": "Find largest rectangle area in histogram",
                "difficulty": "hard",
                "required_languages": ["Python", "Java"],
                "required_skills": ["Stack"],
                "time_limit_minutes": 45,
                "solution_framework": {
                    "title": "Monotonic Stack",
                    "overview": "Use stack to track potential rectangles",
                    "time_complexity": "O(n)",
                    "space_complexity": "O(n)",
                    "real_world_correlation": "Graphics rendering, warehouse optimization"
                }
            }
        },
        {
            "title": "Critical Connections (Bridges)",
            "description": "Find all critical connections in a network (bridges in a graph).",
            "difficulty": "hard",
            "challenge_type": "coding",
            "required_skills": ["Graphs", "DFS", "Tarjan's Algorithm"],
            "required_tech_stack": ["Python"],
            "time_limit_minutes": 50,
            "tags": ["graph", "dfs"],
            "source": "template",
            "ai_generated": False,
            "coding_challenge": {
                "title": "Critical Connections",
                "description": "Find bridge edges that disconnect the graph",
                "difficulty": "hard",
                "required_languages": ["Python"],
                "required_skills": ["Graphs", "DFS"],
                "time_limit_minutes": 50,
                "solution_framework": {
                    "title": "Tarjan's Algorithm",
                    "overview": "Use DFS with discovery/low times to find bridges",
                    "time_complexity": "O(n + e)",
                    "space_complexity": "O(n)",
                    "real_world_correlation": "Network robustness analysis, infrastructure planning"
                }
            }
        },
        {
            "title": "Burst Balloons",
            "description": "Maximize coins earned by bursting balloons in optimal order.",
            "difficulty": "hard",
            "challenge_type": "coding",
            "required_skills": ["Dynamic Programming"],
            "required_tech_stack": ["Python"],
            "time_limit_minutes": 50,
            "tags": ["dynamic-programming"],
            "source": "template",
            "ai_generated": False,
            "coding_challenge": {
                "title": "Burst Balloons",
                "description": "Maximize reward by bursting balloons optimally",
                "difficulty": "hard",
                "required_languages": ["Python"],
                "required_skills": ["DP"],
                "time_limit_minutes": 50,
                "solution_framework": {
                    "title": "Reverse DP approach",
                    "overview": "Think of last balloon to burst instead of first",
                    "time_complexity": "O(n^3)",
                    "space_complexity": "O(n^2)",
                    "real_world_correlation": "Game theory, optimization under constraints"
                }
            }
        },
        {
            "title": "Regular Expression Matching",
            "description": "Implement regex with '.' (any char) and '*' (0+ repetitions) support.",
            "difficulty": "hard",
            "challenge_type": "coding",
            "required_skills": ["Dynamic Programming", "Strings"],
            "required_tech_stack": ["Python"],
            "time_limit_minutes": 50,
            "tags": ["dynamic-programming", "string"],
            "source": "template",
            "ai_generated": False,
            "coding_challenge": {
                "title": "Regex Matching",
                "description": "Match string with regex pattern (. and *)",
                "difficulty": "hard",
                "required_languages": ["Python"],
                "required_skills": ["DP"],
                "time_limit_minutes": 50,
                "solution_framework": {
                    "title": "DP 2D Table",
                    "overview": "Build table tracking pattern matches",
                    "time_complexity": "O(m*n)",
                    "space_complexity": "O(m*n)",
                    "real_world_correlation": "Text processing, parsing, validation engines"
                }
            }
        },
        {
            "title": "Sliding Window Maximum",
            "description": "Find maximum in each sliding window of an array.",
            "difficulty": "hard",
            "challenge_type": "coding",
            "required_skills": ["Deque", "Sliding Window"],
            "required_tech_stack": ["Python", "Java"],
            "time_limit_minutes": 45,
            "tags": ["sliding-window", "deque"],
            "source": "template",
            "ai_generated": False,
            "coding_challenge": {
                "title": "Sliding Max",
                "description": "Find maximum in each k-window",
                "difficulty": "hard",
                "required_languages": ["Python", "Java"],
                "required_skills": ["Deque"],
                "time_limit_minutes": 45,
                "solution_framework": {
                    "title": "Deque approach",
                    "overview": "Use deque to maintain decreasing elements",
                    "time_complexity": "O(n)",
                    "space_complexity": "O(k)",
                    "real_world_correlation": "Time series analysis, stock moving averages"
                }
            }
        }
    ]

    try:
        collection = db.get_collection("technical_challenges")
        now = datetime.now(timezone.utc)

        print("\n[*] Seeding Technical Coding Challenges...")

        # Insert Easy challenges
        for challenge in EASY_CODING_CHALLENGES:
            challenge["uuid"] = ""  # Will be set by application
            challenge["created_at"] = now
            challenge["updated_at"] = now
            challenge["ai_generated"] = False

            existing = await collection.find_one({"title": challenge["title"]})
            if not existing:
                await collection.insert_one(challenge)

        print(f"  [+] Added {len(EASY_CODING_CHALLENGES)} Easy Challenges")

        # Insert Medium challenges
        for challenge in MEDIUM_CODING_CHALLENGES:
            challenge["uuid"] = ""
            challenge["created_at"] = now
            challenge["updated_at"] = now
            challenge["ai_generated"] = False

            existing = await collection.find_one({"title": challenge["title"]})
            if not existing:
                await collection.insert_one(challenge)

        print(f"  [+] Added {len(MEDIUM_CODING_CHALLENGES)} Medium Challenges")

        # Insert Hard challenges
        for challenge in HARD_CODING_CHALLENGES:
            challenge["uuid"] = ""
            challenge["created_at"] = now
            challenge["updated_at"] = now
            challenge["ai_generated"] = False

            existing = await collection.find_one({"title": challenge["title"]})
            if not existing:
                await collection.insert_one(challenge)

        print(f"  [+] Added {len(HARD_CODING_CHALLENGES)} Hard Challenges")
        total = len(EASY_CODING_CHALLENGES) + len(MEDIUM_CODING_CHALLENGES) + len(HARD_CODING_CHALLENGES)
        print(f"\n[OK] Technical Challenges seeding complete! ({total} total)")

    except Exception as e:
        print(f"[ERROR] Error seeding technical challenges: {e}")
        raise


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "challenges":
        asyncio.run(seed_technical_challenges())
    else:
        asyncio.run(seed_database())
