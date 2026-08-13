'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface AnalyticsData {
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  in_progress: number;
  success_rate: number;
  avg_duration_seconds: number;
  failure_breakdown: { reason: string; count: number }[];
}

interface RecentCall {
  id: number;
  room_name: string;
  channel: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number;
  outcome: string;
  failure_reason: string;
  tools_used: string[];
  language: string;
}

interface DailyData {
  date: string;
  total: number;
  successful: number;
  failed: number;
}

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recentCalls, setRecentCalls] = useState<RecentCall[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const doughnutRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLCanvasElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, recentRes, chartRes] = await Promise.all([
        fetch('/api/analytics?type=summary', { cache: 'no-store' }),
        fetch('/api/analytics?type=recent', { cache: 'no-store' }),
        fetch('/api/analytics?type=chart', { cache: 'no-store' }),
      ]);
      if (summaryRes.ok) setAnalytics(await summaryRes.json());
      if (recentRes.ok) setRecentCalls(await recentRes.json());
      if (chartRes.ok) setDailyData(await chartRes.json());
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Draw doughnut chart
  useEffect(() => {
    if (!analytics || !doughnutRef.current) return;
    const canvas = doughnutRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 200 * dpr;
    canvas.height = 200 * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = '200px';
    canvas.style.height = '200px';

    ctx.clearRect(0, 0, 200, 200);
    const cx = 100, cy = 100, r = 70, lineWidth = 24;
    const total = analytics.successful_calls + analytics.failed_calls + analytics.in_progress;
    
    if (total === 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = lineWidth;
      ctx.stroke();
      ctx.fillStyle = '#9ca3af';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No data', cx, cy + 5);
      return;
    }

    const segments = [
      { value: analytics.successful_calls, color: '#22c55e' },
      { value: analytics.failed_calls, color: '#ef4444' },
      { value: analytics.in_progress, color: '#eab308' },
    ];

    let startAngle = -Math.PI / 2;
    for (const seg of segments) {
      if (seg.value === 0) continue;
      const sliceAngle = (seg.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle);
      ctx.strokeStyle = seg.color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'butt';
      ctx.stroke();
      startAngle += sliceAngle;
    }

    // Center text
    ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#f9fafb' : '#111827';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${analytics.success_rate}%`, cx, cy - 8);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('Success Rate', cx, cy + 16);
  }, [analytics]);

  // Draw bar chart
  useEffect(() => {
    if (!dailyData.length || !barRef.current) return;
    const canvas = barRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = 400, H = 200;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;

    ctx.clearRect(0, 0, W, H);
    const padding = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartW = W - padding.left - padding.right;
    const chartH = H - padding.top - padding.bottom;

    const maxVal = Math.max(...dailyData.map(d => d.total), 1);
    const barGroupWidth = chartW / dailyData.length;
    const barWidth = Math.min(barGroupWidth * 0.25, 20);
    const gap = 2;

    // Y-axis gridlines
    const isDark = document.documentElement.classList.contains('dark');
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + chartH - (i / 4) * chartH;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(W - padding.right, y);
      ctx.stroke();
      ctx.fillStyle = isDark ? '#9ca3af' : '#6b7280';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(String(Math.round((maxVal * i) / 4)), padding.left - 5, y + 3);
    }

    // Bars
    dailyData.forEach((d, i) => {
      const groupX = padding.left + i * barGroupWidth + barGroupWidth / 2;
      const colors = [
        { val: d.successful, color: '#22c55e' },
        { val: d.failed, color: '#ef4444' },
      ];
      colors.forEach((c, j) => {
        const barH = (c.val / maxVal) * chartH;
        const x = groupX - barWidth - gap / 2 + j * (barWidth + gap);
        const y = padding.top + chartH - barH;
        ctx.fillStyle = c.color;
        ctx.beginPath();
        const radius = 3;
        ctx.moveTo(x, y + radius);
        ctx.arcTo(x, y, x + barWidth, y, radius);
        ctx.arcTo(x + barWidth, y, x + barWidth, y + barH, radius);
        ctx.lineTo(x + barWidth, padding.top + chartH);
        ctx.lineTo(x, padding.top + chartH);
        ctx.closePath();
        ctx.fill();
      });

      // Date label
      ctx.fillStyle = isDark ? '#9ca3af' : '#6b7280';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      const dateLabel = d.date.slice(5); // MM-DD
      ctx.fillText(dateLabel, groupX, H - padding.bottom + 15);
    });
  }, [dailyData]);

  const formatDuration = (seconds: number) => {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const outcomeStyle = (outcome: string) => {
    switch (outcome) {
      case 'SUCCESS': return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'FAILED': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'IN_PROGRESS': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const toolDisplayName = (tool: string) => {
    const map: Record<string, string> = {
      lookup_mandi_rates: '📊 Mandi Rates',
      lookup_weather: '🌤️ Weather',
      create_escalation: '🚨 Escalation',
      save_caller_profile: '💾 Save Profile',
      lookup_caller: '🔍 Lookup',
      forget_caller_profile: '🗑️ Forget',
    };
    return map[tool] || tool;
  };

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-500 border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">📊 Call Analytics Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">KrishiVani — Farm & Field Track • Real-time call monitoring</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Auto-refresh: 10s</p>
          <p className="text-xs text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-blue-400">Total Calls</p>
          <p className="text-3xl font-bold text-blue-400 mt-1">{analytics.total_calls}</p>
          <p className="text-xs text-muted-foreground mt-1">Avg: {formatDuration(analytics.avg_duration_seconds)}</p>
        </div>
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-green-400">Successful</p>
          <p className="text-3xl font-bold text-green-400 mt-1">{analytics.successful_calls}</p>
          <p className="text-xs text-muted-foreground mt-1">Rate: {analytics.success_rate}%</p>
        </div>
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-red-400">Failed</p>
          <p className="text-3xl font-bold text-red-400 mt-1">{analytics.failed_calls}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {analytics.total_calls > 0 ? `${(100 - analytics.success_rate).toFixed(1)}%` : '0%'}
          </p>
        </div>
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-yellow-400">In Progress</p>
          <p className="text-3xl font-bold text-yellow-400 mt-1">{analytics.in_progress}</p>
          <p className="text-xs text-muted-foreground mt-1">Active now</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Doughnut Chart */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Success Distribution</h3>
          <div className="flex items-center justify-center">
            <canvas ref={doughnutRef} />
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-green-500"></span>
              <span className="text-xs text-muted-foreground">Success</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500"></span>
              <span className="text-xs text-muted-foreground">Failed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
              <span className="text-xs text-muted-foreground">Active</span>
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Daily Call Volume (7 days)</h3>
          <div className="flex items-center justify-center">
            {dailyData.length > 0 ? (
              <canvas ref={barRef} />
            ) : (
              <p className="text-sm text-muted-foreground py-12">No daily data yet. Make some calls!</p>
            )}
          </div>
        </div>
      </div>

      {/* Failure Breakdown */}
      {analytics.failure_breakdown.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Failure Breakdown</h3>
          <div className="flex flex-wrap gap-3">
            {analytics.failure_breakdown.map((f, i) => (
              <div key={i} className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2">
                <span className="text-xs text-red-400 font-medium">{f.reason.replace(/_/g, ' ')}</span>
                <span className="ml-2 text-sm font-bold text-red-400">{f.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Calls Table */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Recent Calls</h3>
        {recentCalls.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase">#</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase">Time</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase">Duration</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase">Channel</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase">Outcome</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase">Tools Used</th>
                </tr>
              </thead>
              <tbody>
                {recentCalls.map((call) => (
                  <tr key={call.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="py-2.5 px-3 text-muted-foreground font-mono text-xs">{call.id}</td>
                    <td className="py-2.5 px-3 text-foreground text-xs">
                      {call.start_time ? new Date(call.start_time + 'Z').toLocaleString() : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-foreground font-mono text-xs">{formatDuration(call.duration_seconds)}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                        {call.channel === 'sip' ? '📞 SIP' : '🌐 Browser'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${outcomeStyle(call.outcome)}`}>
                        {call.outcome}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {call.tools_used.length > 0 ? call.tools_used.map((t, i) => (
                          <span key={i} className="inline-flex items-center rounded bg-accent/50 px-1.5 py-0.5 text-[10px] text-accent-foreground">
                            {toolDisplayName(t)}
                          </span>
                        )) : <span className="text-xs text-muted-foreground">—</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No calls recorded yet. Start a voice session to see data here!</p>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground">
        KrishiVani Call Analytics • Day 8 #VoiceForBharat • Powered by Murf Falcon TTS & LiveKit
      </div>
    </div>
  );
}
