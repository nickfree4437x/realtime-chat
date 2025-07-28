import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaUserAlt, FaGoogle, FaFacebook } from 'react-icons/fa';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '' 
  });
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();

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

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      email: '',
      password: ''
    };

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
      valid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await axios.post('https://realtime-chat-r1yy.onrender.com/api/auth/login', formData);
      setMessage({ 
        text: 'Login successful! Redirecting...', 
        type: 'success' 
      });
      setTimeout(() => {
        navigate('/chat');
      }, 1500);
    } catch (err) {
      setMessage({ 
        text: err.response?.data?.message || 'Login failed. Please try again.', 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const continueAsGuest = () => {
    navigate('/chat');
  };

  return (
    <div className="login-container">
      <div className="login-form-container">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-header">
            <h2 className="form-title">Welcome Back</h2>
            <p className="form-subtitle">Sign in to continue to your account</p>
          </div>

          <div className={`input-group ${errors.email ? 'error' : ''}`}>
            <div className="input-icon">
              <FaEnvelope />
            </div>
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
            />
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
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <button 
            type="submit" 
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>

          <div className="divider">
            <span>or</span>
          </div>

          <button 
            type="button" 
            onClick={continueAsGuest} 
            className="guest-btn"
          >
            <FaUserAlt className="guest-icon" />
            Continue as Guest
          </button>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <p className="signup-link">
            Don't have an account? <a href="/signup">Sign Up</a>
          </p>
        </form>
      </div>

      <div className="login-hero">
        <div className="hero-content">
          <div className="hero-image">
            <img src="https://illustrations.popsy.co/amber/digital-nomad.svg" alt="Signup Illustration" />
          </div>
          <h2>Connect with your community</h2>
          <p>Join thousands of users who are already part of our platform</p>
        </div>
      </div>
    </div>
  );
};

export default Login;