import React, { useRef, useMemo, Suspense, useEffect, useState } from 'react';
import { CivicAuthIframeContainer, CivicAuthProvider } from '@civic/auth/react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatedText } from '../components/ui/animated-text';


const vertexShader = `
varying vec2 vUv;
uniform float time;
uniform vec4 resolution;

void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;
varying vec2 vUv;
uniform float time;
uniform vec4 resolution;

float PI = 3.141592653589793238;

mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

vec3 rotate(vec3 v, vec3 axis, float angle) {
    mat4 m = rotationMatrix(axis, angle);
    return (m * vec4(v, 1.0)).xyz;
}

float smin( float a, float b, float k ) {
    k *= 6.0;
    float h = max( k-abs(a-b), 0.0 )/k;
    return min(a,b) - h*h*h*k*(1.0/6.0);
}

float sphereSDF(vec3 p, float r) {
    return length(p) - r;
}

float sdf(vec3 p) {
    vec3 p1 = rotate(p, vec3(0.0, 0.0, 1.0), time/5.0);
    vec3 p2 = rotate(p, vec3(1.), -time/5.0);
    vec3 p3 = rotate(p, vec3(1., 1., 0.), -time/4.5);
    vec3 p4 = rotate(p, vec3(0., 1., 0.), -time/4.0);
    vec3 p5 = rotate(p, vec3(1., 0., 1.), time/3.5);
    vec3 p6 = rotate(p, vec3(0., 1., 1.), -time/6.0);
    vec3 p7 = rotate(p, vec3(1., 1., 1.), time/4.2);
    
    float final = sphereSDF(p1 - vec3(-0.5, 0.0, 0.0), 0.2);
    float nextSphere = sphereSDF(p2 - vec3(-0.35, 0.0, 0.0), 0.18);
    final = smin(final, nextSphere, 0.1);
    nextSphere = sphereSDF(p2 - vec3(-0.8, 0.0, 0.0), 0.12);
    final = smin(final, nextSphere, 0.1);
    nextSphere = sphereSDF(p3 - vec3(1.0, 0.0, 0.0), 0.08);
    final = smin(final, nextSphere, 0.1);
    nextSphere = sphereSDF(p4 - vec3(0.45, -0.45, 0.0), 0.08);
    final = smin(final, nextSphere, 0.1);
    // Additional spheres for more bubbles
    nextSphere = sphereSDF(p5 - vec3(-0.3, 0.6, 0.0), 0.14);
    final = smin(final, nextSphere, 0.1);
    nextSphere = sphereSDF(p7 - vec3(-0.6, -0.3, 0.0), 0.16);
    final = smin(final, nextSphere, 0.1);
    nextSphere = sphereSDF(p6 - vec3(0.7, -0.2, 0.0), 0.13);
    final = smin(final, nextSphere, 0.1);
    
    return final;
}

vec3 getNormal(vec3 p) {
    float d = 0.001;
    return normalize(vec3(
        sdf(p + vec3(d, 0.0, 0.0)) - sdf(p - vec3(d, 0.0, 0.0)),
        sdf(p + vec3(0.0, d, 0.0)) - sdf(p - vec3(0.0, d, 0.0)),
        sdf(p + vec3(0.0, 0.0, d)) - sdf(p - vec3(0.0, 0.0, d))
    ));
}

float rayMarch(vec3 rayOrigin, vec3 ray) {
    float t = 0.0;
    for (int i = 0; i < 100; i++) {
        vec3 p = rayOrigin + ray * t;
        float d = sdf(p);
        if (d < 0.001) return t;
        t += d;
        if (t > 100.0) break;
    }
    return -1.0;
}

void main() {
    vec2 newUV = (vUv - vec2(0.5)) * resolution.zw + vec2(0.5);
    vec3 cameraPos = vec3(0.0, 0.0, 5.0);
    vec3 ray = normalize(vec3((vUv - vec2(0.5)) * resolution.zw, -1));
    vec3 color = vec3(1.0, 1.0, 1.0);
    
    float t = rayMarch(cameraPos, ray);
    if (t > 0.0) {
        vec3 p = cameraPos + ray * t;
        vec3 normal = getNormal(p);
        float fresnel = pow(1.0 + dot(ray, normal), 3.0);
        
        vec3 greenColor = vec3(0.2, 0.8, 0.4);
        color = mix(greenColor, vec3(0.4, 1.0, 0.6), fresnel);
        
        gl_FragColor = vec4(color, 1.0);
    } else {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
}
`;

function SmallBubblesLavaLampShader() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size } = useThree();
  
  const uniforms = useMemo(() => ({
    time: { value: 0 },
    resolution: { value: new THREE.Vector4() }
  }), []);

  React.useEffect(() => {
    const { width, height } = size;
    const imageAspect = 1;
    let a1, a2;
    
    if (height / width > imageAspect) {
      a1 = (width / height) * imageAspect;
      a2 = 1;
    } else {
      a1 = 1;
      a2 = (height / width) / imageAspect;
    }
    
    uniforms.resolution.value.set(width, height, a1, a2);
  }, [size, uniforms]);

  useFrame((state) => {
    if (meshRef.current) {
      uniforms.time.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[5, 5]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
}

const FallbackBackground: React.FC = () => (
  <div style={{
    width: '100%',
    height: '100%',
    background: '#ffffff',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 0
  }} />
);

const SmallBubblesLavaLamp: React.FC = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Simple initialization delay
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 50); // Minimal delay

    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return <FallbackBackground />;
  }

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      background: '#ffffff',
      position: "absolute", 
      top: 0, 
      left: 0,
      zIndex: 0
    }}>
      <Suspense fallback={<FallbackBackground />}>
        <Canvas
          camera={{
            left: -0.5,
            right: 0.5,
            top: 0.5,
            bottom: -0.5,
            near: -1000,
            far: 1000,
            position: [0, 0, 2]
          }}
          orthographic
          gl={{ antialias: true }}
          onCreated={({ gl }) => {
            gl.setClearColor('#ffffff', 1);
          }}
        >
          <SmallBubblesLavaLampShader />
        </Canvas>
      </Suspense>
    </div>
  );
};

// Isolated Civic Auth Component for Login Page
const IsolatedCivicAuth: React.FC = () => {
  const [key, setKey] = useState(0);

  useEffect(() => {
    // Force remount whenever location changes
    setKey(prev => prev + 1);

    // Preload iframe to reduce initialization time
    const preloadIframe = document.createElement('iframe');
    preloadIframe.style.display = 'none';
    preloadIframe.src = 'about:blank';
    document.body.appendChild(preloadIframe);
    
    // Clean up preload iframe after brief initialization
    const cleanup = setTimeout(() => {
      if (document.body.contains(preloadIframe)) {
        document.body.removeChild(preloadIframe);
      }
    }, 100);

    return () => {
      clearTimeout(cleanup);
      if (document.body.contains(preloadIframe)) {
        document.body.removeChild(preloadIframe);
      }
    };
  }, []);

  const clientId = import.meta.env.VITE_CIVIC_CLIENT_ID;

  if (!clientId) {
    return (
      <div className="text-center p-4">
        <p className="text-red-600">Error: Civic Auth not configured</p>
      </div>
    );
  }

  const handleSignIn = () => {
    // Handle successful sign-in by redirecting the top-level window to dashboard
    // This ensures we break out of any iframe context
    try {
      // Use top-level window to ensure we break out of iframe
      window.top!.location.href = `${window.location.origin}/dashboard`;
    } catch (error) {
      // Fallback if top-level access is restricted
      window.location.href = `${window.location.origin}/dashboard`;
    }
  };

  return (
    <CivicAuthProvider
      key={`login-civic-${key}`}
      clientId={clientId}
      redirectUrl={`${window.location.origin}/dashboard`}
      iframeMode="embedded"
      onSignIn={handleSignIn}
    >
      <CivicAuthIframeContainer />
    </CivicAuthProvider>
  );
};

export const LoginPage: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [isNavigatedFrom, setIsNavigatedFrom] = useState(false);

  useEffect(() => {

    const isFromNavigation = Boolean(document.referrer && 
                            document.referrer.includes(window.location.origin) &&
                            !document.referrer.includes('/login'));
    
    setIsNavigatedFrom(isFromNavigation);
    
    // Add a slight delay only when navigating from other pages
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, isFromNavigation ? 300 : 0); // 300ms delay only for navigation, instant for direct access

    return () => clearTimeout(timer);
  }, []);

  // Show loading state only when navigating from other pages
  if (!isMounted && isNavigatedFrom) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing secure login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative">
      {/* Desktop: Left Half - Moving Bubbles (60% width), Mobile: Full Screen Background */}
      <div className="w-full lg:w-3/5 relative overflow-hidden min-h-screen">
        <SmallBubblesLavaLamp />
        
        {/* Mobile: Blur Overlay */}
        <div className="lg:hidden absolute inset-0 bg-white/60 backdrop-blur-md z-20"></div>

        {/* Back to Home Button - Above everything */}
        <div className="absolute top-4 left-4 lg:top-8 lg:left-8 z-50">
          <Link
            to="/"
            className="flex items-center space-x-2 text-black hover:text-green-600 transition-colors bg-white/90 backdrop-blur-sm px-3 py-2 lg:px-4 lg:py-2 rounded-full border border-white/30 text-sm lg:text-base shadow-lg"
          >
            <ArrowLeft className="h-3 w-3 lg:h-4 lg:w-4" />
            <span className="font-medium">Back to Home</span>
          </Link>
        </div>
      </div>

      {/* Desktop: Fade Overlay */}
      <div className="hidden lg:block absolute top-0 bottom-0 z-20 w-40 bg-gradient-to-r from-transparent via-white/100 to-transparent" style={{ left: 'calc(60% - 80px)' }}></div>

      {/* Unified Auth Component Container - Responsive positioning */}
      <div className="absolute lg:relative inset-0 lg:inset-auto lg:w-2/5 lg:bg-gray-50/30 flex flex-col justify-center items-center px-4 lg:px-8 py-8 lg:py-12 z-30">
        <div className="w-full max-w-sm lg:max-w-md">
          <div className="text-center mb-6">
            <AnimatedText 
              text="GrowMint"
              textClassName="text-2xl lg:text-3xl font-bold text-gray-900 mb-2"
              underlineGradient="from-green-400 via-green-600 to-green-800"
              underlineHeight="h-0.5"
              underlineOffset="bottom-0.5"
              duration={0.15}
              delay={0.06}
              animatedGradient={true}
            />
            <p className="text-sm lg:text-base text-gray-600 mt-4">
              Sign in securely to access your account
            </p>
          </div>
          
          {/* Single Civic Auth Component with responsive styling */}
          <div className="w-full bg-white lg:bg-transparent rounded-lg lg:rounded-none shadow-lg lg:shadow-none p-4 lg:p-0 min-h-[300px] lg:min-h-[400px] flex items-center justify-center">
            {isMounted && <IsolatedCivicAuth />}
          </div>
        </div>
      </div>
    </div>
  );
}; 