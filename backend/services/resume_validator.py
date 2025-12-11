"""
Resume Validation Service
Provides comprehensive validation and ATS scoring for resumes
Related to UC-053: Resume Preview and Validation
"""

import re
from typing import Dict, List, Tuple


class ResumeValidator:
    """Validate resume data and provide feedback"""

    # Common misspellings dictionary
    COMMON_MISSPELLINGS = {
        'achivement': 'achievement',
        'responsibilty': 'responsibility',
        'occured': 'occurred',
        'recieved': 'received',
        'wich': 'which',
        'exprience': 'experience',
        'prefessional': 'professional',
        'comunication': 'communication',
        'langauge': 'language',
        'developement': 'development',
        'managment': 'management',
        'analyiss': 'analysis',
        'seperate': 'separate',
    }

    # ATS-friendly keywords (high value)
    ATS_KEYWORDS = {
        'python', 'javascript', 'java', 'sql', 'react', 'angular', 'node',
        'aws', 'azure', 'gcp', 'kubernetes', 'docker', 'git', 'agile',
        'scrum', 'leadership', 'communication', 'problem-solving',
        'project management', 'data analysis', 'machine learning',
        'full-stack', 'frontend', 'backend', 'api', 'rest', 'graphql',
        'testing', 'ci/cd', 'devops', 'microservices', 'database'
    }

    # Action verbs (strong resume starters)
    ACTION_VERBS = {
        'achieved', 'built', 'created', 'designed', 'developed', 'directed',
        'established', 'expanded', 'implemented', 'improved', 'increased',
        'led', 'launched', 'managed', 'optimized', 'orchestrated', 'oversaw',
        'pioneered', 'redesigned', 'streamlined', 'strengthened', 'transformed',
        'accelerated', 'collaborated', 'coordinated', 'delivered', 'enhanced',
        'facilitated', 'generated', 'influenced', 'initiated', 'innovated'
    }

    @staticmethod
    def validate_resume(resume_data: dict) -> dict:
        """
        Comprehensive resume validation

        Args:
            resume_data: Resume object from MongoDB

        Returns:
            {
                'valid': bool,
                'score': 0-100,
                'errors': [list of critical errors],
                'warnings': [list of warnings],
                'suggestions': [list of improvement suggestions],
                'missing_sections': [list of incomplete sections],
                'metrics': {page_count, word_count, character_count}
            }
        """
        errors = []
        warnings = []
        suggestions = []
        missing_sections = []

        # 1. Validate contact info
        contact_errors = ResumeValidator._validate_contact(resume_data.get('contact', {}))
        errors.extend(contact_errors)

        # 2. Validate required sections
        required_errors, missing = ResumeValidator._validate_required_sections(resume_data)
        errors.extend(required_errors)
        missing_sections.extend(missing)

        # 3. Validate dates
        date_errors = ResumeValidator._validate_dates(resume_data.get('experience', []))
        errors.extend(date_errors)

        # 4. Check spelling
        spell_warnings = ResumeValidator._check_spelling(resume_data)
        warnings.extend(spell_warnings)

        # 5. Analyze content
        content_suggestions, metrics = ResumeValidator._analyze_content(resume_data)
        suggestions.extend(content_suggestions)

        # 6. Check for action verbs
        verb_warnings = ResumeValidator._check_action_verbs(resume_data)
        warnings.extend(verb_warnings)

        # 7. Calculate ATS score
        ats_score = ResumeValidator._calculate_ats_score(resume_data, len(errors), len(warnings))

        # 8. Overall validation score
        validation_score = ResumeValidator._calculate_validation_score(
            len(errors),
            len(warnings),
            missing_sections,
            metrics
        )

        return {
            'valid': len(errors) == 0,
            'score': validation_score,
            'ats_score': ats_score,
            'errors': errors,
            'warnings': warnings,
            'suggestions': suggestions,
            'missing_sections': missing_sections,
            'metrics': metrics,
            'summary': ResumeValidator._generate_summary(
                validation_score, ats_score, errors, warnings, suggestions
            )
        }

    @staticmethod
    def _validate_contact(contact: dict) -> List[str]:
        """Validate contact information"""
        errors = []

        if not contact:
            errors.append('Contact information is missing')
            return errors

        # Check name
        if not contact.get('name', '').strip():
            errors.append('Name is required')

        # Check email
        email = contact.get('email', '').strip()
        if not email:
            errors.append('Email address is required')
        elif not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            errors.append(f'Email format is invalid: {email}')

        # Check phone (basic format)
        phone = contact.get('phone', '').strip()
        if phone and not re.match(r'^[\d\-\+\(\)\s]{10,}$', phone):
            errors.append(f'Phone format appears invalid: {phone}')

        return errors

    @staticmethod
    def _validate_required_sections(resume_data: dict) -> Tuple[List[str], List[str]]:
        """Validate that required sections exist with data"""
        errors = []
        missing = []

        # Resume must have at least name
        if not resume_data.get('contact', {}).get('name'):
            errors.append('Resume must have a name in contact info')

        # Check for minimum sections
        has_experience = bool(resume_data.get('experience', []))
        has_education = bool(resume_data.get('education', []))
        has_skills = bool(resume_data.get('skills', []))

        if not has_experience:
            missing.append('experience')
        if not has_education:
            missing.append('education')
        if not has_skills:
            missing.append('skills')

        # Warn if missing 2+ sections
        if len(missing) >= 2:
            errors.append(f'Resume should include at least experience and education sections')

        return errors, missing

    @staticmethod
    def _validate_dates(experience: List[dict]) -> List[str]:
        """Validate work experience dates"""
        errors = []

        for idx, exp in enumerate(experience, 1):
            start_date = exp.get('start_date', '').strip()
            end_date = exp.get('end_date', '').strip()

            # Check date format (YYYY-MM or YYYY)
            date_pattern = r'^\d{4}(-\d{2})?$'
            if start_date and not re.match(date_pattern, start_date):
                errors.append(f'Experience {idx}: Invalid start date format (use YYYY or YYYY-MM)')
            if end_date and not re.match(date_pattern, end_date):
                errors.append(f'Experience {idx}: Invalid end date format (use YYYY or YYYY-MM)')

            # Check that end_date >= start_date
            if start_date and end_date:
                try:
                    # Simple string comparison works for YYYY-MM format
                    if end_date < start_date:
                        errors.append(f'Experience {idx}: End date is before start date')
                except:
                    pass

        return errors

    @staticmethod
    def _check_spelling(resume_data: dict) -> List[str]:
        """Check for common misspellings"""
        warnings = []
        text_to_check = []

        # Collect all text content
        if resume_data.get('contact', {}).get('name'):
            text_to_check.append(resume_data['contact']['name'])
        if resume_data.get('summary'):
            text_to_check.append(resume_data['summary'])

        for exp in resume_data.get('experience', []):
            if exp.get('description'):
                text_to_check.append(exp['description'])

        # Check for misspellings
        full_text = ' '.join(text_to_check).lower()
        found_misspellings = []

        for misspelling, correct in ResumeValidator.COMMON_MISSPELLINGS.items():
            if misspelling in full_text:
                found_misspellings.append((misspelling, correct))

        if found_misspellings:
            for misspelled, correct in found_misspellings:
                warnings.append(f"Possible misspelling: '{misspelled}' → '{correct}'")

        return warnings

    @staticmethod
    def _check_action_verbs(resume_data: dict) -> List[str]:
        """Check for strong action verbs in experience descriptions"""
        warnings = []

        experience_items = resume_data.get('experience', [])
        if not experience_items:
            return warnings

        weak_descriptions = []
        for idx, exp in enumerate(experience_items, 1):
            desc = exp.get('description', '').lower()
            if desc:
                # Check if description starts with action verb
                words = desc.split()
                if words and words[0] not in ResumeValidator.ACTION_VERBS:
                    weak_descriptions.append(idx)

        if weak_descriptions:
            warnings.append(
                f"Experience items {weak_descriptions}: Consider starting with action verbs "
                f"(e.g., 'Achieved', 'Built', 'Improved')"
            )

        return warnings

    @staticmethod
    def _analyze_content(resume_data: dict) -> Tuple[List[str], dict]:
        """Analyze resume content and provide suggestions"""
        suggestions = []

        # Count words and characters
        text_parts = []
        if resume_data.get('summary'):
            text_parts.append(resume_data['summary'])
        for exp in resume_data.get('experience', []):
            if exp.get('description'):
                text_parts.append(exp['description'])
        for edu in resume_data.get('education', []):
            if edu.get('description'):
                text_parts.append(edu['description'])

        full_text = ' '.join(text_parts)
        word_count = len(full_text.split())
        char_count = len(full_text)

        # Estimate page count (250 words per page)
        estimated_pages = max(1, (word_count + 249) // 250)

        metrics = {
            'word_count': word_count,
            'character_count': char_count,
            'estimated_pages': estimated_pages,
            'experience_count': len(resume_data.get('experience', [])),
            'education_count': len(resume_data.get('education', [])),
            'skills_count': len(resume_data.get('skills', [])),
        }

        # Check summary length
        summary = resume_data.get('summary', '')
        if summary:
            summary_words = len(summary.split())
            if summary_words > 150:
                suggestions.append(
                    f'Professional summary is {summary_words} words. '
                    'Consider shortening to 100-150 words for maximum impact.'
                )
        else:
            suggestions.append('Add a professional summary to increase recruiter engagement')

        # Check experience descriptions
        for idx, exp in enumerate(resume_data.get('experience', []), 1):
            desc = exp.get('description', '')
            if not desc:
                suggestions.append(f'Experience {idx}: Add detailed description of accomplishments')
            elif len(desc.split()) < 3:
                suggestions.append(
                    f'Experience {idx}: Description is very brief. '
                    'Add more details about your impact and achievements.'
                )

        # Check skills
        skills = resume_data.get('skills', [])
        if not skills:
            suggestions.append('Add relevant technical and soft skills')
        elif len(skills) < 5:
            suggestions.append(
                f'You have {len(skills)} skills. Consider adding 5-10 key skills '
                'relevant to your target roles.'
            )
        elif len(skills) > 20:
            suggestions.append(
                f'You have {len(skills)} skills. Recruiters typically scan 5-10. '
                'Focus on your top skills relevant to the position.'
            )

        # Check page length
        if estimated_pages > 2:
            suggestions.append(
                f'Resume appears to be ~{estimated_pages} pages. '
                'Most recruiters prefer 1-2 pages. Consider condensing.'
            )

        return suggestions, metrics

    @staticmethod
    def _calculate_ats_score(resume_data: dict, error_count: int, warning_count: int) -> int:
        """
        Calculate ATS (Applicant Tracking System) compatibility score 0-100

        Based on:
        - Formatting (no complex formatting that breaks ATS parsing)
        - Keywords (presence of tech keywords)
        - Structure (clear sections and headers)
        """
        score = 100

        # Deduct for errors
        score -= error_count * 5

        # Deduct for warnings
        score -= warning_count * 2

        # Check for ATS-friendly structure
        has_contact = bool(resume_data.get('contact', {}).get('name'))
        has_email = bool(resume_data.get('contact', {}).get('email'))
        has_experience = bool(resume_data.get('experience', []))
        has_education = bool(resume_data.get('education', []))

        if not (has_contact and has_email and has_experience):
            score -= 10

        # Bonus for keywords (basic implementation)
        text_content = ' '.join([
            resume_data.get('summary', ''),
            str(resume_data.get('skills', [])).lower(),
            ' '.join([e.get('description', '') for e in resume_data.get('experience', [])])
        ]).lower()

        keywords_found = sum(1 for keyword in ResumeValidator.ATS_KEYWORDS if keyword in text_content)
        if keywords_found > 0:
            # 2 points per keyword found (max 20 bonus points)
            score = min(100, score + min(20, keywords_found * 2))

        return max(0, min(100, score))

    @staticmethod
    def _calculate_validation_score(
        error_count: int,
        warning_count: int,
        missing_sections: List[str],
        metrics: dict
    ) -> int:
        """
        Calculate overall validation score 0-100
        Based on errors, warnings, completeness, and content metrics
        """
        score = 100

        # Deduct for critical errors (each worth 10 points)
        score -= error_count * 10

        # Deduct for warnings (each worth 3 points)
        score -= warning_count * 3

        # Deduct for missing sections (each worth 10 points)
        score -= len(missing_sections) * 10

        # Bonus if content is well-structured
        if metrics.get('experience_count', 0) >= 2:
            score += 5
        if metrics.get('education_count', 0) >= 1:
            score += 5
        if metrics.get('skills_count', 0) >= 5:
            score += 5

        # Bonus if page count is optimal (1-2 pages)
        if 1 <= metrics.get('estimated_pages', 0) <= 2:
            score += 10

        return max(0, min(100, score))

    @staticmethod
    def _generate_summary(
        validation_score: int,
        ats_score: int,
        errors: List[str],
        warnings: List[str],
        suggestions: List[str]
    ) -> str:
        """Generate human-readable summary"""
        if validation_score == 100:
            return (
                f'Excellent! Your resume is well-structured and complete. '
                f'ATS compatibility score: {ats_score}/100. Ready to submit!'
            )
        elif validation_score >= 80:
            return (
                f'Good! Your resume looks solid (score: {validation_score}/100). '
                f'Address {len(errors)} error(s) and consider {len(suggestions)} suggestion(s). '
                f'ATS score: {ats_score}/100.'
            )
        elif validation_score >= 60:
            return (
                f'Your resume needs some work (score: {validation_score}/100). '
                f'Please fix {len(errors)} critical error(s). '
                f'ATS compatibility: {ats_score}/100.'
            )
        else:
            return (
                f'Your resume needs significant improvements (score: {validation_score}/100). '
                f'Address {len(errors)} critical issue(s) before submitting. '
                f'ATS score: {ats_score}/100.'
            )
