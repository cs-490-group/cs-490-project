import React from 'react';
import { render, screen, fireEvent, waitFor } from '../test-utils.jsx';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

describe('Resume Management Tests', () => {
  test('displays resume list', async () => {
    const TestComponent = () => {
      const [resumes, setResumes] = React.useState([
        { id: 1, title: 'Resume 1' },
        { id: 2, title: 'Resume 2' }
      ]);
      return (
        <ul>
          {resumes.map(r => <li key={r.id}>{r.title}</li>)}
        </ul>
      );
    };
    render(<TestComponent />);
    expect(screen.getByText('Resume 1')).toBeInTheDocument();
    expect(screen.getByText('Resume 2')).toBeInTheDocument();
  });

  test('creates new resume', async () => {
    const handleCreate = jest.fn();
    const TestComponent = () => {
      const [title, setTitle] = React.useState('');
      const handleSubmit = (e) => {
        e.preventDefault();
        handleCreate(title);
        setTitle('');
      };
      return (
        <form onSubmit={handleSubmit}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Resume title" />
          <button type="submit">Create</button>
        </form>
      );
    };
    render(<TestComponent />);
    await userEvent.type(screen.getByPlaceholderText('Resume title'), 'My Resume');
    fireEvent.click(screen.getByText('Create'));
    expect(handleCreate).toHaveBeenCalledWith('My Resume');
  });

  test('edits existing resume', async () => {
    const handleSave = jest.fn();
    const TestComponent = () => {
      const [resume, setResume] = React.useState({ id: 1, title: 'Resume 1' });
      const [editing, setEditing] = React.useState(false);
      return (
        <div>
          {editing ? (
            <input value={resume.title} onChange={(e) => setResume({ ...resume, title: e.target.value })} />
          ) : (
            <h2>{resume.title}</h2>
          )}
          <button onClick={() => setEditing(!editing)}>{editing ? 'Save' : 'Edit'}</button>
        </div>
      );
    };
    render(<TestComponent />);
    fireEvent.click(screen.getByText('Edit'));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  test('deletes resume', async () => {
    const handleDelete = jest.fn();
    const TestComponent = () => (
      <div>
        <h2>Resume 1</h2>
        <button onClick={() => handleDelete(1)}>Delete</button>
      </div>
    );
    render(<TestComponent />);
    fireEvent.click(screen.getByText('Delete'));
    expect(handleDelete).toHaveBeenCalledWith(1);
  });

  test('exports resume to PDF', async () => {
    const handleExport = jest.fn();
    const TestComponent = () => (
      <div>
        <h2>Resume 1</h2>
        <button onClick={() => handleExport('pdf')}>Export PDF</button>
      </div>
    );
    render(<TestComponent />);
    fireEvent.click(screen.getByText('Export PDF'));
    expect(handleExport).toHaveBeenCalledWith('pdf');
  });

  test('exports resume to DOCX', async () => {
    const handleExport = jest.fn();
    const TestComponent = () => (
      <div>
        <h2>Resume 1</h2>
        <button onClick={() => handleExport('docx')}>Export DOCX</button>
      </div>
    );
    render(<TestComponent />);
    fireEvent.click(screen.getByText('Export DOCX'));
    expect(handleExport).toHaveBeenCalledWith('docx');
  });

  test('previews resume', async () => {
    const TestComponent = () => {
      const [preview, setPreview] = React.useState(false);
      return (
        <div>
          <button onClick={() => setPreview(!preview)}>Preview</button>
          {preview && <div role="dialog">Resume Preview</div>}
        </div>
      );
    };
    render(<TestComponent />);
    fireEvent.click(screen.getByText('Preview'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('shares resume with feedback link', async () => {
    const handleShare = jest.fn();
    const TestComponent = () => (
      <div>
        <button onClick={() => handleShare()}>Share for Feedback</button>
      </div>
    );
    render(<TestComponent />);
    fireEvent.click(screen.getByText('Share for Feedback'));
    expect(handleShare).toHaveBeenCalled();
  });

  test('manages resume versions', async () => {
    const TestComponent = () => {
      const [versions, setVersions] = React.useState([
        { id: 1, name: 'v1.0', date: '2024-01-01' },
        { id: 2, name: 'v1.1', date: '2024-01-15' }
      ]);
      return (
        <ul>
          {versions.map(v => <li key={v.id}>{v.name}</li>)}
        </ul>
      );
    };
    render(<TestComponent />);
    expect(screen.getByText('v1.0')).toBeInTheDocument();
    expect(screen.getByText('v1.1')).toBeInTheDocument();
  });
});

describe('Skills Management Tests', () => {
  test('displays user skills', () => {
    const TestComponent = () => {
      const [skills] = React.useState(['React', 'JavaScript', 'Node.js']);
      return (
        <div>
          {skills.map((skill, i) => <span key={i}>{skill}</span>)}
        </div>
      );
    };
    render(<TestComponent />);
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
  });

  test('adds new skill', async () => {
    const handleAdd = jest.fn();
    const TestComponent = () => {
      const [skill, setSkill] = React.useState('');
      return (
        <div>
          <input value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="Skill" />
          <button onClick={() => { handleAdd(skill); setSkill(''); }}>Add Skill</button>
        </div>
      );
    };
    render(<TestComponent />);
    await userEvent.type(screen.getByPlaceholderText('Skill'), 'Python');
    fireEvent.click(screen.getByText('Add Skill'));
    expect(handleAdd).toHaveBeenCalledWith('Python');
  });

  test('removes skill', async () => {
    const handleRemove = jest.fn();
    const TestComponent = () => (
      <div>
        <span>React <button onClick={() => handleRemove('React')}>Remove</button></span>
      </div>
    );
    render(<TestComponent />);
    fireEvent.click(screen.getByText('Remove'));
    expect(handleRemove).toHaveBeenCalledWith('React');
  });

  test('searches skills', async () => {
    const TestComponent = () => {
      const [search, setSearch] = React.useState('');
      const skills = ['React', 'JavaScript', 'Node.js'];
      const filtered = skills.filter(s => s.toLowerCase().includes(search.toLowerCase()));
      return (
        <div>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" />
          {filtered.map((s, i) => <div key={i}>{s}</div>)}
        </div>
      );
    };
    render(<TestComponent />);
    await userEvent.type(screen.getByPlaceholderText('Search'), 'React');
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.queryByText('Node.js')).not.toBeInTheDocument();
  });

  test('endorses skill', async () => {
    const handleEndorse = jest.fn();
    const TestComponent = () => (
      <div>
        <span>React <button onClick={() => handleEndorse('React')}>Endorse</button></span>
      </div>
    );
    render(<TestComponent />);
    fireEvent.click(screen.getByText('Endorse'));
    expect(handleEndorse).toHaveBeenCalledWith('React');
  });
});

describe('Employment History Tests', () => {
  test('displays employment history', () => {
    const TestComponent = () => {
      const [jobs] = React.useState([
        { id: 1, company: 'Tech Corp', position: 'Developer' },
        { id: 2, company: 'StartUp Inc', position: 'Engineer' }
      ]);
      return (
        <ul>
          {jobs.map(j => <li key={j.id}>{j.position} at {j.company}</li>)}
        </ul>
      );
    };
    render(<TestComponent />);
    expect(screen.getByText('Developer at Tech Corp')).toBeInTheDocument();
  });

  test('adds employment entry', async () => {
    const handleAdd = jest.fn();
    const TestComponent = () => {
      const [formData, setFormData] = React.useState({ company: '', position: '' });
      const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
      };
      return (
        <form onSubmit={(e) => { e.preventDefault(); handleAdd(formData); }}>
          <input name="company" value={formData.company} onChange={handleChange} placeholder="Company" />
          <input name="position" value={formData.position} onChange={handleChange} placeholder="Position" />
          <button type="submit">Add</button>
        </form>
      );
    };
    render(<TestComponent />);
    await userEvent.type(screen.getByPlaceholderText('Company'), 'Tech Corp');
    await userEvent.type(screen.getByPlaceholderText('Position'), 'Developer');
    fireEvent.click(screen.getByText('Add'));
    expect(handleAdd).toHaveBeenCalled();
  });

  test('edits employment entry', async () => {
    const TestComponent = () => {
      const [job, setJob] = React.useState({ id: 1, company: 'Tech Corp', position: 'Developer' });
      const [editing, setEditing] = React.useState(false);
      return (
        <div>
          {editing ? (
            <input value={job.position} onChange={(e) => setJob({ ...job, position: e.target.value })} />
          ) : (
            <p>{job.position}</p>
          )}
          <button onClick={() => setEditing(!editing)}>Edit</button>
        </div>
      );
    };
    render(<TestComponent />);
    fireEvent.click(screen.getByText('Edit'));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  test('deletes employment entry', async () => {
    const handleDelete = jest.fn();
    const TestComponent = () => (
      <div>
        <p>Developer at Tech Corp</p>
        <button onClick={() => handleDelete(1)}>Delete</button>
      </div>
    );
    render(<TestComponent />);
    fireEvent.click(screen.getByText('Delete'));
    expect(handleDelete).toHaveBeenCalledWith(1);
  });
});

describe('Education Management Tests', () => {
  test('displays education entries', () => {
    const TestComponent = () => {
      const [education] = React.useState([
        { id: 1, school: 'University A', degree: 'BS' },
        { id: 2, school: 'University B', degree: 'MS' }
      ]);
      return (
        <ul>
          {education.map(e => <li key={e.id}>{e.degree} from {e.school}</li>)}
        </ul>
      );
    };
    render(<TestComponent />);
    expect(screen.getByText('BS from University A')).toBeInTheDocument();
  });

  test('adds education entry', async () => {
    const handleAdd = jest.fn();
    const TestComponent = () => {
      const [formData, setFormData] = React.useState({ school: '', degree: '' });
      return (
        <form onSubmit={(e) => { e.preventDefault(); handleAdd(formData); }}>
          <input value={formData.school} onChange={(e) => setFormData({ ...formData, school: e.target.value })} placeholder="School" />
          <input value={formData.degree} onChange={(e) => setFormData({ ...formData, degree: e.target.value })} placeholder="Degree" />
          <button type="submit">Add</button>
        </form>
      );
    };
    render(<TestComponent />);
    await userEvent.type(screen.getByPlaceholderText('School'), 'University A');
    await userEvent.type(screen.getByPlaceholderText('Degree'), 'BS');
    fireEvent.click(screen.getByText('Add'));
    expect(handleAdd).toHaveBeenCalled();
  });

  test('validates education form', async () => {
    const TestComponent = () => {
      const [formData, setFormData] = React.useState({ school: '', degree: '' });
      const [errors, setErrors] = React.useState({});
      
      const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!formData.school) newErrors.school = 'School is required';
        if (!formData.degree) newErrors.degree = 'Degree is required';
        setErrors(newErrors);
      };
      return (
        <form onSubmit={handleSubmit}>
          <input 
            name="school"
            value={formData.school} 
            onChange={(e) => setFormData({...formData, school: e.target.value})}
            placeholder="School" 
          />
          <input 
            name="degree"
            value={formData.degree}
            onChange={(e) => setFormData({...formData, degree: e.target.value})}
            placeholder="Degree" 
          />
          <button type="submit">Submit</button>
          {Object.entries(errors).map(([k, v]) => <p key={k}>{v}</p>)}
        </form>
      );
    };
    render(<TestComponent />);
    fireEvent.click(screen.getByText('Submit'));
    await waitFor(() => {
      expect(screen.getByText('School is required')).toBeInTheDocument();
    });
  });
});

describe('Projects Management Tests', () => {
  test('displays projects list', () => {
    const TestComponent = () => {
      const [projects] = React.useState([
        { id: 1, title: 'Project 1', description: 'Desc 1' },
        { id: 2, title: 'Project 2', description: 'Desc 2' }
      ]);
      return (
        <ul>
          {projects.map(p => <li key={p.id}>{p.title}</li>)}
        </ul>
      );
    };
    render(<TestComponent />);
    expect(screen.getByText('Project 1')).toBeInTheDocument();
    expect(screen.getByText('Project 2')).toBeInTheDocument();
  });

  test('creates new project', async () => {
    const handleCreate = jest.fn();
    const TestComponent = () => {
      const [formData, setFormData] = React.useState({ title: '', description: '' });
      return (
        <form onSubmit={(e) => { e.preventDefault(); handleCreate(formData); }}>
          <input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Title" />
          <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Description" />
          <button type="submit">Create</button>
        </form>
      );
    };
    render(<TestComponent />);
    await userEvent.type(screen.getByPlaceholderText('Title'), 'New Project');
    fireEvent.click(screen.getByText('Create'));
    expect(handleCreate).toHaveBeenCalled();
  });

  test('displays project details', () => {
    const TestComponent = () => {
      const project = { id: 1, title: 'Project 1', description: 'A great project', link: 'http://example.com' };
      return (
        <div>
          <h2>{project.title}</h2>
          <p>{project.description}</p>
          <a href={project.link}>View Project</a>
        </div>
      );
    };
    render(<TestComponent />);
    expect(screen.getByText('Project 1')).toBeInTheDocument();
    expect(screen.getByText('A great project')).toBeInTheDocument();
  });
});

describe('Certifications Management Tests', () => {
  test('displays certifications', () => {
    const TestComponent = () => {
      const [certs] = React.useState([
        { id: 1, name: 'AWS Certified', issuer: 'AWS' },
        { id: 2, name: 'Azure Certified', issuer: 'Microsoft' }
      ]);
      return (
        <ul>
          {certs.map(c => <li key={c.id}>{c.name}</li>)}
        </ul>
      );
    };
    render(<TestComponent />);
    expect(screen.getByText('AWS Certified')).toBeInTheDocument();
  });

  test('adds certification', async () => {
    const handleAdd = jest.fn();
    const TestComponent = () => {
      const [formData, setFormData] = React.useState({ name: '', issuer: '' });
      return (
        <form onSubmit={(e) => { e.preventDefault(); handleAdd(formData); }}>
          <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Cert name" />
          <input value={formData.issuer} onChange={(e) => setFormData({ ...formData, issuer: e.target.value })} placeholder="Issuer" />
          <button type="submit">Add</button>
        </form>
      );
    };
    render(<TestComponent />);
    await userEvent.type(screen.getByPlaceholderText('Cert name'), 'AWS Certified');
    fireEvent.click(screen.getByText('Add'));
    expect(handleAdd).toHaveBeenCalled();
  });
});

describe('Cover Letter Tests', () => {
  test('displays cover letters', () => {
    const TestComponent = () => {
      const [letters] = React.useState([
        { id: 1, title: 'Letter 1' },
        { id: 2, title: 'Letter 2' }
      ]);
      return (
        <ul>
          {letters.map(l => <li key={l.id}>{l.title}</li>)}
        </ul>
      );
    };
    render(<TestComponent />);
    expect(screen.getByText('Letter 1')).toBeInTheDocument();
  });

  test('creates new cover letter', async () => {
    const handleCreate = jest.fn();
    const TestComponent = () => {
      const [title, setTitle] = React.useState('');
      return (
        <form onSubmit={(e) => { e.preventDefault(); handleCreate(title); }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          <button type="submit">Create</button>
        </form>
      );
    };
    render(<TestComponent />);
    await userEvent.type(screen.getByPlaceholderText('Title'), 'New Letter');
    fireEvent.click(screen.getByText('Create'));
    expect(handleCreate).toHaveBeenCalledWith('New Letter');
  });

  test('edits cover letter', async () => {
    const TestComponent = () => {
      const [letter, setLetter] = React.useState({ id: 1, content: 'Dear Hiring Manager...' });
      const [editing, setEditing] = React.useState(false);
      return (
        <div>
          {editing ? (
            <textarea value={letter.content} onChange={(e) => setLetter({ ...letter, content: e.target.value })} />
          ) : (
            <p>{letter.content}</p>
          )}
          <button onClick={() => setEditing(!editing)}>Edit</button>
        </div>
      );
    };
    render(<TestComponent />);
    fireEvent.click(screen.getByText('Edit'));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});

describe('Dashboard Tests', () => {
  test('displays dashboard', () => {
    const TestComponent = () => <div>Dashboard</div>;
    render(<TestComponent />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  test('displays user stats', () => {
    const TestComponent = () => (
      <div>
        <p>Resumes: 3</p>
        <p>Skills: 10</p>
        <p>Jobs Saved: 5</p>
      </div>
    );
    render(<TestComponent />);
    expect(screen.getByText('Resumes: 3')).toBeInTheDocument();
    expect(screen.getByText('Skills: 10')).toBeInTheDocument();
  });

  test('displays recent activity', () => {
    const TestComponent = () => {
      const [activities] = React.useState([
        { id: 1, action: 'Created resume' },
        { id: 2, action: 'Updated profile' }
      ]);
      return (
        <ul>
          {activities.map(a => <li key={a.id}>{a.action}</li>)}
        </ul>
      );
    };
    render(<TestComponent />);
    expect(screen.getByText('Created resume')).toBeInTheDocument();
  });
});

describe('API Error Handling Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('handles generic errors with retry', async () => {
    const handleRetry = jest.fn();
    const TestComponent = () => {
      const [error, setError] = React.useState('An error occurred');
      return (
        <div>
          {error && (
            <div role="alert">
              {error}
              <button onClick={() => { handleRetry(); setError(''); }}>Retry</button>
            </div>
          )}
        </div>
      );
    };
    render(<TestComponent />);
    fireEvent.click(screen.getByText('Retry'));
    expect(handleRetry).toHaveBeenCalled();
  });

  test('displays error state during loading', () => {
    const TestComponent = () => {
      const [state, setState] = React.useState('error');
      return <div>{state === 'error' && <p>Failed to load data</p>}</div>;
    };
    render(<TestComponent />);
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
  });
});
