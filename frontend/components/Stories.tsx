"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { apiFetch } from "../lib/api";
import { uploadChatAttachment } from "../lib/upload-file";

export interface Story {
  id: string;
  userId?: string;
  contentType: "image" | "video" | "text";
  contentUrl?: string;
  textContent?: string;
  backgroundColor?: string;
  fontStyle?: string;
  duration: number;
  musicUrl?: string;
  musicTitle?: string;
  viewCount: number;
  createdAt: string;
  expiresAt: string;
  viewed?: boolean;
}

interface UserStory {
  userId: string;
  userName?: string;
  userAvatar?: string;
  stories: Story[];
  storyCount: number;
  hasUnviewed: boolean;
}

interface StoryViewerProps {
  userStories: UserStory[];
  initialUserIndex: number;
  onClose: () => void;
  currentUserId: string;
  onEditStory?: (story: Story) => void;
}

// Story Progress Bar Component
const StoryProgressBar = ({ total, current, progress }: { total: number; current: number; progress: number }) => {
  return (
    <div className="flex gap-1 px-4 pt-4">
      {Array.from({ length: total }).map((_, index) => (
        <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-100"
            style={{
              width: index < current ? "100%" : index === current ? `${progress}%` : "0%",
            }}
          />
        </div>
      ))}
    </div>
  );
};

// Story Viewer Component
export const StoryViewer = ({ userStories, initialUserIndex, onClose, currentUserId, onEditStory }: StoryViewerProps) => {
  const [userIndex, setUserIndex] = useState(initialUserIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentUserStory = userStories[userIndex];
  const currentStory = currentUserStory?.stories[storyIndex];
  const duration = (currentStory?.duration || 5) * 1000;

  const reactions = ["❤️", "😂", "😮", "😢", "🔥", "👏"];

  const recordView = useCallback(async (storyId: string) => {
    try {
      await apiFetch(`/api/stories/${storyId}/view`, {
        method: "POST",
        body: JSON.stringify({ viewerId: currentUserId }),
      });
    } catch (e) {
      // Silently fail
    }
  }, [currentUserId]);

  const goToNextStory = useCallback(() => {
    if (storyIndex < currentUserStory.stories.length - 1) {
      setStoryIndex(prev => prev + 1);
      setProgress(0);
    } else if (userIndex < userStories.length - 1) {
      setUserIndex(prev => prev + 1);
      setStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [storyIndex, userIndex, currentUserStory?.stories.length, userStories.length, onClose]);

  const goToPrevStory = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex(prev => prev - 1);
      setProgress(0);
    } else if (userIndex > 0) {
      setUserIndex(prev => prev - 1);
      setStoryIndex(userStories[userIndex - 1].stories.length - 1);
      setProgress(0);
    }
  }, [storyIndex, userIndex, userStories]);

  // Auto-advance timer
  useEffect(() => {
    if (paused || !currentStory) return;

    timerRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          goToNextStory();
          return 0;
        }
        return prev + (100 / (duration / 100));
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, currentStory, duration, goToNextStory]);

  // Record view when story changes
  useEffect(() => {
    if (currentStory && !currentStory.viewed) {
      recordView(currentStory.id);
    }
  }, [currentStory, recordView]);

  const handleReaction = async (emoji: string) => {
    try {
      await apiFetch(`/api/stories/${currentStory.id}/react`, {
        method: "POST",
        body: JSON.stringify({ viewerId: currentUserId, reaction: emoji }),
      });
      setShowReactions(false);
    } catch (e) {
      console.error("Error sending reaction:", e);
    }
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 text-white text-2xl p-2 hover:bg-white/20 rounded-full"
      >
        ✕
      </button>

      {/* Story container */}
      <div 
        className="relative w-full max-w-md h-full max-h-[90vh] bg-gray-900 rounded-xl overflow-hidden"
        onMouseDown={() => setPaused(true)}
        onMouseUp={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        {/* Progress bars */}
        <StoryProgressBar
          total={currentUserStory.stories.length}
          current={storyIndex}
          progress={progress}
        />

        {/* User info header */}
        <div className="absolute top-8 left-4 right-4 flex items-center gap-3 z-20">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
            {currentUserStory.userName?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">{currentUserStory.userName || "User"}</p>
            <p className="text-white/60 text-xs">{new Date(currentStory.createdAt).toLocaleTimeString()}</p>
          </div>
          {onEditStory && currentUserStory.userId === currentUserId && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditStory(currentStory as Story);
              }}
              className="text-white text-sm px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30"
            >
              Edit
            </button>
          )}
        </div>

        {/* Story content */}
        <div className="absolute inset-0 flex items-center justify-center">
          {currentStory.contentType === "image" && currentStory.contentUrl && (
            <img
              src={currentStory.contentUrl}
              alt="Story"
              className="w-full h-full object-cover"
            />
          )}
          {currentStory.contentType === "video" && currentStory.contentUrl && (
            <video
              src={currentStory.contentUrl}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          )}
          {currentStory.contentType === "text" && (
            <div
              className="w-full h-full flex items-center justify-center p-8"
              style={{ backgroundColor: currentStory.backgroundColor || "#000" }}
            >
              <p className="text-white text-2xl text-center font-medium" style={{ fontStyle: currentStory.fontStyle }}>
                {currentStory.textContent}
              </p>
            </div>
          )}
        </div>

        {/* Navigation areas */}
        <div className="absolute inset-0 flex z-10">
          <div className="w-1/3 h-full" onClick={goToPrevStory} />
          <div className="w-1/3 h-full" />
          <div className="w-1/3 h-full" onClick={goToNextStory} />
        </div>

        {/* Bottom actions */}
        <div className="absolute bottom-6 left-4 right-4 flex items-center gap-3 z-20">
          <input
            type="text"
            placeholder="Send a message..."
            className="flex-1 px-4 py-3 bg-white/20 backdrop-blur-sm rounded-full text-white placeholder-white/60 border border-white/30"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setShowReactions(!showReactions)}
            className="p-3 bg-white/20 backdrop-blur-sm rounded-full text-white"
          >
            ❤️
          </button>
        </div>

        {/* Reactions popup */}
        {showReactions && (
          <div className="absolute bottom-20 right-4 bg-white rounded-2xl p-3 flex gap-2 shadow-xl z-30">
            {reactions.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="text-2xl hover:scale-125 transition-transform p-1"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* View count */}
        <div className="absolute bottom-20 left-4 text-white/60 text-sm z-20">
          👁 {currentStory.viewCount} views
        </div>
      </div>

      {/* Navigation arrows for desktop */}
      {userIndex > 0 && (
        <button
          onClick={() => {
            setUserIndex(prev => prev - 1);
            setStoryIndex(0);
            setProgress(0);
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl p-2 hover:bg-white/20 rounded-full hidden md:block"
        >
          ‹
        </button>
      )}
      {userIndex < userStories.length - 1 && (
        <button
          onClick={() => {
            setUserIndex(prev => prev + 1);
            setStoryIndex(0);
            setProgress(0);
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl p-2 hover:bg-white/20 rounded-full hidden md:block"
        >
          ›
        </button>
      )}
    </div>
  );
};

// Create Story Modal
interface CreateStoryModalProps {
  onClose: () => void;
  onCreated: () => void;
  userId: string;
  /** When set, modal updates this story (PUT) instead of creating. */
  initialStory?: Story | null;
}

export const CreateStoryModal = ({ onClose, onCreated, userId, initialStory }: CreateStoryModalProps) => {
  const [contentType, setContentType] = useState<"image" | "video" | "text">("text");
  const [textContent, setTextContent] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#10b981");
  const [contentUrl, setContentUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!initialStory) return;
    setContentType(initialStory.contentType);
    setTextContent(initialStory.textContent || "");
    setBackgroundColor(initialStory.backgroundColor || "#10b981");
    setContentUrl(initialStory.contentUrl || "");
  }, [initialStory]);

  const backgroundColors = [
    "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#f97316",
    "#ef4444", "#14b8a6", "#6366f1", "#000000", "#1f2937"
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadChatAttachment(file, { uploadedBy: userId });
      if (result.fileUrl) {
        setContentUrl(result.fileUrl);
        setContentType(file.type.startsWith("video") ? "video" : "image");
      }
    } catch (error) {
      console.error("Error uploading:", error);
      alert("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async () => {
    if (contentType === "text" && !textContent.trim()) {
      alert("Please enter text for your story");
      return;
    }
    if ((contentType === "image" || contentType === "video") && !contentUrl) {
      alert("Please upload an image or video");
      return;
    }

    setCreating(true);
    try {
      const body = {
        contentType,
        textContent: contentType === "text" ? textContent : null,
        contentUrl: contentType !== "text" ? contentUrl : null,
        backgroundColor: contentType === "text" ? backgroundColor : null,
        duration: 5,
      };
      if (initialStory?.id) {
        await apiFetch(`/api/stories/${initialStory.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch("/api/stories", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      onCreated();
    } catch (error) {
      console.error("Error saving story:", error);
      alert(initialStory?.id ? "Failed to update story" : "Failed to create story");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold">{initialStory?.id ? "Edit Story" : "Create Story"}</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl">✕</button>
        </div>

        {/* Content type selector */}
        <div className="flex border-b">
          {[
            { type: "text" as const, icon: "📝", label: "Text" },
            { type: "image" as const, icon: "📷", label: "Photo" },
            { type: "video" as const, icon: "🎥", label: "Video" },
          ].map(({ type, icon, label }) => (
            <button
              key={type}
              onClick={() => setContentType(type)}
              className={`flex-1 py-3 flex items-center justify-center gap-2 transition-colors ${
                contentType === type
                  ? "bg-emerald-50 text-emerald-600 border-b-2 border-emerald-500"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <span>{icon}</span>
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>

        {/* Preview area */}
        <div className="p-4">
          <div
            className="aspect-[9/16] rounded-xl overflow-hidden flex items-center justify-center relative"
            style={contentType === "text" ? { backgroundColor } : { backgroundColor: "#1f2937" }}
          >
            {contentType === "text" && (
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Type your story..."
                className="w-full h-full bg-transparent text-white text-xl text-center p-6 resize-none focus:outline-none placeholder-white/50"
                maxLength={200}
              />
            )}
            {contentType === "image" && (
              contentUrl ? (
                <img src={contentUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-white/50">
                  <p className="text-4xl mb-2">📷</p>
                  <p>Click to upload photo</p>
                </div>
              )
            )}
            {contentType === "video" && (
              contentUrl ? (
                <video src={contentUrl} controls className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-white/50">
                  <p className="text-4xl mb-2">🎥</p>
                  <p>Click to upload video</p>
                </div>
              )
            )}

            {/* Upload overlay for image/video */}
            {(contentType === "image" || contentType === "video") && !contentUrl && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center"
                disabled={uploading}
              >
                {uploading && (
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent" />
                )}
              </button>
            )}
          </div>

          {/* Color picker for text */}
          {contentType === "text" && (
            <div className="mt-4 flex gap-2 justify-center">
              {backgroundColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setBackgroundColor(color)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    backgroundColor === color ? "scale-125 ring-2 ring-offset-2 ring-gray-400" : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={contentType === "video" ? "video/*" : "image/*"}
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Actions */}
        <div className="p-4 border-t">
          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {creating ? (
              <>
                <span className="animate-spin">⏳</span>
                Creating...
              </>
            ) : (
              <>
                <span>✨</span>
                {initialStory?.id ? "Save changes" : "Share Story"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Stories Bar Component (horizontal scrolling stories)
interface StoriesBarProps {
  onStoryClick: (userStories: UserStory[], index: number) => void;
  onCreateClick: () => void;
  currentUserId: string;
  users: Map<string, { fullname?: string; name?: string; email?: string; avatarUrl?: string }>;
  /** Hide “Your Story” when false (e.g. students). Default true. */
  allowCreate?: boolean;
  /** Increment to refetch the feed after create/update. */
  refreshKey?: number;
}

export const StoriesBar = ({ onStoryClick, onCreateClick, currentUserId, users, allowCreate = true, refreshKey = 0 }: StoriesBarProps) => {
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStories = async () => {
    try {
      const data = await apiFetch(`/api/stories/feed?userId=${currentUserId}`).catch(() => []);
      const stories = Array.isArray(data) ? data : [];
      
      // Enrich with user names
      const enrichedStories = stories.map((us: UserStory) => {
        const user = users.get(us.userId);
        return {
          ...us,
          userName: user?.fullname || user?.name || user?.email?.split("@")[0] || "User",
          userAvatar: (user as any)?.avatarUrl,
        };
      });
      
      setUserStories(enrichedStories);
    } catch (error) {
      console.error("Error fetching stories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
    // Refresh stories every 30 seconds
    const interval = setInterval(fetchStories, 30000);
    return () => clearInterval(interval);
  }, [currentUserId, users, refreshKey]);

  if (loading) {
    return (
      <div className="flex gap-4 px-4 py-3 overflow-x-auto bg-white border-b">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1 animate-pulse">
            <div className="w-16 h-16 rounded-full bg-gray-200" />
            <div className="w-12 h-3 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 px-4 py-3 overflow-x-auto bg-white border-b scrollbar-hide">
      {/* Create story button */}
      {allowCreate && (
      <button
        onClick={onCreateClick}
        className="flex flex-col items-center gap-1 flex-shrink-0"
      >
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center border-2 border-dashed border-emerald-400">
          <span className="text-2xl">+</span>
        </div>
        <span className="text-xs text-gray-600 font-medium">Your Story</span>
      </button>
      )}

      {/* User stories */}
      {userStories.map((us, index) => (
        <button
          key={us.userId}
          onClick={() => onStoryClick(userStories, index)}
          className="flex flex-col items-center gap-1 flex-shrink-0"
        >
          <div
            className={`w-16 h-16 rounded-full p-0.5 ${
              us.hasUnviewed
                ? "bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500"
                : "bg-gray-300"
            }`}
          >
            <div className="w-full h-full rounded-full bg-white p-0.5">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
                {us.userName?.charAt(0)?.toUpperCase() || "?"}
              </div>
            </div>
          </div>
          <span className="text-xs text-gray-600 font-medium truncate w-16 text-center">
            {us.userName}
          </span>
        </button>
      ))}

      {userStories.length === 0 && (
        <div className="flex items-center justify-center text-gray-400 text-sm px-4">
          No stories yet. Be the first to share!
        </div>
      )}
    </div>
  );
};

export default StoriesBar;
