import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import CategoryCard from '../components/Card';
import ProgressTracker from '../components/ProgressTracker';
import BarChart from '../components/BarChart';
// import { apiRequest } from "../api";
import CareerTimeline from '../components/Timeline';
import './Dashboard.css';
// import '../styles/resumes.css'
import { Link } from "react-router-dom";
import RecentChanges from '../components/RecentChanges';
import ProfileApi from '../api/profiles';
import EmploymentApi from '../api/employment';
import SkillsApi from '../api/skills';
import EducationApi from '../api/education';
import ProjectsApi from '../api/projects';
import CertificationsApi from '../api/certifications';
import ExternalSkillsPlatforms from './ExternalSkillsAssessments';
import posthog from 'posthog-js';


// Helper function to format ISO date to readable format
function formatDate(isoDate) {
    const date = new Date(isoDate);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}-${day}-${year}, ${hours}:${minutes}`;
}

// Helper function to create an update entry
function createUpdateEntry(isoDate, schemaType, name) {
    if (!isoDate) return null;

    const formattedDate = formatDate(isoDate);
    const label = `${schemaType}: ${name}`;

    return {
        isoDate: isoDate,
        formatted: formattedDate,
        label: label
    };
}

// Helper function to merge and sort recent updates, keeping top 10
function mergeRecentUpdates(existingUpdates, newUpdates) {
    const allUpdates = [...existingUpdates];

    newUpdates.forEach(newUpdate => {
        if (!newUpdate) return;
        allUpdates.push(newUpdate);
    });

    // Sort by ISO date string (most recent first) and keep top 10
    allUpdates.sort((a, b) => b.isoDate.localeCompare(a.isoDate));
    return allUpdates.slice(0, 10);
}

// Helper function to merge skill category counts
function mergeSkillCategoryCounts(existingCounts, newCounts) {
    const merged = { ...existingCounts };

    Object.entries(newCounts).forEach(([category, count]) => {
        if (category && category !== '') {
            merged[category] = (merged[category] || 0) + count;
        }
    });

    return merged;
}

function profileFilter(profiles) {
    const updates = [];

    const filtered = profiles.map(profile => {
        const details = [];

        // Track this update
        updates.push(createUpdateEntry(profile.date_updated, 'Profile', profile.username || 'Unknown'));

        if (profile.email !== null && profile.email !== undefined && profile.email !== '') {
            details.push(`Email: ${profile.email}`);
        }
        if (profile.full_name !== null && profile.full_name !== undefined && profile.full_name !== '') {
            details.push(`Full Name: ${profile.full_name}`);
        }
        if (profile.phone_number !== null && profile.phone_number !== undefined && profile.phone_number !== '') {
            details.push(`Phone: ${profile.phone_number}`);
        }
        if (profile.address !== null && profile.address !== undefined && profile.address !== '') {
            details.push(`Address: ${profile.address}`);
        }
        if (profile.title !== null && profile.title !== undefined && profile.title !== '') {
            details.push(`Title: ${profile.title}`);
        }
        if (profile.biography !== null && profile.biography !== undefined && profile.biography !== '') {
            details.push(`Biography: ${profile.biography}`);
        }
        if (profile.industry !== null && profile.industry !== undefined && profile.industry !== '') {
            details.push(`Industry: ${profile.industry}`);
        }
        if (profile.experience_level !== null && profile.experience_level !== undefined && profile.experience_level !== '') {
            details.push(`Experience Level: ${profile.experience_level}`);
        }

        return [profile.username, details];
    });

    return { filtered, updates, categoryCounts: {} };
}

function skillFilter(skills) {
    const updates = [];
    const categoryCounts = {};

    const filtered = skills.map(skill => {
        const details = [];

        // Track this update
        updates.push(createUpdateEntry(skill.date_updated, 'Skill', skill.name || 'Unknown'));

        // Track skill category
        if (skill.category && skill.category !== '') {
            categoryCounts[skill.category] = (categoryCounts[skill.category] || 0) + 1;
        }

        if (skill.proficiency !== null && skill.proficiency !== undefined && skill.proficiency !== '') {
            details.push(`Proficiency: ${skill.proficiency}`);
        }
        if (skill.category !== null && skill.category !== undefined && skill.category !== '') {
            details.push(`Skill Category: ${skill.category}`);
        }

        return [skill.name, details];
    });

    return { filtered, updates, categoryCounts };
}

function employmentFilter(employments) {
    const updates = [];

    const filtered = employments.map(employment => {
        const details = [];

        // Track this update
        updates.push(createUpdateEntry(employment.date_updated, 'Employment', employment.title || 'Unknown'));

        if (employment.company !== null && employment.company !== undefined && employment.company !== '') {
            details.push(`Company: ${employment.company}`);
        }
        if (employment.location !== null && employment.location !== undefined && employment.location !== '') {
            details.push(`Location: ${employment.location}`);
        }
        if (employment.start_date !== null && employment.start_date !== undefined && employment.start_date !== '') {
            details.push(`Start Date: ${employment.start_date}`);
        }
        if (employment.end_date !== null && employment.end_date !== undefined && employment.end_date !== '') {
            details.push(`End Date: ${employment.end_date}`);
        }
        if (employment.description !== null && employment.description !== undefined && employment.description !== '') {
            details.push(`Description: ${employment.description}`);
        }

        return [employment.title, details];
    });

    return { filtered, updates, categoryCounts: {} };
}

function educationFilter(educations) {
    const updates = [];

    const filtered = educations.map(education => {
        const details = [];

        // Track this update
        updates.push(createUpdateEntry(education.date_updated, 'Education', education.institution_name || 'Unknown'));

        if (education.degree !== null && education.degree !== undefined && education.degree !== '') {
            details.push(`Degree: ${education.degree}`);
        }
        if (education.field_of_study !== null && education.field_of_study !== undefined && education.field_of_study !== '') {
            details.push(`Field of Study: ${education.field_of_study}`);
        }
        if (education.graduation_date !== null && education.graduation_date !== undefined && education.graduation_date !== '') {
            details.push(`Graduation Date: ${education.graduation_date}`);
        }
        if (education.gpa !== null && education.gpa !== undefined && education.gpa_private !== null && education.gpa_private !== undefined && education.gpa_private === false) {
            details.push(`GPA: ${education.gpa}`);
        }

        if (education.education_level !== null && education.education_level !== undefined && education.education_level !== '') {
            details.push(`Education Level: ${education.education_level}`);
        }
        if (education.achievements !== null && education.achievements !== undefined && education.achievements !== '') {
            details.push(`Achievements: ${education.achievements}`);
        }
        if (education.position !== null && education.position !== undefined && education.position !== '') {
            details.push(`Position: ${education.position}`);
        }

        return [education.institution_name, details];
    });

    return { filtered, updates, categoryCounts: {} };
}

function projectFilter(projects) {
    const updates = [];

    const filtered = projects.map(project => {
        const details = [];

        // Track this update
        updates.push(createUpdateEntry(project.date_updated, 'Project', project.project_name || 'Unknown'));

        if (project.description !== null && project.description !== undefined && project.description !== '') {
            details.push(`Description: ${project.description}`);
        }
        if (project.role !== null && project.role !== undefined && project.role !== '') {
            details.push(`Role: ${project.role}`);
        }
        if (project.start_date !== null && project.start_date !== undefined && project.start_date !== '') {
            details.push(`Start Date: ${project.start_date}`);
        }
        if (project.end_date !== null && project.end_date !== undefined && project.end_date !== '') {
            details.push(`End Date: ${project.end_date}`);
        }
        if (project.skills !== null && project.skills !== undefined && project.skills.length > 0) {
            details.push(`Skills: ${project.skills.join(', ')}`);
        }
        if (project.team_size !== null && project.team_size !== undefined) {
            details.push(`Team Size: ${project.team_size}`);
        }
        if (project.details !== null && project.details !== undefined && project.details !== '') {
            details.push(`Details: ${project.details}`);
        }
        if (project.project_url !== null && project.project_url !== undefined && project.project_url !== '') {
            details.push(`Project URL: ${project.project_url}`);
        }
        if (project.achievements !== null && project.achievements !== undefined && project.achievements !== '') {
            details.push(`Achievements: ${project.achievements}`);
        }
        if (project.industry !== null && project.industry !== undefined && project.industry !== '') {
            details.push(`Industry: ${project.industry}`);
        }
        if (project.status !== null && project.status !== undefined && project.status !== '') {
            details.push(`Status: ${project.status}`);
        }

        return [project.project_name, details];
    });

    return { filtered, updates, categoryCounts: {} };
}

function certificationFilter(certifications) {
    const updates = [];

    const filtered = certifications.map(certification => {
        const details = [];

        // Track this update
        updates.push(createUpdateEntry(certification.date_updated, 'Certification', certification.name || 'Unknown'));

        if (certification.issuer !== null && certification.issuer !== undefined && certification.issuer !== '') {
            details.push(`Issuer: ${certification.issuer}`);
        }
        if (certification.date_earned !== null && certification.date_earned !== undefined && certification.date_earned !== '') {
            details.push(`Date Earned: ${certification.date_earned}`);
        }
        if (certification.date_expiry !== null && certification.date_expiry !== undefined && certification.date_expiry !== '') {
            details.push(`Expiry Date: ${certification.date_expiry}`);
        }
        if (certification.cert_number !== null && certification.cert_number !== undefined && certification.cert_number !== '') {
            details.push(`Certificate Number: ${certification.cert_number}`);
        }
        if (certification.category !== null && certification.category !== undefined && certification.category !== '') {
            details.push(`Category: ${certification.category}`);
        }
        if (certification.position !== null && certification.position !== undefined && certification.position !== '') {
            details.push(`Position: ${certification.position}`);
        }
        if (certification.verified !== null && certification.verified !== undefined) {
            details.push(`Verified: ${certification.verified}`);
        }
        if (certification.document_name !== null && certification.document_name !== undefined && certification.document_name !== '') {
            details.push(`Document: ${certification.document_name}`);
        }

        return [certification.name, details];
    });

    return { filtered, updates, categoryCounts: {} };
}

function filterBySchema(data, schemaName) {
    switch (schemaName) {
        case 'Profile':
            return profileFilter(data);
        case 'Skill':
            return skillFilter(data);
        case 'Employment':
            return employmentFilter(data);
        case 'Education':
            return educationFilter(data);
        case 'Project':
            return projectFilter(data);
        case 'Certification':
            return certificationFilter(data);
        default:
            throw new Error(`Unknown schema: ${schemaName}`);
    }
}

function axiosCall(schemaName) {
    switch (schemaName) {
        case 'Profile':
            return ProfileApi.get();
        case 'Skill':
            return SkillsApi.getAll();
        case 'Employment':
            return EmploymentApi.getAll();
        case 'Education':
            return EducationApi.getAll();
        case 'Project':
            return ProjectsApi.getAll();
        case 'Certification':
            return CertificationsApi.getAll();
        default:
            throw new Error(`Unknown schema: ${schemaName}`);
    }
}

const fetchDataFromAPI = async (schemaName) => {

    const response = axiosCall(schemaName);
    const apidata = (await response)['data'];
    console.log(apidata)


    function transformData(data) {
        const arr = Array.isArray(data)
            ? data
            : (data && typeof data === "object")
                ? [data]
                : [];




        const filtered = filterBySchema(arr, schemaName);
        return { ...filtered, rawData: arr };
    }

    return transformData(apidata);
};

const Dashboard = () => {
    const [data, setData] = useState({
        profile: null,
        employmentHistory: null,
        skills: null,
        education: null,
        projects: null,
        certifications: null
    });
    const [rawData, setRawData] = useState({
        profile: [],
        employment: [],
        skills: [],
        education: [],
        projects: [],
        certifications: []
    });
    const [rawEmploymentData, setRawEmploymentData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [recentUpdates, setRecentUpdates] = useState([]);
    const [skillCategoryCounts, setSkillCategoryCounts] = useState({});
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);

                const [profileResult, employmentResult, skillsResult, educationResult, projectsResult, certResult] = await Promise.all([
                    fetchDataFromAPI("Profile"),
                    fetchDataFromAPI("Employment"),
                    fetchDataFromAPI("Skill"),
                    fetchDataFromAPI("Education"),
                    fetchDataFromAPI("Project"),
                    fetchDataFromAPI("Certification")
                ]);

                // Set the filtered data
                setData({
                    profile: profileResult.filtered,
                    employmentHistory: employmentResult.filtered,
                    skills: skillsResult.filtered,
                    education: educationResult.filtered,
                    projects: projectsResult.filtered,
                    certifications: certResult.filtered
                });

                // Store raw data for export
                setRawData({
                    profile: profileResult.rawData || [],
                    employment: employmentResult.rawData || [],
                    skills: skillsResult.rawData || [],
                    education: educationResult.rawData || [],
                    projects: projectsResult.rawData || [],
                    certifications: certResult.rawData || []
                });

                // Store raw employment data for timeline
                setRawEmploymentData(employmentResult.rawData || []);

                // Merge all updates
                let allUpdates = [];
                allUpdates = mergeRecentUpdates(allUpdates, profileResult.updates);
                allUpdates = mergeRecentUpdates(allUpdates, employmentResult.updates);
                allUpdates = mergeRecentUpdates(allUpdates, skillsResult.updates);
                allUpdates = mergeRecentUpdates(allUpdates, educationResult.updates);
                allUpdates = mergeRecentUpdates(allUpdates, projectsResult.updates);
                allUpdates = mergeRecentUpdates(allUpdates, certResult.updates);
                setRecentUpdates(allUpdates);

                // Merge all skill category counts
                let allCategoryCounts = {};
                allCategoryCounts = mergeSkillCategoryCounts(allCategoryCounts, profileResult.categoryCounts);
                allCategoryCounts = mergeSkillCategoryCounts(allCategoryCounts, employmentResult.categoryCounts);
                allCategoryCounts = mergeSkillCategoryCounts(allCategoryCounts, skillsResult.categoryCounts);
                allCategoryCounts = mergeSkillCategoryCounts(allCategoryCounts, educationResult.categoryCounts);
                allCategoryCounts = mergeSkillCategoryCounts(allCategoryCounts, projectsResult.categoryCounts);
                allCategoryCounts = mergeSkillCategoryCounts(allCategoryCounts, certResult.categoryCounts);
                setSkillCategoryCounts(allCategoryCounts);

            } catch (err) {
                setError('Failed to fetch data');
                console.error('API Error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

    const handleExportSummary = () => {
        setExporting(true);

        // Create a formatted text summary
        const today = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        let summary = `PROFESSIONAL DASHBOARD SUMMARY\nGenerated: ${today}\n\n`;
        summary += '='.repeat(60) + '\n\n';

        // Profile Section
        summary += 'PROFILE INFORMATION\n';
        summary += '-'.repeat(60) + '\n';
        if (rawData.profile && rawData.profile.length > 0) {
            const profile = rawData.profile[0];
            if (profile.full_name) summary += `Name: ${profile.full_name}\n`;
            if (profile.title) summary += `Title: ${profile.title}\n`;
            if (profile.email) summary += `Email: ${profile.email}\n`;
            if (profile.phone_number) summary += `Phone: ${profile.phone_number}\n`;
            if (profile.address) summary += `Address: ${profile.address}\n`;
            if (profile.industry) summary += `Industry: ${profile.industry}\n`;
            if (profile.experience_level) summary += `Experience Level: ${profile.experience_level}\n`;
            if (profile.biography) summary += `\nBiography:\n${profile.biography}\n`;
        } else {
            summary += 'No profile information available.\n';
        }
        summary += '\n';

        // Employment History Section
        summary += 'EMPLOYMENT HISTORY\n';
        summary += '-'.repeat(60) + '\n';
        if (rawData.employment && rawData.employment.length > 0) {
            rawData.employment.forEach((job, index) => {
                summary += `${index + 1}. ${job.title || 'Unknown Position'}`;
                if (job.company) summary += ` at ${job.company}`;
                summary += '\n';
                if (job.location) summary += `   Location: ${job.location}\n`;
                if (job.start_date || job.end_date) {
                    summary += `   Duration: ${job.start_date || 'Unknown'} - ${job.end_date || 'Present'}\n`;
                }
                if (job.description) summary += `   Description: ${job.description}\n`;
                summary += '\n';
            });
        } else {
            summary += 'No employment history available.\n\n';
        }

        // Skills Section
        summary += 'SKILLS\n';
        summary += '-'.repeat(60) + '\n';
        if (rawData.skills && rawData.skills.length > 0) {
            // Group skills by category
            const skillsByCategory = {};
            rawData.skills.forEach(skill => {
                const category = skill.category || 'Uncategorized';
                if (!skillsByCategory[category]) {
                    skillsByCategory[category] = [];
                }
                skillsByCategory[category].push(skill);
            });

            Object.entries(skillsByCategory).forEach(([category, skills]) => {
                summary += `\n${category}:\n`;
                skills.forEach(skill => {
                    summary += `  • ${skill.name}`;
                    if (skill.proficiency) summary += ` (${skill.proficiency})`;
                    summary += '\n';
                });
            });
            summary += '\n';
        } else {
            summary += 'No skills listed.\n\n';
        }

        // Education Section
        summary += 'EDUCATION\n';
        summary += '-'.repeat(60) + '\n';
        if (rawData.education && rawData.education.length > 0) {
            rawData.education.forEach((edu, index) => {
                summary += `${index + 1}. ${edu.institution_name || 'Unknown Institution'}\n`;
                if (edu.degree) summary += `   Degree: ${edu.degree}`;
                if (edu.field_of_study) summary += ` in ${edu.field_of_study}`;
                if (edu.degree || edu.field_of_study) summary += '\n';
                if (edu.graduation_date) summary += `   Graduation: ${edu.graduation_date}\n`;
                if (edu.gpa) summary += `   GPA: ${edu.gpa}\n`;
                if (edu.achievements) summary += `   Achievements: ${edu.achievements}\n`;
                summary += '\n';
            });
        } else {
            summary += 'No education history available.\n\n';
        }

        // Projects Section
        summary += 'PROJECTS\n';
        summary += '-'.repeat(60) + '\n';
        if (rawData.projects && rawData.projects.length > 0) {
            rawData.projects.forEach((project, index) => {
                summary += `${index + 1}. ${project.project_name || 'Unknown Project'}\n`;
                if (project.role) summary += `   Role: ${project.role}\n`;
                if (project.start_date || project.end_date) {
                    summary += `   Duration: ${project.start_date || 'Unknown'} - ${project.end_date || 'Ongoing'}\n`;
                }
                if (project.description) summary += `   Description: ${project.description}\n`;
                if (project.skills && project.skills.length > 0) {
                    summary += `   Technologies: ${project.skills.join(', ')}\n`;
                }
                if (project.project_url) summary += `   URL: ${project.project_url}\n`;
                if (project.achievements) summary += `   Achievements: ${project.achievements}\n`;
                summary += '\n';
            });
        } else {
            summary += 'No projects listed.\n\n';
        }

        // Certifications Section
        summary += 'CERTIFICATIONS\n';
        summary += '-'.repeat(60) + '\n';
        if (rawData.certifications && rawData.certifications.length > 0) {
            rawData.certifications.forEach((cert, index) => {
                summary += `${index + 1}. ${cert.name || 'Unknown Certification'}\n`;
                if (cert.issuer) summary += `   Issuer: ${cert.issuer}\n`;
                if (cert.date_earned) summary += `   Date Earned: ${cert.date_earned}\n`;
                if (cert.date_expiry) summary += `   Expiry Date: ${cert.date_expiry}\n`;
                if (cert.cert_number) summary += `   Certificate Number: ${cert.cert_number}\n`;
                summary += '\n';
            });
        } else {
            summary += 'No certifications listed.\n\n';
        }

        summary += '='.repeat(60) + '\n';
        summary += 'End of Summary\n';

        // Create and download the file
        const blob = new Blob([summary], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Dashboard_Summary_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        posthog.capture('dashboard_summary_exported', { date: today });

        setExporting(false);
    };

    if (loading) {
        return (
            <div className="dashboard-gradient min-vh-100 py-4">
                <Container>
                    <h1 className="text-center text-white fw-bold mb-5 display-4">
                        Dashboard
                    </h1>
                    <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '200px' }}>
                        <Spinner animation="border" variant="light" className="mb-3" />
                        <p className="text-white fs-5">Loading dashboard data...</p>
                    </div>
                </Container>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-gradient min-vh-100 py-4">
                <Container>
                    <h1 className="text-center text-white fw-bold mb-5 display-4">
                        Dashboard
                    </h1>
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
                        <Alert variant="danger" className="d-flex align-items-center">
                            <span className="me-2">⚠️</span> {error}
                        </Alert>
                    </div>
                </Container>
            </div>
        );
    }




    const getCompletenessStatus = (inputCat) => {        //INDICATORS
        const cardData = inputCat.data
        const schema = inputCat.title
        if (!cardData || cardData.length === 0) {
            return 'incomplete';
        }


        const threshData = {
            'Profile': 7,
            'Employment History': 3,
            'Skills': 1,
            'Education': 3,
            'Projects': 5,
            'Certifications': 4
        };

        const threshCount = {
            'Profile': 1,
            'Employment History': 2,
            'Skills': 4,
            'Education': 1,
            'Projects': 2,
            'Certifications': 1
        };


        const totalItems = cardData.length;
        const itemsWithContent = cardData.filter(([_, values]) =>
            values && values.length > threshData[schema] && values.some(v => v && v.trim() !== '')
        ).length;









        const completenessRatio = itemsWithContent / totalItems;

        if (completenessRatio >= 0.8 && totalItems >= threshCount[schema]) {
            return 'complete';
        } else if (totalItems > 0) {
            return 'partial';
        } else {
            return 'incomplete';
        }
    };





    const categories = [
        { title: 'Profile', icon: '👤', data: data.profile },
        { title: 'Employment History', icon: '💼', data: data.employmentHistory },
        { title: 'Skills', icon: '🧠', data: data.skills },
        { title: 'Education', icon: '🎓', data: data.education },
        { title: 'Projects', icon: '🚀', data: data.projects },
        { title: 'Certifications', icon: '📜', data: data.certifications }
    ];

    const statusColors = {
        'complete': 'success',
        'partial': 'warning',
        'incomplete': 'danger'
    };

    // Format recent updates for display
    const formattedRecentUpdates = recentUpdates.map(update => [update.formatted, update.label]);

    return (
        <div className="dashboard-bg min-vh-100 py-4">
            <Container fluid>
                <div className="dashboard-header-container">
                    <h1 className="text-white fw-bold display-4">
                        Dashboard
                    </h1>
                    <Button
                        variant="light"
                        onClick={handleExportSummary}
                        disabled={exporting}
                        className="dashboard-export-btn d-flex align-items-center gap-2"
                        style={{
                            fontWeight: '600',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                    >
                        {exporting ? (
                            <>
                                <Spinner animation="border" size="sm" />
                                <span>Exporting...</span>
                            </>
                        ) : (
                            <>
                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
                                    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z" />
                                </svg>
                                <span>Export Summary</span>
                            </>
                        )}
                    </Button>
                </div>

                <ProgressTracker data={data} />
                <div className="form-section-divider"></div>
                <Row>
                    {/* Left side: 3x2 grid */}
                    <Col lg={9}>
                        <Row className="g-3">
                            {categories.map((category, index) => {
                                const status = getCompletenessStatus(category);
                                const statusVariant = statusColors[status];
                                const link = `/${category.title.toLowerCase().replace(/\s+/g, '-')}`;

                                return (

                                    <Col md={6} key={index}>
                                        <Card className="dashboard-card">
                                            <Card.Body className="d-flex flex-column h-100">
                                                {/* Header */}
                                                <div className="d-flex align-items-center justify-content-between mb-3 flex-shrink-0">
                                                    {/* Status indicator */}
                                                    <div
                                                        className="status-indicator"
                                                        title={`Status: ${status === 'complete' ? 'Complete' : status === 'partial' ? 'Could be improved' : 'Incomplete'}`}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 14 14">
                                                            <circle
                                                                cx="7"
                                                                cy="7"
                                                                r="6"
                                                                className={`fill-${statusVariant}`}
                                                                opacity="0.9"
                                                            >
                                                                {status === 'incomplete' && (
                                                                    <animate
                                                                        attributeName="opacity"
                                                                        values="0.9;0.4;0.9"
                                                                        dur="2s"
                                                                        repeatCount="indefinite"
                                                                    />
                                                                )}
                                                            </circle>
                                                        </svg>
                                                    </div>

                                                    {/* Title */}
                                                    <Card.Link
                                                        href={link}
                                                        className="text-decoration-none fw-semibold fs-5 text-primary flex-grow-1 text-center mx-2 card-title-link"
                                                    >
                                                        {category.icon} {category.title}
                                                    </Card.Link>

                                                    {/* Button */}
                                                    <Link
                                                        to={{ pathname: link }}
                                                        state={{ showForm: true }}
                                                    >
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            className="dashboard-btn"
                                                        >
                                                            Add
                                                        </Button>
                                                    </Link>
                                                </div>

                        {/* Card content - scrollable */}
                        <div className="flex-grow-1 overflow-auto card-content"
                        tabIndex="0"          
                          role="region"          
                          aria-label={`${category.title} list`}>
                          <CategoryCard 
                              data={category.data} 
                              title={category.title} 
                            />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </Col>

                    {/* Right side: Sticky sidebar with full height */}
                    <Col lg={3}>
                        <div className="sidebar-sticky">
                            {/* Skills Overview - Takes up half the height */}
                            <Card className="sidebar-card-top">
                                <Card.Body className="d-flex flex-column h-100">
                                    <Card.Link
                                        href="/skills"
                                        className="text-decoration-none fw-semibold fs-5 text-primary text-center mb-3 d-block flex-shrink-0 card-title-link"
                                    >
                                        🧩 Skills Overview
                                    </Card.Link>
                                    <div className="flex-grow-1 overflow-hidden"
                                        tabIndex="0"     
                                        role="region" 
                                        aria-label="Skills proficiency chart">
                                        <BarChart
                                            data={skillCategoryCounts}
                                            title="Skills Proficiency"
                                        />
                                    </div>
                                </Card.Body>
                            </Card>

                            {/* Quick Actions - Takes up the other half */}
                            <Card className="sidebar-card-bottom">
                                <Card.Body className="d-flex flex-column h-100">
                                    <Card.Link
                                        className="text-decoration-none fw-semibold fs-5 text-primary text-center mb-3 d-block flex-shrink-0 card-title-link"
                                    >
                                        🕓 Recent Changes
                                    </Card.Link>
                                    <div className="flex-grow-1 overflow-auto chart-scrollbar" 
                                        tabIndex="0" 
                                        role="region" 
                                        aria-label="Recent changes list">
                                        <RecentChanges changes={formattedRecentUpdates} />
                                    </div>
                                </Card.Body>
                            </Card>
                        </div>
                    </Col>
                </Row>

                <div className="form-section-divider"></div>

                {/* Career Timeline */}
                <Row className="mt-4">
                    <Col>
                        <section className="career-section">
                            <h4 className="timeline-title">🧭 My Career Journey</h4>
                            <div className="career-content">
                                <CareerTimeline
                                    title="My Career Journey"
                                    employmentData={rawEmploymentData}
                                />
                            </div>
                        </section>
                    </Col>
                </Row>
                <Row className="mt-4">
                    <Col>
                        <ExternalSkillsPlatforms></ExternalSkillsPlatforms>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default Dashboard;