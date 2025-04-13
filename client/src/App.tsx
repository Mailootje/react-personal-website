function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
      <h1 className="text-4xl font-bold mb-6">Mailo Bedo | Personal Portfolio</h1>
      <p className="text-xl mb-8">
        Basic test page - this confirms the React application is working
      </p>
      <div className="grid grid-cols-1 gap-4 w-full max-w-md">
        <a 
          href="/apps" 
          className="px-6 py-3 bg-blue-600 text-white rounded-lg text-center hover:bg-blue-700 transition-colors"
        >
          Go to Apps
        </a>
        <a 
          href="/games" 
          className="px-6 py-3 bg-purple-600 text-white rounded-lg text-center hover:bg-purple-700 transition-colors"
        >
          Go to Games
        </a>
        <a 
          href="/downloads" 
          className="px-6 py-3 bg-green-600 text-white rounded-lg text-center hover:bg-green-700 transition-colors"
        >
          Go to Downloads
        </a>
      </div>
    </div>
  );
}

export default App;
