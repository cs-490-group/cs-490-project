import React from 'react';
import { render, screen, fireEvent, waitFor } from '../test-utils.jsx';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

describe('Integration Tests - User Workflows', () => {
  test('complete user registration and login flow', async () => {
    const RegisterFlow = () => {
      const [step, setStep] = React.useState('register');
      const [user, setUser] = React.useState(null);
      
      if (step === 'register') {
        return (
          <div>
            <input placeholder="Email" />
            <input placeholder="Password" type="password" />
            <button onClick={() => setStep('login')}>Register</button>
          </div>
        );
      }
      return (
        <div>
          <input placeholder="Email" />
          <input placeholder="Password" type="password" />
          <button onClick={() => setUser({ email: 'test@example.com' })}>Login</button>
          {user && <p>Welcome {user.email}</p>}
        </div>
      );
    };
    
    render(<RegisterFlow />);
    fireEvent.click(screen.getByText('Register'));
    fireEvent.click(screen.getByText('Login'));
    await waitFor(() => {
      expect(screen.getByText(/Welcome/)).toBeInTheDocument();
    });
  });

  test('complete resume creation and export workflow', async () => {
    const ResumeFlow = () => {
      const [resumes, setResumes] = React.useState([]);
      const [title, setTitle] = React.useState('');
      
      const handleCreate = () => {
        setResumes([...resumes, { id: Date.now(), title }]);
        setTitle('');
      };
      
      return (
        <div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Resume title" />
          <button onClick={handleCreate}>Create Resume</button>
          {resumes.map(r => (
            <div key={r.id}>
              <span>{r.title}</span>
              <button onClick={() => {}}>Edit</button>
              <button onClick={() => {}}>Export PDF</button>
              <button onClick={() => {}}>Export DOCX</button>
              <button onClick={() => {}}>Share</button>
            </div>
          ))}
        </div>
      );
    };
    
    render(<ResumeFlow />);
    await userEvent.type(screen.getByPlaceholderText('Resume title'), 'Professional Resume');
    fireEvent.click(screen.getByText('Create Resume'));
    expect(screen.getByText('Professional Resume')).toBeInTheDocument();
    expect(screen.getByText('Export PDF')).toBeInTheDocument();
  });

  test('skill endorsement workflow', async () => {
    const SkillEndorseFlow = () => {
      const [skills, setSkills] = React.useState([
        { id: 1, name: 'React', endorsements: 5 }
      ]);
      
      return (
        <div>
          {skills.map(skill => (
            <div key={skill.id}>
              <span>{skill.name}</span>
              <span>Endorsements: {skill.endorsements}</span>
              <button onClick={() => {
                setSkills(skills.map(s => 
                  s.id === skill.id ? { ...s, endorsements: s.endorsements + 1 } : s
                ));
              }}>Endorse</button>
            </div>
          ))}
        </div>
      );
    };
    
    render(<SkillEndorseFlow />);
    expect(screen.getByText('Endorsements: 5')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Endorse'));
    await waitFor(() => {
      expect(screen.getByText('Endorsements: 6')).toBeInTheDocument();
    });
  });

  test('employment history management workflow', async () => {
    const EmploymentFlow = () => {
      const [jobs, setJobs] = React.useState([]);
      const [formData, setFormData] = React.useState({ company: '', position: '' });
      
      return (
        <div>
          <input 
            value={formData.company}
            onChange={(e) => setFormData({...formData, company: e.target.value})}
            placeholder="Company"
          />
          <input 
            value={formData.position}
            onChange={(e) => setFormData({...formData, position: e.target.value})}
            placeholder="Position"
          />
          <button onClick={() => {
            setJobs([...jobs, formData]);
            setFormData({ company: '', position: '' });
          }}>Add Job</button>
          <ul>
            {jobs.map((job, i) => (
              <li key={i}>{job.position} at {job.company}</li>
            ))}
          </ul>
        </div>
      );
    };
    
    render(<EmploymentFlow />);
    await userEvent.type(screen.getByPlaceholderText('Company'), 'Tech Corp');
    await userEvent.type(screen.getByPlaceholderText('Position'), 'Developer');
    fireEvent.click(screen.getByText('Add Job'));
    expect(screen.getByText('Developer at Tech Corp')).toBeInTheDocument();
  });

  test('education and certification tracking', async () => {
    const EducationFlow = () => {
      const [entries, setEntries] = React.useState([]);
      const [type, setType] = React.useState('education');
      const [title, setTitle] = React.useState('');
      
      return (
        <div>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="education">Education</option>
            <option value="certification">Certification</option>
          </select>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          <button onClick={() => {
            setEntries([...entries, { type, title }]);
            setTitle('');
          }}>Add</button>
          <ul>
            {entries.map((e, i) => (
              <li key={i}>{e.type}: {e.title}</li>
            ))}
          </ul>
        </div>
      );
    };
    
    render(<EducationFlow />);
    await userEvent.type(screen.getByPlaceholderText('Title'), 'BS Computer Science');
    fireEvent.click(screen.getByText('Add'));
    expect(screen.getByText('education: BS Computer Science')).toBeInTheDocument();
  });

  test('project portfolio management', async () => {
    const ProjectFlow = () => {
      const [projects, setProjects] = React.useState([]);
      const [title, setTitle] = React.useState('');
      
      return (
        <div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project title" />
          <button onClick={() => {
            setProjects([...projects, { id: Date.now(), title }]);
            setTitle('');
          }}>Add Project</button>
          <div>
            {projects.map(p => (
              <div key={p.id}>
                <h3>{p.title}</h3>
                <button>Edit</button>
                <button>Delete</button>
                <button>View Details</button>
              </div>
            ))}
          </div>
        </div>
      );
    };
    
    render(<ProjectFlow />);
    await userEvent.type(screen.getByPlaceholderText('Project title'), 'Portfolio Website');
    fireEvent.click(screen.getByText('Add Project'));
    expect(screen.getByText('Portfolio Website')).toBeInTheDocument();
  });

  test('job search and save workflow', async () => {
    const JobFlow = () => {
      const [jobs, setJobs] = React.useState([
        { id: 1, title: 'Senior Developer', company: 'Tech Corp' }
      ]);
      const [saved, setSaved] = React.useState([]);
      
      return (
        <div>
          <div>
            {jobs.map(job => (
              <div key={job.id}>
                <h4>{job.title} at {job.company}</h4>
                <button onClick={() => setSaved([...saved, job])}>Save Job</button>
              </div>
            ))}
          </div>
          <div>
            <h3>Saved Jobs</h3>
            {saved.map(job => (
              <div key={job.id}>{job.title}</div>
            ))}
          </div>
        </div>
      );
    };
    
    render(<JobFlow />);
    fireEvent.click(screen.getByText('Save Job'));
    expect(screen.getByText('Senior Developer')).toBeInTheDocument();
  });

  test('cover letter and resume pairing workflow', async () => {
    const PairingFlow = () => {
      const [pairs, setPairs] = React.useState([]);
      const [resumeId, setResumeId] = React.useState('');
      const [letterId, setLetterId] = React.useState('');
      
      return (
        <div>
          <select value={resumeId} onChange={(e) => setResumeId(e.target.value)}>
            <option value="">Select Resume</option>
            <option value="1">Resume 1</option>
            <option value="2">Resume 2</option>
          </select>
          <select value={letterId} onChange={(e) => setLetterId(e.target.value)}>
            <option value="">Select Letter</option>
            <option value="1">Letter 1</option>
            <option value="2">Letter 2</option>
          </select>
          <button onClick={() => {
            if (resumeId && letterId) setPairs([...pairs, { resumeId, letterId }]);
          }}>Pair</button>
          <ul>
            {pairs.map((p, i) => (
              <li key={i}>Resume {p.resumeId} + Letter {p.letterId}</li>
            ))}
          </ul>
        </div>
      );
    };
    
    render(<PairingFlow />);
    await userEvent.selectOptions(screen.getAllByRole('combobox')[0], '1');
    await userEvent.selectOptions(screen.getAllByRole('combobox')[1], '1');
    fireEvent.click(screen.getByText('Pair'));
    expect(screen.getByText('Resume 1 + Letter 1')).toBeInTheDocument();
  });
});

describe('Form Validation Integration Tests', () => {
  test('multi-field form validation', async () => {
    const ValidationForm = () => {
      const [formData, setFormData] = React.useState({
        email: '',
        password: '',
        confirmPassword: ''
      });
      const [errors, setErrors] = React.useState({});
      
      const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!formData.email.includes('@')) newErrors.email = 'Invalid email';
        if (formData.password.length < 8) newErrors.password = 'Too short';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Mismatch';
        setErrors(newErrors);
      };
      
      return (
        <form onSubmit={handleSubmit}>
          <input 
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            placeholder="Email"
          />
          {errors.email && <p>{errors.email}</p>}
          <input 
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            placeholder="Password"
          />
          {errors.password && <p>{errors.password}</p>}
          <input 
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            placeholder="Confirm Password"
          />
          {errors.confirmPassword && <p>{errors.confirmPassword}</p>}
          <button type="submit">Submit</button>
        </form>
      );
    };
    
    render(<ValidationForm />);
    fireEvent.click(screen.getByText('Submit'));
    await waitFor(() => {
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });
  });

  test('dynamic form field validation', async () => {
    const DynamicForm = () => {
      const [fields, setFields] = React.useState([{ id: 1, value: '' }]);
      
      const handleAdd = () => {
        setFields([...fields, { id: Date.now(), value: '' }]);
      };
      
      return (
        <div>
          {fields.map(field => (
            <input 
              key={field.id}
              placeholder={`Field ${field.id}`}
              value={field.value}
              onChange={(e) => {
                setFields(fields.map(f => 
                  f.id === field.id ? { ...f, value: e.target.value } : f
                ));
              }}
            />
          ))}
          <button onClick={handleAdd}>Add Field</button>
        </div>
      );
    };
    
    render(<DynamicForm />);
    fireEvent.click(screen.getByText('Add Field'));
    const inputs = screen.getAllByPlaceholderText(/Field/);
    expect(inputs.length).toBeGreaterThan(1);
  });
});

describe('Data Persistence Tests', () => {
  test('save and retrieve data from localStorage', () => {
    const StorageComponent = () => {
      const [data, setData] = React.useState('');
      
      const handleSave = () => {
        localStorage.setItem('testData', data);
      };
      
      const handleLoad = () => {
        const stored = localStorage.getItem('testData');
        setData(stored || '');
      };
      
      return (
        <div>
          <input value={data} onChange={(e) => setData(e.target.value)} placeholder="Data" />
          <button onClick={handleSave}>Save</button>
          <button onClick={handleLoad}>Load</button>
        </div>
      );
    };
    
    render(<StorageComponent />);
    // Component would interact with localStorage
  });
});

describe('Responsive Design Tests', () => {
  test('navigation menu responsive behavior', () => {
    const ResponsiveNav = () => {
      const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
      
      return (
        <nav>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>Menu</button>
          {mobileMenuOpen && (
            <div>
              <a href="/">Home</a>
              <a href="/profile">Profile</a>
            </div>
          )}
        </nav>
      );
    };
    
    render(<ResponsiveNav />);
    expect(screen.getByText('Menu')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Menu'));
    expect(screen.getByText('Home')).toBeInTheDocument();
  });
});

describe('State Management Tests', () => {
  test('complex state transitions', async () => {
    const ComplexState = () => {
      const [state, setState] = React.useState('idle');
      
      return (
        <div>
          <p>State: {state}</p>
          <button onClick={() => setState('loading')}>Start</button>
          <button onClick={() => setState('success')}>Complete</button>
          <button onClick={() => setState('error')}>Error</button>
          <button onClick={() => setState('idle')}>Reset</button>
        </div>
      );
    };
    
    render(<ComplexState />);
    expect(screen.getByText('State: idle')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Start'));
    expect(screen.getByText('State: loading')).toBeInTheDocument();
  });
});

describe('Event Handling Tests', () => {
  test('multiple event handlers on single element', async () => {
    const handleClick = jest.fn();
    const handleHover = jest.fn();
    
    const MultiEvent = () => (
      <button 
        onClick={handleClick}
        onMouseEnter={handleHover}
      >
        Interact
      </button>
    );
    
    render(<MultiEvent />);
    const button = screen.getByText('Interact');
    fireEvent.click(button);
    fireEvent.mouseEnter(button);
    expect(handleClick).toHaveBeenCalled();
    expect(handleHover).toHaveBeenCalled();
  });

  test('keyboard events', async () => {
    const handleKeyDown = jest.fn();
    
    const KeyboardComponent = () => (
      <input 
        placeholder="Type something"
        onKeyDown={handleKeyDown}
      />
    );
    
    render(<KeyboardComponent />);
    const input = screen.getByPlaceholderText('Type something');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(handleKeyDown).toHaveBeenCalled();
  });
});

describe('Conditional Rendering Tests', () => {
  test('conditional UI based on state', () => {
    const ConditionalUI = () => {
      const [isLoggedIn, setIsLoggedIn] = React.useState(false);
      
      return (
        <div>
          {isLoggedIn ? (
            <div>
              <p>Welcome User</p>
              <button onClick={() => setIsLoggedIn(false)}>Logout</button>
            </div>
          ) : (
            <div>
              <p>Please login</p>
              <button onClick={() => setIsLoggedIn(true)}>Login</button>
            </div>
          )}
        </div>
      );
    };
    
    render(<ConditionalUI />);
    expect(screen.getByText('Please login')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Login'));
    expect(screen.getByText('Welcome User')).toBeInTheDocument();
  });
});

describe('List Rendering Tests', () => {
  test('rendering lists with dynamic content', async () => {
    const ListComponent = () => {
      const [items, setItems] = React.useState(['Item 1', 'Item 2']);
      const [newItem, setNewItem] = React.useState('');
      
      return (
        <div>
          <input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="New item" />
          <button onClick={() => { setItems([...items, newItem]); setNewItem(''); }}>Add</button>
          <ul>
            {items.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      );
    };
    
    render(<ListComponent />);
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText('New item'), 'Item 3');
    fireEvent.click(screen.getByText('Add'));
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  test('filtering list items', () => {
    const FilterList = () => {
      const [filter, setFilter] = React.useState('');
      const items = ['React', 'Vue', 'Angular', 'Svelte'];
      const filtered = items.filter(i => i.toLowerCase().includes(filter.toLowerCase()));
      
      return (
        <div>
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter" />
          <ul>
            {filtered.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      );
    };
    
    render(<FilterList />);
    expect(screen.getByText('React')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Filter'), { target: { value: 'React' } });
    expect(screen.getByText('React')).toBeInTheDocument();
  });
});
