import {
  Maximize2Icon,
  MinimizeIcon,
  PauseIcon,
  PlayIcon,
  SkipBackIcon,
  SkipForwardIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import ReactPlayer from "react-player";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import "./video-player.css";

const ReactPlayerWrapper = ReactPlayer as unknown as (
  props: Record<string, unknown>
) => React.JSX.Element;

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  width?: number;
  height?: number;
  className?: string;
}

export interface VideoPlayerHandle {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  ({ videoUrl, width = 640, height = 360, className }, ref) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.7);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [ready, setReady] = useState(false);

    const playerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      setIsClient(true);
    }, []);

    useImperativeHandle(ref, () => ({
      play: () => {
        if (playerRef.current?.getInternalPlayer()?.play) {
          playerRef.current.getInternalPlayer().play();
        } else if (playerRef.current?.play) {
          playerRef.current.play();
        }
      },
      pause: () => {
        if (playerRef.current?.getInternalPlayer()?.pause) {
          playerRef.current.getInternalPlayer().pause();
        } else if (playerRef.current?.pause) {
          playerRef.current.pause();
        }
      },
      seekTo: (seconds: number) => {
        if (playerRef.current?.seekTo) {
          playerRef.current.seekTo(seconds, "seconds");
        }
      },
      getCurrentTime: () => currentTime,
      getDuration: () => duration,
    }));

    const formatTime = (time: number): string => {
      if (!Number.isFinite(time)) {
        return "--:--";
      }
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    const handlePlayPause = (): void => {
      if (!playerRef.current) {
        return;
      }
      if (isPlaying) {
        playerRef.current.getInternalPlayer()?.pause?.();
        setIsPlaying(false);
      } else {
        playerRef.current.getInternalPlayer()?.play?.();
        setIsPlaying(true);
      }
    };

    const handleSeek = (value: number[]): void => {
      if (!playerRef.current) {
        return;
      }
      const time = value[0];
      playerRef.current.seekTo(time, "seconds");
      setCurrentTime(time);
    };

    const handleVolumeChange = (value: number[]): void => {
      if (!playerRef.current) {
        return;
      }
      const vol = value[0];
      const internalPlayer = playerRef.current.getInternalPlayer();
      if (internalPlayer && "volume" in internalPlayer) {
        internalPlayer.volume = vol;
      }
      setVolume(vol);
      setIsMuted(vol === 0);
    };

    const toggleMute = (): void => {
      if (!playerRef.current) {
        return;
      }
      const player = playerRef.current.getInternalPlayer();
      const newMuted = !isMuted;
      if (player && "muted" in player) {
        player.muted = newMuted;
      }
      setIsMuted(newMuted);
      if (newMuted) {
        setVolume(0);
      }
    };

    const skipTime = (seconds: number): void => {
      if (!playerRef.current) {
        return;
      }
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      playerRef.current.seekTo(newTime, "seconds");
      setCurrentTime(newTime);
    };

    const toggleFullscreen = (): void => {
      if (!containerRef.current) {
        return;
      }
      if (document.fullscreenElement) {
        document.exitFullscreen();
        setIsFullscreen(false);
      } else {
        containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    };

    useEffect(() => {
      const handleFullscreenChange = (): void => {
        setIsFullscreen(!!document.fullscreenElement);
      };
      document.addEventListener("fullscreenchange", handleFullscreenChange);
      return () => {
        document.removeEventListener(
          "fullscreenchange",
          handleFullscreenChange
        );
      };
    }, []);

    if (!isClient) {
      return (
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-lg border bg-background video-player-loading",
            className
          )}
          ref={containerRef}
          style={{
            width: `${width}px`,
            height: `${height}px`,
            maxWidth: "100%",
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
          </div>
        </div>
      );
    }

    const aspectRatio = height / width;

    return (
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-lg border bg-background",
          className
        )}
        id="video-fullscreen-target"
        ref={containerRef}
        style={{ maxWidth: `${width}px`, aspectRatio, width: "100%" }}
      >
        <ReactPlayerWrapper
          className="react-player"
          config={
            {
              youtube: { playerVars: { playsinline: 1 } },
              vimeo: { playerOptions: { playsinline: true } },
            } as any
          }
          controls={false}
          height="100%"
          muted={isMuted}
          onDuration={(dur: number) => {
            if (Number.isFinite(dur) && dur > 0) {
              setDuration(dur);
            }
          }}
          onEnded={() => setIsPlaying(false)}
          onError={(err: unknown) => {
            console.error("Video error:", err);
            setError("Failed to play video");
            setIsLoading(false);
          }}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onProgress={(state: any) => {
            if (
              Number.isFinite(state.playedSeconds) &&
              state.playedSeconds > 0 &&
              state.playedSeconds < (state.duration ?? Number.POSITIVE_INFINITY)
            ) {
              setCurrentTime(state.playedSeconds);
            }
            if (Number.isFinite(state.duration) && state.duration > 0) {
              setDuration(state.duration);
            }
          }}
          onReady={() => {
            setReady(true);
            setIsLoading(false);
          }}
          onStart={() => setIsPlaying(true)}
          playing={isPlaying}
          playsInline={true}
          ref={playerRef}
          url={videoUrl}
          volume={isMuted ? 0 : volume}
          width="100%"
        />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white p-4 z-10">
            <div className="text-center">
              <p className="font-semibold mb-2">Error: {error}</p>
              <p className="text-sm">
                Please check the video URL or try again later.
              </p>
            </div>
          </div>
        )}

        {!isPlaying && ready && !error && !isLoading && (
          <button
            aria-label="Play video"
            className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer bg-black/20 video-player-overlay"
            onClick={handlePlayPause}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handlePlayPause();
              }
            }}
            type="button"
          >
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center transition-all hover:bg-white hover:scale-110 video-player-play-button">
              <PlayIcon className="ml-1 text-black" size={32} />
            </div>
          </button>
        )}

        <div className="absolute bottom-0 left-0 right-0 z-20 bg-linear-to-t from-black/90 via-black/70 to-transparent p-4 video-player-controls">
          <div className="flex items-center justify-between mb-2 gap-4">
            <div className="flex items-center gap-1">
              <Button
                aria-label="Rewind 10 seconds"
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                onClick={() => skipTime(-10)}
                size="sm"
                variant="ghost"
              >
                <SkipBackIcon size={18} />
              </Button>
              <Button
                aria-label={isPlaying ? "Pause" : "Play"}
                className="text-white hover:bg-white/20 h-10 w-10 p-0 rounded-full"
                onClick={handlePlayPause}
                size="sm"
                variant="ghost"
              >
                {isPlaying ? (
                  <PauseIcon size={20} />
                ) : (
                  <PlayIcon className="ml-1" size={20} />
                )}
              </Button>
              <Button
                aria-label="Forward 10 seconds"
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                onClick={() => skipTime(10)}
                size="sm"
                variant="ghost"
              >
                <SkipForwardIcon size={18} />
              </Button>
            </div>

            <div className="flex-1 flex items-center gap-3 min-w-0">
              <span className="text-xs text-white/80 w-10 text-right shrink-0">
                {formatTime(currentTime)}
              </span>
              <Slider
                aria-label="Seek"
                className="flex-1 h-2"
                max={duration || 100}
                onValueChange={handleSeek}
                step={0.1}
                value={[currentTime]}
              />
              <span className="text-xs text-white/80 w-10 shrink-0">
                {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                aria-label={isMuted ? "Unmute" : "Mute"}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                onClick={toggleMute}
                size="sm"
                variant="ghost"
              >
                {isMuted || volume === 0 ? (
                  <VolumeXIcon size={18} />
                ) : (
                  <Volume2Icon size={18} />
                )}
              </Button>
              <div className="w-24">
                <Slider
                  aria-label="Volume"
                  className="h-2"
                  max={1}
                  onValueChange={handleVolumeChange}
                  step={0.1}
                  value={[isMuted ? 0 : volume]}
                />
              </div>
              <Button
                aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                onClick={toggleFullscreen}
                size="sm"
                variant="ghost"
              >
                {isFullscreen ? (
                  <MinimizeIcon size={18} />
                ) : (
                  <Maximize2Icon size={18} />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
VideoPlayer.displayName = "VideoPlayer";
