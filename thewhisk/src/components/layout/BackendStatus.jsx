import React from 'react';

const BackendStatus = () => {
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      background: 'green',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      zIndex: 9999
    }}>
      Backend Status: OK
    </div>
  );
};

export default BackendStatus;
