/**
 * Utility functions to match interview questions to job requirements
 */

export function extractSkillsFromJob(job) {
  if (!job) return [];

  const skills = new Set();

  // Extract from requirements field
  if (job.requirements) {
    const requirementsText = job.requirements.toLowerCase();

    // Common skill keywords
    const skillKeywords = [
      // Technical
      'javascript', 'typescript', 'python', 'java', 'react', 'angular', 'vue',
      'node.js', 'nodejs', 'express', 'django', 'flask', 'sql', 'mongodb',
      'rest api', 'graphql', 'docker', 'kubernetes', 'aws', 'azure', 'gcp',
      'git', 'agile', 'scrum', 'jira', 'ci/cd', 'jenkins', 'linux', 'unix',
      'html', 'css', 'webpack', 'nginx', 'apache', 'microservices',

      // Data Science
      'machine learning', 'deep learning', 'data analysis', 'statistics',
      'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch',
      'sql', 'spark', 'hadoop', 'etl', 'tableau', 'power bi',

      // Soft Skills
      'communication', 'problem solving', 'teamwork', 'leadership',
      'project management', 'collaboration', 'critical thinking',
      'attention to detail', 'time management', 'adaptability',

      // Domain Skills
      'fintech', 'blockchain', 'cryptocurrency', 'ecommerce',
      'healthcare', 'saas', 'mobile', 'web development',
      'devops', 'security', 'database', 'cloud', 'infrastructure'
    ];

    skillKeywords.forEach(keyword => {
      if (requirementsText.includes(keyword)) {
        // Normalize the skill
        const normalized = normalizeSkill(keyword);
        skills.add(normalized);
      }
    });
  }

  // Extract from title and description as well
  if (job.title) {
    const titleLower = job.title.toLowerCase();
    if (titleLower.includes('senior') || titleLower.includes('lead')) {
      skills.add('Leadership');
    }
    if (titleLower.includes('full stack') || titleLower.includes('fullstack')) {
      skills.add('Full-Stack Development');
    }
    if (titleLower.includes('frontend')) {
      skills.add('Frontend Development');
    }
    if (titleLower.includes('backend')) {
      skills.add('Backend Development');
    }
    if (titleLower.includes('devops')) {
      skills.add('DevOps');
    }
    if (titleLower.includes('data scientist')) {
      skills.add('Data Science');
    }
  }

  return Array.from(skills);
}

export function normalizeSkill(skill) {
  // Convert skill to title case for matching
  return skill
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function matchQuestionsToJob(questions, job) {
  if (!job) return questions;

  const jobSkills = extractSkillsFromJob(job);

  if (jobSkills.length === 0) return questions;

  // Score each question based on skill matches
  const scoredQuestions = questions.map(question => {
    let score = 0;
    const questionSkills = (question.expected_skills || []).map(s => s.toLowerCase());

    jobSkills.forEach(jobSkill => {
      const jobSkillLower = jobSkill.toLowerCase();
      if (questionSkills.some(qs => qs.includes(jobSkillLower) || jobSkillLower.includes(qs))) {
        score++;
      }
    });

    return { question, score };
  });

  // Sort by relevance (high scores first) but keep unmatched questions at the end
  return scoredQuestions
    .sort((a, b) => {
      if (a.score === 0 && b.score === 0) return 0;
      if (a.score === 0) return 1;
      if (b.score === 0) return -1;
      return b.score - a.score;
    })
    .map(item => item.question);
}

export function getRelevanceLevel(question, job) {
  if (!job) return 'unfiltered';

  const jobSkills = extractSkillsFromJob(job);
  const questionSkills = (question.expected_skills || []).map(s => s.toLowerCase());

  let matchCount = 0;
  jobSkills.forEach(jobSkill => {
    const jobSkillLower = jobSkill.toLowerCase();
    if (questionSkills.some(qs => qs.includes(jobSkillLower) || jobSkillLower.includes(qs))) {
      matchCount++;
    }
  });

  if (matchCount === 0) return 'unmatched';
  if (matchCount === 1) return 'partially-matched';
  return 'highly-matched';
}
