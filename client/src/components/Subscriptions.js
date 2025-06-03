import React from 'react';
import './Subscriptions.css';

const Subscriptions = () => {
  return (
    <div className="subscriptions-container">
      <div className="subscriptions-header">
        <h1>Choose Your Plan</h1>
        <p>Select the perfect plan for your transcription needs</p>
      </div>

      <div className="pricing-grid">
        {/* Free Tier */}
        <div className="pricing-card">
          <div className="pricing-header">
            <h2>🆓 Free Tier</h2>
            <div className="price">
              <span className="amount">Free</span>
            </div>
            <p className="tier-description">Perfect for testing the tool and short projects</p>
          </div>
          <ul className="features-list">
            <li><span>Upload up to 15 minutes of footage per month</span></li>
            <li><span>Basic transcription with lower accuracy</span></li>
            <li><span>Includes watermark on all outputs</span></li>
            <li><span>Export disabled (view-only transcripts)</span></li>
          </ul>
          <p className="tier-note">This tier gives you a taste of the service, but with limited access and lower precision compared to paid plans.</p>
          <button className="subscribe-button">Get Started</button>
        </div>

        {/* Pro Tier */}
        <div className="pricing-card featured">
          <div className="popular-tag">Most Popular</div>
          <div className="pricing-header">
            <h2>⭐ Pro Tier</h2>
            <div className="price">
              <span className="currency">£</span>
              <span className="amount">10</span>
              <span className="period">/month</span>
            </div>
            <p className="tier-description">Ideal for solo creators, freelancers, and regular users</p>
          </div>
          <ul className="features-list">
            <li><span>Upload up to 10 hours of video per month</span></li>
            <li><span>Full transcription with higher accuracy</span></li>
            <li><span>Includes a text summary of the video</span></li>
            <li><span>Exports enabled: PDF, DOCX, text, etc.</span></li>
            <li><span>No watermark</span></li>
          </ul>
          <p className="tier-note">Designed for users who need consistent, clean, and shareable transcripts.</p>
          <button className="subscribe-button featured">Get Started</button>
        </div>

        {/* Premium Tier */}
        <div className="pricing-card">
          <div className="pricing-header">
            <h2>🚀 Premium Tier</h2>
            <div className="price">
              <span className="currency">£</span>
              <span className="amount">30</span>
              <span className="period">/month</span>
            </div>
            <p className="tier-description">Built for power users, agencies, and teams</p>
          </div>
          <ul className="features-list">
            <li><span>Upload up to 50 hours of footage per month</span></li>
            <li><span>Top-tier transcription accuracy</span></li>
            <li><span>Includes translation into other languages</span></li>
            <li><span>Everything in the Pro Plan</span></li>
            <li><span>Priority support</span></li>
            <li><span>Advanced API access</span></li>
          </ul>
          <button className="subscribe-button">Get Started</button>
        </div>
      </div>
    </div>
  );
};

export default Subscriptions; 