import { Maximize2Icon, PanelRightCloseIcon } from "lucide-react";
import { toast } from "sonner";
import { Artifact } from "@/components/chat/create-artifact";
import { CopyIcon, ExternalLinkIcon, PlayIcon } from "@/components/chat/icons";
import { VideoPlayer } from "@/components/chat/video-player";

type Metadata = {
  videoUrl: string;
  videoTitle: string;
  width: number;
  height: number;
};

export const videoArtifact = new Artifact<"video", Metadata>({
  kind: "video",
  description:
    "Useful for sharing and viewing video content with interactive players.",
  initialize: ({ setMetadata }) => {
    setMetadata({
      videoUrl: "",
      videoTitle: "",
      width: 640,
      height: 360,
    });
  },
  onStreamPart: ({ streamPart, setArtifact, setMetadata }) => {
    if (streamPart.type === "data-videoDelta") {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.data,
        isVisible:
          draftArtifact.status === "streaming" &&
          draftArtifact.content.length > 100 &&
          draftArtifact.content.length < 150
            ? true
            : draftArtifact.isVisible,
        status: "streaming",
      }));
    }

    if (streamPart.type === "data-videoMetadata" && setMetadata) {
      setMetadata((metadata) => ({
        ...metadata,
        ...streamPart.data,
      }));
    }
  },
  content: ({
    metadata,
    mode,
    status,
    content,
    currentVersionIndex,
    getDocumentContentById,
  }) => {
    if (status === "streaming" && !content) {
      return (
        <div className="flex h-[calc(100dvh-60px)] items-center justify-center gap-4 text-muted-foreground">
          <div className="animate-spin">
            <svg className="size-8" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div>Generating video content...</div>
        </div>
      );
    }

    const width = metadata?.width || 640;
    const height = metadata?.height || 360;
    const title = metadata?.videoTitle || "Video Player";
    const videoUrl = metadata?.videoUrl;

    if (!videoUrl) {
      return (
        <div className="flex h-[calc(100dvh-60px)] flex-col items-center justify-center gap-4 text-muted-foreground">
          <PlayIcon size={64} />
          <div>
            No video content available. Ask the AI to provide a video URL.
          </div>
        </div>
      );
    }

    if (mode === "diff") {
      const selectedContent = getDocumentContentById(currentVersionIndex);
      const prevContent =
        currentVersionIndex > 0
          ? getDocumentContentById(currentVersionIndex - 1)
          : selectedContent;

      return (
        <div className="px-4 py-8 md:px-16 md:py-12 lg:px-20">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Current Version</h3>
            <VideoPlayer
              height={height}
              title={title}
              videoUrl={videoUrl}
              width={width}
            />
          </div>
          <div className="border-t border-border pt-4">
            <h3 className="text-lg font-semibold">Previous Version</h3>
            <VideoPlayer
              height={height}
              title="Previous Version"
              videoUrl={
                prevContent.includes("https://") ? prevContent : videoUrl
              }
              width={width}
            />
          </div>
        </div>
      );
    }

    return (
      <VideoPlayer
        className="h-full"
        height={height}
        title={title}
        videoUrl={videoUrl}
        width={width}
      />
    );
  },
  actions: [
    {
      icon: <CopyIcon size={18} />,
      description: "Copy video URL",
      onClick: ({ metadata }) => {
        if (metadata?.videoUrl) {
          navigator.clipboard.writeText(metadata.videoUrl);
          toast.success("Video URL copied to clipboard!");
        }
      },
      isDisabled: ({ metadata }) => !metadata?.videoUrl,
    },
    {
      icon: <ExternalLinkIcon size={18} />,
      description: "Open in new tab",
      onClick: ({ metadata }) => {
        if (metadata?.videoUrl) {
          window.open(metadata.videoUrl, "_blank");
        }
      },
      isDisabled: ({ metadata }) => !metadata?.videoUrl,
    },
    {
      icon: <Maximize2Icon size={18} />,
      description: "Fullscreen",
      onClick: ({ metadata }) => {
        const videoElement = document.getElementById("video-fullscreen-target");
        if (
          metadata?.videoUrl &&
          videoElement &&
          videoElement.requestFullscreen
        ) {
          videoElement.requestFullscreen();
        }
      },
      isDisabled: ({ metadata }) => !metadata?.videoUrl,
    },
    {
      icon: <PanelRightCloseIcon size={18} />,
      description: "Close sidebar",
      onClick: () => {
        toast.info(
          "Video sidebar closed. Video will remain visible in the main chat area."
        );
      },
    },
    {
      description: "Adjust video size",
      icon: (
        <svg
          fill="none"
          height="18"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="18"
        >
          <rect height="18" rx="2" ry="2" width="18" x="3" y="3" />
          <line x1="9" x2="9" y1="3" y2="21" />
          <line x1="15" x2="15" y1="3" y2="21" />
          <line x1="3" x2="21" y1="9" y2="9" />
          <line x1="3" x2="21" y1="15" y2="15" />
        </svg>
      ),
      onClick: ({ metadata, setMetadata }) => {
        const newWidth =
          metadata?.width === 640 ? 1280 : metadata?.width === 1280 ? 854 : 640;
        const newHeight =
          metadata?.height === 360 ? 720 : metadata?.height === 720 ? 480 : 360;

        setMetadata((prev) => ({
          ...prev,
          width: newWidth,
          height: newHeight,
        }));
      },
    },
  ],
  toolbar: [],
});
