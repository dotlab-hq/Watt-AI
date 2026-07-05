import { Sparkles, Palette } from "lucide-react";
import { toast } from "sonner";
import { Artifact } from "@/components/chat/create-artifact";
import { CopyIcon, RedoIcon, UndoIcon } from "@/components/chat/icons";
import { SvgEditor } from "@/components/chat/svg-editor";

export const svgArtifact = new Artifact({
  kind: "svg",
  description: "Useful for generating SVG graphics, diagrams, icons, and logos",
  onStreamPart: ({ streamPart, setArtifact }) => {
    if (streamPart.type === "data-svgDelta") {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.data,
        isVisible:
          draftArtifact.status === "streaming" &&
          draftArtifact.content.length > 100 &&
          draftArtifact.content.length < 110
            ? true
            : draftArtifact.isVisible,
        status: "streaming",
      }));
    }
  },
  content: SvgEditor,
  actions: [
    {
      icon: <UndoIcon size={18} />,
      description: "View Previous version",
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("prev");
      },
      isDisabled: ({ currentVersionIndex }) => {
        if (currentVersionIndex === 0) {
          return true;
        }

        return false;
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: "View Next version",
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("next");
      },
      isDisabled: ({ isCurrentVersion }) => {
        if (isCurrentVersion) {
          return true;
        }

        return false;
      },
    },
    {
      icon: <CopyIcon size={18} />,
      description: "Copy SVG to clipboard",
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content);
        toast.success("Copied SVG to clipboard!");
      },
    },
  ],
  toolbar: [
    {
      icon: <Sparkles size={18} />,
      description: "Add details",
      onClick: ({ sendMessage }) => {
        sendMessage({
          role: "user",
          parts: [
            {
              type: "text",
              text: "Add more details and polish to this SVG",
            },
          ],
        });
      },
    },
    {
      icon: <Palette size={18} />,
      description: "Change colors",
      onClick: ({ sendMessage }) => {
        sendMessage({
          role: "user",
          parts: [
            {
              type: "text",
              text: "Refine the color palette of this SVG to use more harmonious colors",
            },
          ],
        });
      },
    },
  ],
});
