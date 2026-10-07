import React from 'react';
import Stage from './components/Stage';
import Screens from './components/Screens';

export default function App() {
  return (
    <div className="fixed inset-0 bg-[#9fd3f5] text-white font-sans overflow-hidden select-none touch-none">
      <Stage />
      <Screens />
    </div>
  );
}
