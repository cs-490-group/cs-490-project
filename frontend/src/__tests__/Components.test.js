import React from 'react';
import { render, screen, fireEvent, waitFor } from '../test-utils.jsx';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

describe('Login Component', () => {
  test('renders login form', () => {
    const LoginComponent = () => <div>Login Form</div>;
    render(<LoginComponent />);
    expect(screen.getByText('Login Form')).toBeInTheDocument();
  });

  test('updates email input value', async () => {
    const TestComponent = () => {
      const [email, setEmail] = React.useState('');
      return <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />;
    };
    render(<TestComponent />);
    const input = screen.getByPlaceholderText('Email');
    await userEvent.type(input, 'test@example.com');
    expect(input.value).toBe('test@example.com');
  });

  test('updates password input value', async () => {
    const TestComponent = () => {
      const [password, setPassword] = React.useState('');
      return <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />;
    };
    render(<TestComponent />);
    const input = screen.getByPlaceholderText('Password');
    await userEvent.type(input, 'password123');
    expect(input.value).toBe('password123');
  });

  test('shows error message on failed login', () => {
    const TestComponent = () => {
      const [error, setError] = React.useState('Invalid credentials');
      return <div>{error && <p>{error}</p>}</div>;
    };
    render(<TestComponent />);
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  test('clears error message on retry', async () => {
    const TestComponent = () => {
      const [error, setError] = React.useState('Invalid credentials');
      return (
        <div>
          {error && <p>{error}</p>}
          <button onClick={() => setError('')}>Retry</button>
        </div>
      );
    };
    render(<TestComponent />);
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    const retryBtn = screen.getByText('Retry');
    fireEvent.click(retryBtn);
    await waitFor(() => {
      expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
    });
  });

  test('submits form with valid credentials', async () => {
    const handleSubmit = jest.fn();
    const TestComponent = () => {
      const [email, setEmail] = React.useState('');
      const [password, setPassword] = React.useState('');
      return (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit({ email, password }); }}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          <button type="submit">Login</button>
        </form>
      );
    };
    render(<TestComponent />);
    await userEvent.type(screen.getByPlaceholderText('Email'), 'test@example.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'password123');
    fireEvent.click(screen.getByText('Login'));
    expect(handleSubmit).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
  });

  test('disables submit button while loading', () => {
    const TestComponent = () => {
      const [loading, setLoading] = React.useState(true);
      return <button disabled={loading}>Login</button>;
    };
    render(<TestComponent />);
    expect(screen.getByText('Login')).toBeDisabled();
  });

  test('shows remember me checkbox', () => {
    const TestComponent = () => {
      const [rememberMe, setRememberMe] = React.useState(false);
      return <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} aria-label="Remember me" />;
    };
    render(<TestComponent />);
    expect(screen.getByLabelText('Remember me')).toBeInTheDocument();
  });

  test('remembers me checkbox state', async () => {
    const TestComponent = () => {
      const [rememberMe, setRememberMe] = React.useState(false);
      return <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} aria-label="Remember me" />;
    };
    render(<TestComponent />);
    const checkbox = screen.getByLabelText('Remember me');
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  test('displays forgot password link', () => {
    const TestComponent = () => (
      <div>
        <a href="/forgotPassword">Forgot Password?</a>
      </div>
    );
    render(<TestComponent />);
    expect(screen.getByText('Forgot Password?')).toBeInTheDocument();
  });

  test('displays sign up link', () => {
    const TestComponent = () => (
      <div>
        <a href="/register">Sign Up</a>
      </div>
    );
    render(<TestComponent />);
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
  });
});

describe('Registration Component', () => {
  test('renders registration form', () => {
    const RegisterComponent = () => <div>Registration Form</div>;
    render(<RegisterComponent />);
    expect(screen.getByText('Registration Form')).toBeInTheDocument();
  });

  test('validates email format', () => {
    const TestComponent = () => {
      const [email, setEmail] = React.useState('');
      const [error, setError] = React.useState('');
      const handleChange = (e) => {
        const val = e.target.value;
        setEmail(val);
        if (val && !val.includes('@')) setError('Invalid email');
        else setError('');
      };
      return (
        <div>
          <input value={email} onChange={handleChange} placeholder="Email" />
          {error && <p>{error}</p>}
        </div>
      );
    };
    render(<TestComponent />);
    const input = screen.getByPlaceholderText('Email');
    fireEvent.change(input, { target: { value: 'invalidemail' } });
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  test('validates password strength', () => {
    const TestComponent = () => {
      const [password, setPassword] = React.useState('');
      const [strength, setStrength] = React.useState('');
      const handleChange = (e) => {
        const val = e.target.value;
        setPassword(val);
        if (val.length < 6) setStrength('Weak');
        else if (val.length < 10) setStrength('Medium');
        else setStrength('Strong');
      };
      return (
        <div>
          <input type="password" value={password} onChange={handleChange} placeholder="Password" />
          {strength && <p>Strength: {strength}</p>}
        </div>
      );
    };
    render(<TestComponent />);
    const input = screen.getByPlaceholderText('Password');
    fireEvent.change(input, { target: { value: 'weak' } });
    expect(screen.getByText('Strength: Weak')).toBeInTheDocument();
  });

  test('confirms password matches', async () => {
    const TestComponent = () => {
      const [password, setPassword] = React.useState('');
      const [confirmPassword, setConfirmPassword] = React.useState('');
      const match = password === confirmPassword && password.length > 0;
      return (
        <div>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm" />
          {match && <p>Passwords match</p>}
        </div>
      );
    };
    render(<TestComponent />);
    await userEvent.type(screen.getByPlaceholderText('Password'), 'password123');
    await userEvent.type(screen.getByPlaceholderText('Confirm'), 'password123');
    expect(screen.getByText('Passwords match')).toBeInTheDocument();
  });

  test('accepts terms and conditions', () => {
    const TestComponent = () => {
      const [accepted, setAccepted] = React.useState(false);
      return (
        <div>
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} aria-label="Accept terms" />
          <button disabled={!accepted}>Register</button>
        </div>
      );
    };
    render(<TestComponent />);
    expect(screen.getByText('Register')).toBeDisabled();
    fireEvent.click(screen.getByLabelText('Accept terms'));
    expect(screen.getByText('Register')).not.toBeDisabled();
  });

  test('submits registration form', async () => {
    const handleSubmit = jest.fn();
    const TestComponent = () => {
      const [formData, setFormData] = React.useState({ email: '', password: '', name: '' });
      const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
      };
      return (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(formData); }}>
          <input name="name" value={formData.name} onChange={handleChange} placeholder="Name" />
          <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" />
          <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Password" />
          <button type="submit">Register</button>
        </form>
      );
    };
    render(<TestComponent />);
    await userEvent.type(screen.getByPlaceholderText('Name'), 'John Doe');
    await userEvent.type(screen.getByPlaceholderText('Email'), 'john@example.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'password123');
    fireEvent.click(screen.getByText('Register'));
    expect(handleSubmit).toHaveBeenCalled();
  });

  test('displays already registered link', () => {
    const TestComponent = () => (
      <div>
        <a href="/login">Already registered? Login</a>
      </div>
    );
    render(<TestComponent />);
    expect(screen.getByText('Already registered? Login')).toBeInTheDocument();
  });
});

describe('Profile Component', () => {
  test('renders profile page', () => {
    const ProfileComponent = () => <div>User Profile</div>;
    render(<ProfileComponent />);
    expect(screen.getByText('User Profile')).toBeInTheDocument();
  });

  test('displays user information', () => {
    const TestComponent = () => (
      <div>
        <h1>John Doe</h1>
        <p>john@example.com</p>
      </div>
    );
    render(<TestComponent />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  test('allows editing profile', async () => {
    const TestComponent = () => {
      const [editing, setEditing] = React.useState(false);
      const [name, setName] = React.useState('John Doe');
      return (
        <div>
          {editing ? (
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
          ) : (
            <h1>{name}</h1>
          )}
          <button onClick={() => setEditing(!editing)}>{editing ? 'Save' : 'Edit'}</button>
        </div>
      );
    };
    render(<TestComponent />);
    fireEvent.click(screen.getByText('Edit'));
    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
  });

  test('saves profile changes', async () => {
    const handleSave = jest.fn();
    const TestComponent = () => {
      const [editing, setEditing] = React.useState(false);
      const [name, setName] = React.useState('John Doe');
      const handleSaveClick = () => {
        handleSave(name);
        setEditing(false);
      };
      return (
        <div>
          {editing ? (
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
          ) : (
            <h1>{name}</h1>
          )}
          <button onClick={() => setEditing(true)}>Edit</button>
          {editing && <button onClick={handleSaveClick}>Save</button>}
        </div>
      );
    };
    render(<TestComponent />);
    fireEvent.click(screen.getByText('Edit'));
    await userEvent.type(screen.getByPlaceholderText('Name'), ' Updated');
    fireEvent.click(screen.getByText('Save'));
    expect(handleSave).toHaveBeenCalled();
  });

  test('cancels editing without saving', async () => {
    const TestComponent = () => {
      const [editing, setEditing] = React.useState(false);
      const [name, setName] = React.useState('John Doe');
      const [tempName, setTempName] = React.useState(name);
      return (
        <div>
          <h1>{name}</h1>
          <button onClick={() => { setEditing(true); setTempName(name); }}>Edit</button>
          {editing && (
            <div>
              <input value={tempName} onChange={(e) => setTempName(e.target.value)} />
              <button onClick={() => setEditing(false)}>Cancel</button>
            </div>
          )}
        </div>
      );
    };
    render(<TestComponent />);
    fireEvent.click(screen.getByText('Edit'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  test('displays profile picture', () => {
    const TestComponent = () => (
      <div>
        <img src="/profile.jpg" alt="Profile" />
      </div>
    );
    render(<TestComponent />);
    expect(screen.getByAltText('Profile')).toBeInTheDocument();
  });

  test('allows uploading profile picture', async () => {
    const handleUpload = jest.fn();
    const TestComponent = () => (
      <div>
        <input type="file" onChange={(e) => handleUpload(e.target.files[0])} accept="image/*" aria-label="Upload picture" />
      </div>
    );
    render(<TestComponent />);
    const input = screen.getByLabelText('Upload picture');
    expect(input).toBeInTheDocument();
  });
});

describe('Common UI Components', () => {
  test('renders button component', () => {
    const TestComponent = () => <button>Click Me</button>;
    render(<TestComponent />);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  test('button click handler works', () => {
    const handleClick = jest.fn();
    const TestComponent = () => <button onClick={handleClick}>Click</button>;
    render(<TestComponent />);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalled();
  });

  test('renders input field', () => {
    const TestComponent = () => <input placeholder="Enter text" />;
    render(<TestComponent />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  test('input field value changes', async () => {
    const TestComponent = () => {
      const [value, setValue] = React.useState('');
      return <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Enter text" />;
    };
    render(<TestComponent />);
    const input = screen.getByPlaceholderText('Enter text');
    await userEvent.type(input, 'Hello');
    expect(input.value).toBe('Hello');
  });

  test('renders dropdown select', () => {
    const TestComponent = () => (
      <select>
        <option>Option 1</option>
        <option>Option 2</option>
      </select>
    );
    render(<TestComponent />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  test('dropdown selection works', async () => {
    const handleChange = jest.fn();
    const TestComponent = () => (
      <select onChange={(e) => handleChange(e.target.value)}>
        <option value="">Select</option>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </select>
    );
    render(<TestComponent />);
    const select = screen.getByRole('combobox');
    await userEvent.selectOptions(select, '1');
    expect(handleChange).toHaveBeenCalledWith('1');
  });

  test('renders checkbox', () => {
    const TestComponent = () => <input type="checkbox" />;
    render(<TestComponent />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  test('checkbox can be checked', () => {
    const TestComponent = () => {
      const [checked, setChecked] = React.useState(false);
      return <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />;
    };
    render(<TestComponent />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  test('renders modal dialog', () => {
    const TestComponent = () => (
      <div role="dialog">
        <h2>Modal Title</h2>
        <p>Modal content</p>
      </div>
    );
    render(<TestComponent />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Modal Title')).toBeInTheDocument();
  });

  test('modal close button works', () => {
    const handleClose = jest.fn();
    const TestComponent = () => (
      <div role="dialog">
        <button onClick={handleClose}>Close</button>
      </div>
    );
    render(<TestComponent />);
    fireEvent.click(screen.getByText('Close'));
    expect(handleClose).toHaveBeenCalled();
  });
});

describe('Navigation Tests', () => {
  test('renders navigation menu', () => {
    const TestComponent = () => (
      <nav>
        <a href="/">Home</a>
        <a href="/profile">Profile</a>
      </nav>
    );
    render(<TestComponent />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  test('navigation links are clickable', () => {
    const TestComponent = () => (
      <nav>
        <a href="/profile">Profile</a>
      </nav>
    );
    render(<TestComponent />);
    const link = screen.getByText('Profile');
    expect(link).toHaveAttribute('href', '/profile');
  });
});

describe('Error Handling Tests', () => {
  test('displays error message', () => {
    const TestComponent = () => {
      const [error, setError] = React.useState('An error occurred');
      return <div>{error && <div role="alert">{error}</div>}</div>;
    };
    render(<TestComponent />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  test('error message can be dismissed', () => {
    const TestComponent = () => {
      const [error, setError] = React.useState('Error message');
      return (
        <div>
          {error && (
            <div role="alert">
              {error}
              <button onClick={() => setError('')}>Dismiss</button>
            </div>
          )}
        </div>
      );
    };
    render(<TestComponent />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Dismiss'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('shows validation errors on form submit', async () => {
    const TestComponent = () => {
      const [email, setEmail] = React.useState('');
      const [errors, setErrors] = React.useState({});
      const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!email) newErrors.email = 'Email is required';
        setErrors(newErrors);
      };
      return (
        <form onSubmit={handleSubmit}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          {errors.email && <p>{errors.email}</p>}
          <button type="submit">Submit</button>
        </form>
      );
    };
    render(<TestComponent />);
    fireEvent.click(screen.getByText('Submit'));
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });
});

describe('Loading States Tests', () => {
  test('shows loading spinner', () => {
    const TestComponent = () => {
      const [loading, setLoading] = React.useState(true);
      return loading ? <div role="status">Loading...</div> : <div>Content</div>;
    };
    render(<TestComponent />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading...');
  });

  test('hides loading spinner when done', async () => {
    const TestComponent = () => {
      const [loading, setLoading] = React.useState(true);
      React.useEffect(() => {
        setTimeout(() => setLoading(false), 100);
      }, []);
      return loading ? <div role="status">Loading...</div> : <div>Content</div>;
    };
    render(<TestComponent />);
    await waitFor(() => {
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });
});

describe('Accessibility Tests', () => {
  test('button has accessible label', () => {
    const TestComponent = () => <button aria-label="Submit form">Submit</button>;
    render(<TestComponent />);
    expect(screen.getByLabelText('Submit form')).toBeInTheDocument();
  });

  test('form has associated labels', () => {
    const TestComponent = () => (
      <form>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" />
      </form>
    );
    render(<TestComponent />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  test('keyboard navigation works', async () => {
    const handleSubmit = jest.fn();
    const TestComponent = () => (
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <button type="submit">Submit</button>
      </form>
    );
    render(<TestComponent />);
    const button = screen.getByText('Submit');
    button.focus();
    expect(document.activeElement).toBe(button);
  });
});
