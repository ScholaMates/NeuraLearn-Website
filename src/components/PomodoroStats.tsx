"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface PomodoroStatsProps {
    dailyFocusTime: number; // in minutes
    sessionsCompleted: number;
}

export default function PomodoroStats({ dailyFocusTime, sessionsCompleted }: PomodoroStatsProps) {
    const goal = 4 * 25; // Example goal: 4 Pomodoros
    const progress = Math.min(100, (dailyFocusTime / goal) * 100);
    
    const data = [
        { name: 'Completed', value: dailyFocusTime },
        { name: 'Remaining', value: Math.max(0, goal - dailyFocusTime) },
    ];

    const COLORS = ['#CBA6F7', '#313244']; // Mauve and Surface0

    return (
        <div className="w-full h-full flex flex-col justify-center items-center p-6 bg-mocha-base/50 backdrop-blur-sm rounded-3xl border border-mocha-surface0">
            <h3 className="text-xl font-bold text-mocha-text mb-4 font-space">Daily Progress</h3>
            
            <div className="grid grid-cols-2 gap-8 w-full">
                <div className="flex flex-col items-center justify-center p-4 bg-mocha-surface0 rounded-2xl">
                    <span className="text-3xl font-bold text-mocha-mauve">{sessionsCompleted}</span>
                    <span className="text-sm text-mocha-subtext0 mt-1">Sessions</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-mocha-surface0 rounded-2xl">
                    <span className="text-3xl font-bold text-mocha-blue">
                        {Math.floor(dailyFocusTime / 60)}h {dailyFocusTime % 60}m
                    </span>
                    <span className="text-sm text-mocha-subtext0 mt-1">Focus Time</span>
                </div>
            </div>

            <div className="h-64 w-full mt-6 relative">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip 
                             content={({ active, payload }) => {
                                 if (active && payload && payload.length) {
                                     const data = payload[0].payload;
                                     if (data.name === 'Remaining') {
                                         return (
                                             <div className="bg-mocha-base border border-mocha-surface1 rounded-lg p-3 shadow-lg">
                                                 <p className="text-mocha-text font-medium text-sm">
                                                     Remaining: <span className="font-bold">{data.value}</span> minutes
                                                 </p>
                                             </div>
                                         );
                                     } 
                                      return (
                                         <div className="bg-mocha-base border border-mocha-surface1 rounded-lg p-3 shadow-lg">
                                             <p className="text-mocha-text font-medium text-sm">
                                                 {data.name}: <span className="font-bold">{data.value}</span> minutes
                                             </p>
                                         </div>
                                     );
                                 }
                                 return null;
                             }}
                            // contentStyle={{ backgroundColor: '#1e1e2e', borderRadius: '8px', border: '1px solid #313244' }}
                            // itemStyle={{ color: '#cdd6f4' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <span className="text-2xl font-bold text-mocha-text">{Math.round(progress)}%</span>
                        <p className="text-xs text-mocha-subtext0">of daily goal</p>
                    </div>
                </div>
            </div>
            
            <div className="mt-4 flex gap-2">
                 {Array.from({ length: 4 }).map((_, i) => (
                    <div 
                        key={i} 
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                            i < sessionsCompleted ? 'bg-mocha-mauve scale-110' : 'bg-mocha-surface1'
                        }`}
                    />
                 ))}
                 {sessionsCompleted > 4 && (
                     <span className="text-xs text-mocha-subtext0 ml-1">+{sessionsCompleted - 4}</span>
                 )}
            </div>
        </div>
    );
}
