import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaCheck, FaTimes } from 'react-icons/fa';
import './Signup.css';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      username: '',
      email: '',
      password: ''
    };

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
      valid = false;
    } else if (formData.username.length < 4) {
      newErrors.username = 'Username must be at least 4 characters';
      valid = false;
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
      valid = false;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await axios.post('https://realtime-chat-r1yy.onrender.com/api/auth/register', formData);
      setMessage({ text: res.data.message, type: 'success' });
      setFormData({ username: '', email: '', password: '' });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Something went wrong';
      setMessage({ text: errorMsg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-form-container">
        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="form-header">
            <h2 className="form-title">Create Account</h2>
            <p className="form-subtitle">Join our community today</p>
          </div>

          <div className={`input-group ${errors.username ? 'error' : ''}`}>
            <div className="input-icon">
              <FaUser />
            </div>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
            />
            {formData.username && !errors.username && (
              <div className="input-success">
                <FaCheck />
              </div>
            )}
            {errors.username && (
              <div className="input-error">
                <FaTimes />
              </div>
            )}
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>

          <div className={`input-group ${errors.email ? 'error' : ''}`}>
            <div className="input-icon">
              <FaEnvelope />
            </div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
            />
            {formData.email && !errors.email && (
              <div className="input-success">
                <FaCheck />
              </div>
            )}
            {errors.email && (
              <div className="input-error">
                <FaTimes />
              </div>
            )}
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className={`input-group ${errors.password ? 'error' : ''}`}>
            <div className="input-icon">
              <FaLock />
            </div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />
            {formData.password && !errors.password && (
              <div className="input-success">
                <FaCheck />
              </div>
            )}
            {errors.password && (
              <div className="input-error">
                <FaTimes />
              </div>
            )}
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <button 
            type="submit" 
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Sign Up'}
          </button>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="form-footer">
            <p className="login-link">
              Already have an account? <a href="/">Login</a>
            </p>
          </div>
        </form>
      </div>

      <div className="signup-hero">
        <div className="hero-content">
          <div className="hero-image">
            <img src="https://illustrations.popsy.co/amber/digital-nomad.svg" alt="Signup Illustration" />
          </div>
          <h2>Welcome to Our Platform</h2>
          <p>Join thousands of users who are already benefiting from our services</p>
          <div className="features">
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Premium content access</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>24/7 customer support</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Secure data protection</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;