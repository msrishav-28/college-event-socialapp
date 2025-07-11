export interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'pdf'; // Add 'pdf' type
  mediaUrl: string;
  thumbnailUrl?: string;
  category: 'technical' | 'cultural' | 'guest-talks' | 'inter-college' | 'inter-department' | 'sports';
  eventDate: string;
  eventTitle?: string;
  description?: string;
  duration?: number; // for videos in seconds
  pageCount?: number; // for PDFs
  coverImage?: string; // for PDF cover
  aspectRatio: string;
  isBookmarked: boolean;
  viewCount: number;
  engagementTime: number;
  uploadedAt: number;
  tags?: string[];
  location?: string;
  organizer?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bookmarkedEvents: string[];
  preferences: {
    categories: string[];
    notifications: boolean;
    autoplay: boolean;
  };
}

export interface AppState {
  mediaItems: MediaItem[];
  user: User;
  currentCategory: string;
  isLoading: boolean;
  lastRefresh: number;
  error: string | null;
  
  // Actions
  addMediaItem: (item: Omit<MediaItem, 'id' | 'uploadedAt' | 'isBookmarked' | 'viewCount' | 'engagementTime'>) => Promise<void>;
  toggleBookmark: (itemId: string) => Promise<void>;
  setCategory: (category: string) => void;
  updateEngagement: (itemId: string, timeSpent: number) => Promise<void>;
  refreshFeed: () => Promise<void>;
  cleanupOldItems: () => void;
  initializeFirebaseData: () => Promise<void>;
}

export interface GestureState {
  isDragging: boolean;
  startY: number;
  currentY: number;
  velocity: number;
}

export interface FeedItemProps {
  item: MediaItem;
  isActive: boolean;
  onBookmark: (id: string) => void;
  onShare: (item: MediaItem) => void;
  onEngagement: (id: string, time: number) => void;
}