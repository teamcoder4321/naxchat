import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import './Wheel.css';

export const Wheel = () => {
  const { user, spinWheel } = useAuth();
  const [spinning, setSpinning] = useState(false);
  const [spinUsed, setSpinUsed] = useState(false);
  const [result, setResult] = useState(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const canvasRef = useRef(null);

  const segments = [
    { amount: 5, label: '+5', color: '#7c3aed' },
    { amount: 10, label: '+10', color: '#2563eb' },
    { amount: 15, label: '+15', color: '#7c3aed' },
    { amount: 25, label: '+25', color: '#2563eb' },
    { amount: 30, label: '+30', color: '#059669' },
    { amount: 50, label: '+50', color: '#d97706' },
    { amount: 100, label: '+100', color: '#2563eb' },
    { amount: 500, label: 'JACKPOT\n+500', color: '#dc2626' },
  ];

  useEffect(() => {
    drawWheel();
  }, [wheelRotation]);

  useEffect(() => {
    // Check if spin was used today
    if (user && user.dailySpinUsed) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastSpin = new Date(user.lastSpinDate);
      lastSpin.setHours(0, 0, 0, 0);

      if (lastSpin.getTime() === today.getTime()) {
        setSpinUsed(true);
      }
    }
  }, [user]);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 140;
    const arcSize = (Math.PI * 2) / segments.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    segments.forEach((segment, i) => {
      const startAngle = wheelRotation + i * arcSize - Math.PI / 2;
      const endAngle = startAngle + arcSize;

      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = segment.color;
      ctx.fill();

      // Draw border
      ctx.strokeStyle = '#0a0a0f';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + arcSize / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Arial, sans-serif';

      segment.label.split('\n').forEach((line, idx) => {
        ctx.fillText(line, radius - 10, idx * 14 - 7);
      });

      ctx.restore();
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a0f';
    ctx.fill();
    ctx.strokeStyle = '#2a2a3e';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const handleSpin = async () => {
    if (spinning || spinUsed) return;

    setSpinning(true);
    setResult(null);

    try {
      const response = await spinWheel();

      // Calculate target rotation
      const winIndex = segments.findIndex((s) => s.amount === response.won);
      const arcSize = (Math.PI * 2) / segments.length;
      const targetRotation =
        wheelRotation + Math.PI * 12 + (Math.PI * 2 - winIndex * arcSize - arcSize / 2);

      // Animate spin
      const startTime = Date.now();
      const duration = 4000;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentRotation = wheelRotation + (targetRotation - wheelRotation) * easeProgress;

        setWheelRotation(currentRotation);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setSpinning(false);
          setSpinUsed(true);
          setResult(response);
        }
      };

      animate();
    } catch (error) {
      setSpinning(false);
      alert('Failed to spin: ' + error.message);
    }
  };

  return (
    <div className="wheel-container">
      <div className="wheel-header">
        <h1>Daily Spin</h1>
        <p>Spin once per day to earn free credits</p>
      </div>

      <div className="wheel-canvas-wrapper">
        <div className="wheel-pointer" />
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          className="wheel-canvas"
        />
      </div>

      {result && (
        <div className="wheel-result">
          <div className="result-icon">🎉</div>
          <div className="result-text">
            You won <span className="result-amount">{result.won}</span> credits!
          </div>
        </div>
      )}

      <button
        className="spin-button"
        onClick={handleSpin}
        disabled={spinning || spinUsed}
      >
        {spinning ? 'Spinning...' : spinUsed ? "Come back tomorrow!" : "Spin the Wheel!"}
      </button>

      <div className="spin-info">
        {spinUsed ? (
          <p>✓ Spin used · Resets at midnight UTC</p>
        ) : (
          <p>🗓 Resets at midnight UTC · 1 spin per day</p>
        )}
      </div>

      {/* Spinning animation */}
      {spinning && <div className="spin-animation" />}
    </div>
  );
};
