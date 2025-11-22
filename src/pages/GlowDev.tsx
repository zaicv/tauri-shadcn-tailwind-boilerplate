import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useGlowState } from "@/hooks/useGlowState";
import { Square, RotateCw } from "lucide-react";

const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

function GlowDevDashboard() {
  const { state, loading, error, debugInfo } = useGlowState(3000);

  // Show debug info if there's an error or still loading
  const showDebug = error || loading || !state;

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-semibold mb-8">Glow Development Dashboard</h1>
        
        {/* Debug Panel */}
        {showDebug && (
          <Card className="bg-white border-2 border-red-200">
            <CardHeader>
              <CardTitle className="text-lg text-red-600">🔍 Connection Debug Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-2">Environment:</div>
                <div className="text-xs font-mono bg-gray-100 p-2 rounded space-y-1">
                  <div>Hostname: <span className="font-semibold">{debugInfo.environment.hostname}</span></div>
                  <div>Protocol: <span className="font-semibold">{debugInfo.environment.protocol}</span></div>
                  <div>VITE_API_URL: <span className="font-semibold">{debugInfo.environment.viteApiUrl || "(not set)"}</span></div>
                </div>
              </div>
              
              {debugInfo.currentUrl && (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <div className="text-sm font-medium text-green-700">✅ Connected to:</div>
                  <div className="text-xs font-mono text-green-800 mt-1">{debugInfo.currentUrl}</div>
                </div>
              )}
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <div className="text-sm font-medium text-red-700 mb-2">❌ Error:</div>
                  <div className="text-xs text-red-800">{error.message}</div>
                </div>
              )}
              
              {debugInfo.attemptedUrls.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Attempted URLs ({debugInfo.attemptedUrls.length}):</div>
                  <div className="space-y-2">
                    {debugInfo.attemptedUrls.map((attempt, idx) => (
                      <div key={idx} className="text-xs font-mono bg-gray-50 p-2 rounded border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-700">{attempt.url}</div>
                            {attempt.status && (
                              <div className="mt-1 text-red-600">{attempt.status}</div>
                            )}
                            {attempt.error && (
                              <div className="mt-1 text-red-500 text-xs">{attempt.error}</div>
                            )}
                          </div>
                          {attempt.url === debugInfo.currentUrl && (
                            <Badge variant="outline" className="ml-2 border-green-500 text-green-700">
                              ✓ Active
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {loading && !error && (
                <div className="text-sm text-gray-600">⏳ Attempting to connect...</div>
              )}
            </CardContent>
          </Card>
        )}
        
        {loading && !error && <div className="p-8 text-center">Loading...</div>}
        {error && !showDebug && <div className="p-8 text-red-500">Error: {(error as Error)?.message || String(error)}</div>}
        {!state && !loading && !error && <div className="p-8">No state available</div>}
        
        {!state && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>}
        
        {state && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* System */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>CPU</span>
                  <span className="font-medium">{(state.system.cpu_usage * 100).toFixed(1)}%</span>
                </div>
                <Progress value={state.system.cpu_usage * 100} className="h-2" indicatorClassName="bg-blue-500" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>RAM</span>
                  <span className="font-medium">{(state.system.ram_usage * 100).toFixed(1)}%</span>
                </div>
                <Progress value={state.system.ram_usage * 100} className="h-2" indicatorClassName="bg-purple-500" />
              </div>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Disk</span>
                  <span className="font-medium">{state.system.disk_used_gb?.toFixed(1) || 0} / {state.system.disk_total_gb?.toFixed(1) || 0} GB</span>
                </div>
                {state.system.disk_read_mb_per_sec !== undefined && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>I/O:</span>
                    <span>R: {state.system.disk_read_mb_per_sec.toFixed(1)}MB/s W: {state.system.disk_write_mb_per_sec?.toFixed(1) || 0}MB/s</span>
                  </div>
                )}
                <div className="flex justify-between mt-2">
                  <span className="text-gray-600">Uptime</span>
                  <span className="font-medium">{formatUptime(state.system.uptime_seconds)}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="border-gray-300">
                    {state.system.network_status}
                  </Badge>
                  {state.system.network_sent_mb_per_sec !== undefined && (
                    <span className="text-xs text-gray-500">
                      ↑{state.system.network_sent_mb_per_sec.toFixed(1)} ↓{state.system.network_recv_mb_per_sec?.toFixed(1) || 0} MB/s
                    </span>
                  )}
                </div>
                {state.system.battery_percent !== null && state.system.battery_percent !== undefined && (
                  <div className="flex justify-between mt-2">
                    <span className="text-gray-600">Battery</span>
                    <span className="font-medium">
                      {state.system.battery_percent.toFixed(0)}% {state.system.battery_plugged ? "🔌" : "🔋"}
                    </span>
                  </div>
                )}
                {state.system.cpu_temp_c !== null && state.system.cpu_temp_c !== undefined && (
                  <div className="flex justify-between mt-2">
                    <span className="text-gray-600">CPU Temp</span>
                    <span className="font-medium">{state.system.cpu_temp_c.toFixed(1)}°C</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Runtime */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Runtime</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className={state.runtime.backend_running ? "bg-green-500 text-white border-0" : ""}>
                  Backend
                </Badge>
                <Badge variant="outline" className={state.runtime.ollama_running ? "bg-blue-500 text-white border-0" : ""}>
                  Ollama
                </Badge>
                <Badge variant="outline" className={state.runtime.plex_running ? "bg-orange-500 text-white border-0" : ""}>
                  Plex
                </Badge>
              </div>
              <div className="text-sm space-y-2">
                <div>
                  <span className="text-gray-600">Model:</span>
                  <span className="ml-2 font-medium">{state.runtime.active_model || "None"}</span>
                </div>
                <div>
                  <span className="text-gray-600">Persona:</span>
                  <span className="ml-2 font-medium">{state.runtime.persona || "None"}</span>
                </div>
                <div>
                  <span className="text-gray-600">Voice:</span>
                  <Badge variant="outline" className="ml-2 border-gray-300">
                    {state.runtime.voice_mode ? "On" : "Off"}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-600">Tokens Today:</span>
                  <span className="ml-2 font-medium text-blue-600">{state.runtime.tokens_today.toLocaleString()}</span>
                </div>
              </div>
              {state.runtime.superpowers_loaded.length > 0 && (
                <div>
                  <div className="text-xs text-gray-600 mb-1">Superpowers</div>
                  <div className="flex flex-wrap gap-1">
                    {state.runtime.superpowers_loaded.map((sp) => (
                      <Badge key={sp} variant="outline" className="text-xs border-gray-300">
                        {sp}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Device */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Device</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">Frontmost App:</span>
                <div className="font-medium mt-1">{state.device.frontmost_app || "None"}</div>
                {state.device.frontmost_window && (
                  <div className="text-xs text-gray-500 mt-1 truncate">{state.device.frontmost_window}</div>
                )}
              </div>
              {state.device.selected_text && (
                <div>
                  <span className="text-gray-600">Selected Text:</span>
                  <div className="font-medium mt-1 truncate">{state.device.selected_text}</div>
                </div>
              )}
              <div>
                <span className="text-gray-600">Disc:</span>
                <Badge variant="outline" className={`ml-2 ${state.device.disc_mounted ? "border-green-500 text-green-700" : "border-gray-300"}`}>
                  {state.device.disc_mounted ? `Mounted: ${state.device.disc_path}` : "Not mounted"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Recent Downloads:</span>
                <span className="font-medium">{state.device.downloads_recent.length}</span>
              </div>
              {state.device.screen_brightness !== null && state.device.screen_brightness !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Brightness:</span>
                  <span className="font-medium">{state.device.screen_brightness}%</span>
                </div>
              )}
              {state.device.audio_output_volume !== null && state.device.audio_output_volume !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Volume:</span>
                  <span className="font-medium">{(state.device.audio_output_volume * 100).toFixed(0)}%</span>
                </div>
              )}
              {state.device.recent_files && state.device.recent_files.length > 0 && (
                <div>
                  <span className="text-gray-600">Recent Files:</span>
                  <div className="mt-1 space-y-1">
                    {state.device.recent_files.slice(0, 3).map((file: any, idx: number) => (
                      <div key={idx} className="text-xs truncate text-gray-500">{file.name}</div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Memory */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Memory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">Total Memories:</span>
                <span className="ml-2 font-medium text-purple-600">{state.memory.memory_count}</span>
              </div>
              {state.memory.last_ingested_file && (
                <div>
                  <span className="text-gray-600">Last Ingested:</span>
                  <div className="font-medium mt-1 truncate">{state.memory.last_ingested_file}</div>
                </div>
              )}
              {state.memory.last_memory_added && (
                <div>
                  <span className="text-gray-600">Last Added:</span>
                  <div className="font-medium mt-1">{new Date(state.memory.last_memory_added).toLocaleString()}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Environment */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Environment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Current Time:</span>
                <div className="font-medium mt-1">{new Date(state.environment.now).toLocaleString()}</div>
              </div>
              <div>
                <span className="text-gray-600">Timezone:</span>
                <span className="ml-2 font-medium">{state.environment.timezone}</span>
              </div>
            </CardContent>
          </Card>

          {/* Running Apps */}
          {state.system.running_apps && state.system.running_apps.length > 0 && (
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Running Apps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {state.system.running_apps.slice(0, 15).map((app, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs border-gray-300">
                      {app}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Ports */}
          {state.system.active_ports && state.system.active_ports.length > 0 && (
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Active Ports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {state.system.active_ports.slice(0, 8).map((port: any, idx: number) => (
                  <div key={idx} className="text-xs flex justify-between">
                    <span className="text-gray-600">Port {port.port}</span>
                    <span className="text-gray-500">{port.protocol}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Tasks */}
          <Card className="bg-white border border-gray-200 md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg">Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {state.tasks.active.length > 0 && (
                <div className="mb-6">
                  <div className="text-sm font-medium mb-3 text-gray-700">Active</div>
                  <div className="space-y-3">
                    {state.tasks.active.map((task) => (
                      <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="font-medium">{task.type}</div>
                            {task.message && <div className="text-sm text-gray-600 mt-1">{task.message}</div>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-blue-500 text-blue-700">
                              {task.status}
                            </Badge>
                            {task.status === "running" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    await fetch(`https://100.83.147.76:8003/api/tasks/${task.id}/stop`, {
                                      method: "POST",
                                    });
                                  }}
                                  className="h-7 px-2 text-xs"
                                >
                                  <Square className="w-3 h-3 mr-1" />
                                  Stop
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    await fetch(`https://100.83.147.76:8003/api/tasks/${task.id}/restart`, {
                                      method: "POST",
                                    });
                                  }}
                                  className="h-7 px-2 text-xs"
                                >
                                  <RotateCw className="w-3 h-3 mr-1" />
                                  Restart
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        <Progress value={task.progress * 100} className="h-2" indicatorClassName="bg-blue-500" />
                        <div className="text-xs text-gray-500 mt-2">
                          {task.started_at && `Started: ${new Date(task.started_at).toLocaleTimeString()}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {state.tasks.recent.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-3 text-gray-700">Recent</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {state.tasks.recent.slice(0, 6).map((task) => (
                      <div key={task.id} className="border border-gray-200 rounded-lg p-3 text-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium">{task.type}</span>
                          <Badge variant="outline" className={`text-xs ${
                            task.status === "done" ? "border-green-500 text-green-700" :
                            task.status === "error" ? "border-red-500 text-red-700" :
                            "border-gray-300"
                          }`}>
                            {task.status}
                          </Badge>
                        </div>
                        {task.message && <div className="text-xs text-gray-600 mt-1 truncate">{task.message}</div>}
                        {task.finished_at && (
                          <div className="text-xs text-gray-500 mt-2">
                            {new Date(task.finished_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {state.tasks.active.length === 0 && state.tasks.recent.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-8">No tasks</div>
              )}
            </CardContent>
          </Card>
        </div>
        )}
      </div>
    </div>
  );
}

export default GlowDevDashboard;