import React, { useEffect } from 'react';

interface TestComponentProps {
  message?: string;
}

export function TestComponent({ message = "Test Component Rendered" }: TestComponentProps) {
  useEffect(() => {
    console.log("TestComponent: Component mounted");
  }, []);

  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        backgroundColor: 'black', 
        color: 'white', 
        padding: '20px',
        zIndex: 9999
      }}
    >
      <h1>{message}</h1>
      <p>If you can see this message, React is rendering correctly.</p>
    </div>
  );
}