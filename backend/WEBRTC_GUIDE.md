// WebRTC Implementation Guide for NexChat
// Using simple-peer library for P2P video

// ============================================
// FRONTEND: WebRTC Video Component
// ============================================

import React, { useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';
import { useSocket } from '../context/SocketContext';

export const VideoCall = ({ remoteUser }) => {
  const [peer, setPeer] = useState(null);
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const { socket } = useSocket();

  // Initialize WebRTC on mount
  useEffect(() => {
    initializeWebRTC();

    return () => {
      // Cleanup on unmount
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (peer) {
        peer.destroy();
      }
    };
  }, []);

  const initializeWebRTC = async () => {
    try {
      // Get user media (audio + video)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setStream(mediaStream);

      // Display local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
      }

      // Initialize peer connection
      initializePeer(mediaStream);
    } catch (error) {
      console.error('Error accessing media:', error);
      alert('Unable to access camera/microphone');
    }
  };

  const initializePeer = (mediaStream) => {
    const initiator = Math.random() > 0.5; // Randomly decide who initiates

    const newPeer = new SimplePeer({
      initiator,
      trickIce: true,
      stream: mediaStream,
      iceServers: [
        {
          urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'],
        },
        // Add TURN server for NAT traversal (optional)
        // {
        //   urls: 'turn:your-turn-server.com',
        //   username: 'username',
        //   credential: 'password'
        // }
      ],
    });

    // Handle stream from remote peer
    newPeer.on('stream', (remoteStream) => {
      setRemoteStream(remoteStream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });

    // Send offer to remote peer
    newPeer.on('signal', (data) => {
      if (data.type === 'offer') {
        socket.emit('webrtc:offer', {
          to: remoteUser.socketId,
          offer: data,
        });
      } else if (data.type === 'answer') {
        socket.emit('webrtc:answer', {
          to: remoteUser.socketId,
          answer: data,
        });
      }
    });

    // Handle ICE candidates
    newPeer.on('icecandidate', (candidate) => {
      if (candidate) {
        socket.emit('webrtc:ice-candidate', {
          to: remoteUser.socketId,
          candidate,
        });
      }
    });

    newPeer.on('error', (err) => {
      console.error('Peer error:', err);
    });

    newPeer.on('close', () => {
      console.log('Peer connection closed');
      setRemoteStream(null);
    });

    setPeer(newPeer);
  };

  // Handle incoming signals
  useEffect(() => {
    if (!socket || !peer) return;

    socket.on('webrtc:offer', (data) => {
      peer.signal(data.offer);
    });

    socket.on('webrtc:answer', (data) => {
      peer.signal(data.answer);
    });

    socket.on('webrtc:ice-candidate', (data) => {
      if (data.candidate) {
        peer.addIceCandidate(data.candidate);
      }
    });

    return () => {
      socket.off('webrtc:offer');
      socket.off('webrtc:answer');
      socket.off('webrtc:ice-candidate');
    };
  }, [socket, peer]);

  const toggleAudio = () => {
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
  };

  return (
    <div className="video-call">
      <div className="video-container">
        <div className="video-remote">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted={false}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div className="video-label">{remoteUser?.username}</div>
        </div>

        <div className="video-local">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div className="video-label">You</div>
        </div>
      </div>

      <div className="video-controls">
        <button onClick={toggleAudio} className="control-btn">
          🎤 Mute
        </button>
        <button onClick={toggleVideo} className="control-btn">
          📷 Camera
        </button>
        <button className="control-btn end">
          📞 End Call
        </button>
      </div>
    </div>
  );
};

// ============================================
// INSTALLATION STEPS
// ============================================

/*
1. Install simple-peer:
   npm install simple-peer

2. Add to SocketContext.js:
   - Handle 'webrtc:offer', 'webrtc:answer', 'webrtc:ice-candidate' events
   - Relay them to matched user

3. Add TURN server (for production):
   - Use Twilio: https://www.twilio.com/stun-turn
   - Or coturn: https://github.com/coturn/coturn
   - Configure in WebRTC config

4. Handle permissions:
   - Browser will ask for camera/microphone access
   - Handle user's permission response

5. Add error handling:
   - Network errors
   - Permission denied
   - Browser compatibility
   - Device not found
*/

// ============================================
// DEPLOYMENT NOTES
// ============================================

/*
STUN Servers (free):
  - stun.l.google.com:19302
  - stun1.l.google.com:19302
  - stun2.l.google.com:19302

TURN Servers (for NAT/firewall traversal):
  Option 1: Twilio (paid)
  - High reliability
  - Global coverage
  - Enterprise support
  
  Option 2: coturn (self-hosted)
  - Open source
  - Can run on any server
  - Installation:
    apt-get install coturn
    systemctl start coturn
    Configure /etc/coturn/turnserver.conf
  
  Option 3: AWS TURN (paid)
  - Integrated with AWS infrastructure
  - High performance

For production:
  - Use both STUN and TURN
  - Monitor connection quality
  - Add fallback mechanisms
  - Test with various network conditions
*/

// ============================================
// BROWSER COMPATIBILITY
// ============================================

/*
Chrome/Edge: Full support ✅
Firefox: Full support ✅
Safari: Full support (iOS 11+) ✅
IE: Not supported ❌

Check browser support:
if (navigator.mediaDevices?.getUserMedia) {
  // Browser supports WebRTC
}

Fallback for older browsers:
- Use UpUp library for offline detection
- Show user-friendly error message
- Suggest browser update
*/

// ============================================
// PERFORMANCE OPTIMIZATION
// ============================================

/*
Video Codec Selection:
- H264 (VP9): Better compression, higher CPU
- VP8: Good quality, lower CPU
- Let browser choose (default)

Quality Settings:
{
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  },
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 }
  }
}

Adaptive bitrate:
- Start with high quality
- Monitor bandwidth
- Reduce if needed
- Implemented in simple-peer automatically
*/

// ============================================
// TESTING CHECKLIST
// ============================================

/*
1. Camera/Microphone:
   ✓ Permission prompt appears
   ✓ Local video displays
   ✓ Audio/video can be toggled
   
2. P2P Connection:
   ✓ Offer/answer exchange works
   ✓ ICE candidates exchanged
   ✓ Remote video appears
   
3. Network:
   ✓ Works on same network
   ✓ Works across different networks
   ✓ Handles connection loss gracefully
   ✓ Reconnects automatically
   
4. Quality:
   ✓ Video smooth at 30fps
   ✓ Audio clear without echo
   ✓ Latency < 200ms
   ✓ Works on 4G/5G
   
5. Edge cases:
   ✓ One user enables/disables camera
   ✓ Network switches (WiFi to 4G)
   ✓ Call ends abruptly
   ✓ Multiple calls in succession
*/
