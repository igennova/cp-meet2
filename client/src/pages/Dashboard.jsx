import React from "react";
import { Button, HyperText } from "@/components/ui";
import { Box } from "@chakra-ui/react";

// Profile stat component
const StatItem = ({ label, value, icon }) => {
  return (
    <div className="flex items-center space-x-2">
      <div className="text-gray-400">{icon}</div>
      <div>
        <div className="text-[#e0e0e0] font-bold">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
};

// Battle card component
const BattleCard = ({ opponent, language, timeLeft, id }) => {
  return (
    <div className="border border-gray-800 bg-[#0f0f0f] rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-[#0f0f0f] to-[#161616] p-3 border-b border-gray-800">
        <div className="flex justify-between items-center">
          <div className="text-[#e0e0e0] font-medium">vs. {opponent}</div>
          <div className="px-2 py-1 rounded text-xs bg-gray-800 text-cyan-400">{language}</div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="text-xs text-gray-500">Time Remaining:</div>
          <div className="text-cyan-400 font-mono">{timeLeft}</div>
        </div>
        <div className="h-1.5 w-full bg-gray-800 rounded-full mb-4">
          <div 
            className="h-full bg-gradient-to-r from-[#ff2d75] to-[#00f0ff] rounded-full"
            style={{ width: `${(timeLeft.split(":")[0] * 60 + parseInt(timeLeft.split(":")[1])) / 30 * 100}%` }}
          ></div>
        </div>
        <Button 
          className="w-full py-2 px-4 bg-[#1a1a1a] hover:bg-[#242424] text-[#e0e0e0] border border-[#333333] rounded shadow-inner animate-pulse hover:shadow-[0_0_10px_rgba(0,240,255,0.3)] transition-all"
        >
          Resume Battle
        </Button>
      </div>
    </div>
  );
};

// Activity item component
const ActivityItem = ({ message, time, type }) => {
  const getBgColor = () => {
    switch (type) {
      case "win": return "bg-green-950/30 border-green-800/30";
      case "achievement": return "bg-amber-950/30 border-amber-800/30";
      case "info": return "bg-blue-950/30 border-blue-800/30";
      default: return "bg-gray-900/50 border-gray-800/30";
    }
  };
  
  const getIcon = () => {
    switch (type) {
      case "win": return "🏆";
      case "achievement": return "🎯";
      case "info": return "ℹ️";
      default: return "📌";
    }
  };
  
  return (
    <div className={`p-3 rounded border ${getBgColor()} flex items-start space-x-3`}>
      <div className="text-lg">{getIcon()}</div>
      <div className="flex-1">
        <div className="text-[#e0e0e0]">{message}</div>
        <div className="text-xs text-gray-500 mt-1">{time}</div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  // Mock data
  const userProfile = {
    name: "CodeWarrior",
    rank: "Diamond",
    level: 42,
    avatar: "https://i.pravatar.cc/150?img=32",
    progress: 72,
    stats: {
      wins: 124,
      losses: 36,
      speed: "48 WPM",
      accuracy: "92%"
    }
  };
  
  const activeBattles = [
    { id: 1, opponent: "AlgorithmAce", language: "Python", timeLeft: "18:24" },
    { id: 2, opponent: "ByteMaster", language: "JavaScript", timeLeft: "09:11" }
  ];
  
  const activities = [
    { message: "You defeated @SyntaxSage in a Python duel!", time: "2 hours ago", type: "win" },
    { message: "New achievement: 10-win streak!", time: "Yesterday", type: "achievement" },
    { message: "You joined the Monthly Tournament", time: "2 days ago", type: "info" },
    { message: "You defeated @CodeNinja in a JavaScript duel!", time: "3 days ago", type: "win" }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] py-8">
      {/* Carbon fiber texture overlay */}
      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none" 
        style={{ 
          backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMwYTBhMGEiLz48cGF0aCBkPSJNMCAwTDQgNCBNNCAwTDAgNCIgc3Ryb2tlPSIjMTgxODE4IiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')",
          backgroundSize: "4px 4px"
        }}>
      </div>
      
      {/* Grid background effect */}
      <div className="fixed inset-0 z-0 opacity-5 pointer-events-none" 
        style={{ 
          backgroundImage: 'linear-gradient(rgba(0, 240, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          backgroundPosition: '-1px -1px'
        }}>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <HyperText
            className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff2d75] to-[#00f0ff] tracking-tight"
            text="BATTLE COMMAND CENTER"
          />
          <p className="text-gray-500 mt-2">Analyze your performance, track battles, improve your rank</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile & Recent Activity */}
          <div className="col-span-1 space-y-6">
            {/* Profile Panel */}
            <div className="bg-[#111111] border border-gray-800 rounded-lg overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-[#12121a] to-[#1a1a24] p-6 relative">
                {/* Avatar & Name */}
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-[#ff2d75] to-[#00f0ff] flex items-center justify-center p-0.5">
                      <img 
                        src={userProfile.avatar}
                        alt="User Avatar" 
                        className="h-full w-full rounded-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-[#111111] flex items-center justify-center border-2 border-[#111111]">
                      <div className="text-xs font-bold text-[#e0e0e0]">{userProfile.level}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-[#e0e0e0]">{userProfile.name}</div>
                    <div className="text-sm text-cyan-400">{userProfile.rank} Tier</div>
                  </div>
                </div>
                
                {/* Progress bar to next rank */}
                <div className="mt-6">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress to next rank</span>
                    <span>{userProfile.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-800 rounded-full">
                    <div 
                      className="h-full bg-gradient-to-r from-[#ff2d75] to-[#00f0ff] rounded-full"
                      style={{ width: `${userProfile.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Stats */}
              <div className="px-6 py-4 grid grid-cols-2 gap-4">
                <StatItem 
                  label="Win/Loss" 
                  value={`${userProfile.stats.wins}/${userProfile.stats.losses}`} 
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>}
                />
                <StatItem 
                  label="Win Rate" 
                  value={`${Math.round(userProfile.stats.wins / (userProfile.stats.wins + userProfile.stats.losses) * 100)}%`} 
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>}
                />
                <StatItem 
                  label="Avg Speed" 
                  value={userProfile.stats.speed} 
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>}
                />
                <StatItem 
                  label="Accuracy" 
                  value={userProfile.stats.accuracy} 
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>}
                />
              </div>
            </div>
            
            {/* Recent Activity Feed */}
            <div className="bg-[#111111] border border-gray-800 rounded-lg overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-[#12121a] to-[#1a1a24] p-4 border-b border-gray-800">
                <h2 className="font-bold text-[#e0e0e0]">Recent Activity</h2>
              </div>
              <div className="p-4 space-y-3">
                {activities.map((activity, index) => (
                  <ActivityItem 
                    key={index}
                    message={activity.message}
                    time={activity.time}
                    type={activity.type}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* Center & Right Column */}
          <div className="col-span-1 lg:col-span-2 space-y-6">
            {/* Active Battles */}
            <div className="bg-[#111111] border border-gray-800 rounded-lg overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-[#12121a] to-[#1a1a24] p-4 border-b border-gray-800">
                <h2 className="font-bold text-[#e0e0e0]">Active Battles</h2>
              </div>
              <div className="p-4">
                {activeBattles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeBattles.map((battle) => (
                      <BattleCard 
                        key={battle.id}
                        opponent={battle.opponent}
                        language={battle.language}
                        timeLeft={battle.timeLeft}
                        id={battle.id}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                    </svg>
                    <p>No active battles</p>
                    <p className="text-sm">Start a new challenge to begin coding!</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Quick Access */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* New 1v1 Duel */}
              <div className="bg-[#111111] border border-gray-800 rounded-lg overflow-hidden shadow-lg group hover:border-[#ff2d75]/30 transition-all">
                <div className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-[#ff2d75]/10 border border-[#ff2d75]/20 flex items-center justify-center mb-4 group-hover:bg-[#ff2d75]/20 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#ff2d75]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-[#e0e0e0] mb-1">New 1v1 Duel</h3>
                  <p className="text-gray-500 text-sm mb-4">Challenge another coder to a real-time battle</p>
                  <Button 
                    className="w-full py-2 px-4 bg-[#ff2d75]/10 hover:bg-[#ff2d75]/20 text-[#ff2d75] border border-[#ff2d75]/20 rounded-lg transition-all"
                  >
                    Start Duel
                  </Button>
                </div>
              </div>
              
              {/* Practice Arena */}
              <div className="bg-[#111111] border border-gray-800 rounded-lg overflow-hidden shadow-lg group hover:border-[#00f0ff]/30 transition-all">
                <div className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/20 flex items-center justify-center mb-4 group-hover:bg-[#00f0ff]/20 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#00f0ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-[#e0e0e0] mb-1">Practice Arena</h3>
                  <p className="text-gray-500 text-sm mb-4">Sharpen your skills with coding exercises</p>
                  <Button 
                    className="w-full py-2 px-4 bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/20 rounded-lg transition-all"
                  >
                    Enter Arena
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Performance & Achievements */}
            <div className="bg-[#111111] border border-gray-800 rounded-lg overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-[#12121a] to-[#1a1a24] p-4 border-b border-gray-800">
                <h2 className="font-bold text-[#e0e0e0]">Performance Breakdown</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Language Performance */}
                  <div className="col-span-2">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Language Proficiency</h3>
                    
                    {/* Python */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-[#e0e0e0]">Python</span>
                        <span className="text-xs text-cyan-400">Expert</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-800 rounded-full">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full" style={{ width: "92%" }}></div>
                      </div>
                    </div>
                    
                    {/* JavaScript */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-[#e0e0e0]">JavaScript</span>
                        <span className="text-xs text-blue-400">Advanced</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-800 rounded-full">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" style={{ width: "78%" }}></div>
                      </div>
                    </div>
                    
                    {/* Java */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-[#e0e0e0]">Java</span>
                        <span className="text-xs text-green-400">Intermediate</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-800 rounded-full">
                        <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full" style={{ width: "65%" }}></div>
                      </div>
                    </div>
                    
                    {/* C++ */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-[#e0e0e0]">C++</span>
                        <span className="text-xs text-amber-400">Beginner</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-800 rounded-full">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" style={{ width: "42%" }}></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Badge Achievement */}
                  <div className="bg-[#0f0f0f] rounded-lg border border-gray-800 p-4 flex flex-col items-center justify-center text-center">
                    <div className="h-20 w-20 mb-3">
                      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="text-[#ff2d75]">
                        <path fill="currentColor" d="M139.2,27.7c18.4,7.3,33.9,21.7,36.9,38.3c3,16.6-6.6,35.3-20.2,51.6c-13.7,16.2-31.5,30-52.1,30.8c-20.6,0.8-44.1-11.4-60.1-30.4C27.7,99,19.1,73.1,28.2,53.4c9.1-19.7,35.9-33.3,63.5-36.6C119.3,13.5,120.8,20.3,139.2,27.7z"/>
                        <circle cx="100" cy="100" r="60" fill="#0f0f0f"/>
                        <text x="100" y="115" textAnchor="middle" fontSize="70" fontWeight="bold" fill="#ff2d75">10</text>
                      </svg>
                    </div>
                    <h3 className="font-bold text-[#e0e0e0]">Winning Streak</h3>
                    <p className="text-xs text-gray-500 mt-1">Win 10 battles in a row</p>
                    <div className="mt-2 px-3 py-1 bg-[#ff2d75]/10 text-[#ff2d75] text-xs rounded-full">Achieved</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 