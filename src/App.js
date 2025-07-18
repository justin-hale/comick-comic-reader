import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Book,
  ArrowLeft,
  Upload,
  Database,
  Search,
  BookOpen
} from 'lucide-react';

import { firebaseAPI } from './firebase/api';

// Authentication Prompt Component
const AuthPrompt = ({ handleGoogleSignIn, isLoading, uploadStatus }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
      <BookOpen className="w-16 h-16 text-blue-600 mx-auto mb-6" />
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Comic Library</h1>
      <p className="text-gray-600 mb-8">
        Sign in with your Google account to access your personal comic library across all devices.
      </p>

      <button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full flex items-center justify-center space-x-3 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 mb-4"
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Sign in with Google</span>
          </>
        )}
      </button>

      {uploadStatus && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{uploadStatus}</p>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-4">
        Your data is private and secure. We only access your email and name for authentication.
      </p>
    </div>
  </div>
);

// Series Card Component
const SeriesCard = ({ series, onClick }) => (
  <div
    onClick={onClick}
    className="group cursor-pointer transform transition-all duration-200 hover:scale-105 active:scale-95"
  >
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="aspect-[3/4] relative">
        <img
          src={series.coverImage}
          alt={series.title}
          className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-200"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <h3 className="text-white font-semibold text-sm">{series.title}</h3>
        </div>
      </div>
    </div>
  </div>
);

// Chapter Card Component  
const ChapterCard = ({ chapter, onClick }) => (
  <div
    onClick={onClick}
    className="group cursor-pointer transform transition-all duration-200 hover:scale-105 active:scale-95"
  >
    <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="aspect-[3/4] relative">
        <img
          src={chapter.coverImage}
          alt={chapter.title}
          className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-200"
        />

        {chapter.isRead && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">✓</span>
          </div>
        )}

        {chapter.lastPage > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent">
            <div className="px-3 pb-2">
              <div className="w-full bg-white/30 rounded-full h-1">
                <div
                  className="bg-orange-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${((chapter.lastPage + 1) / chapter.pageCount) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <p className="text-white font-semibold text-sm">Ch. {chapter.chapterNumber}</p>
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-gray-900 text-sm truncate">{chapter.title}</h3>
        <p className="text-xs text-gray-500 mt-1">
          {chapter.pageCount} pages
          {chapter.lastPage > 0 && ` • Page ${chapter.lastPage + 1}`}
        </p>
      </div>
    </div>
  </div>
);

const UniversalComicReader = () => {
  const [currentView, setCurrentView] = useState('library');
  const [series, setSeries] = useState({});
  const [currentSeries, setCurrentSeries] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [currentChapter, setCurrentChapter] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const readerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showReaderHeader, setShowReaderHeader] = useState(true);
  const [imageScale, setImageScale] = useState('fit'); // 'fit', 'width', 'height'
  const [dualPageMode, setDualPageMode] = useState('auto'); // 'auto', 'single', 'dual'

  // Initialize app
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    setAuthLoading(true);

    try {
      // Initialize Firebase Auth
      const authResult = await firebaseAPI.initAuth();

      if (authResult.userId) {
        setUser(authResult.userInfo);

        // Load user's data
        const loadedSeries = await firebaseAPI.loadSeries();
        setSeries(loadedSeries);

        if (Object.keys(loadedSeries).length === 0) {
          setUploadStatus('Welcome! Upload comic JSON files to build your library.');
        }

        setShowAuthPrompt(false);
      } else {
        // User not signed in
        setShowAuthPrompt(true);
        setUploadStatus('Please sign in with Google to access your comic library.');
      }
    } catch (error) {
      console.error('Error initializing app:', error);
      setUploadStatus('Error loading data.');
      setShowAuthPrompt(true);
    } finally {
      setAuthLoading(false);
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const authResult = await firebaseAPI.signInWithGoogle();

      if (authResult.userId) {
        setUser(authResult.userInfo);

        // Load user's data after sign-in
        const loadedSeries = await firebaseAPI.loadSeries();
        setSeries(loadedSeries);
        setShowAuthPrompt(false);

        setUploadStatus(`Welcome ${authResult.userInfo.displayName}! Upload comics to get started.`);
        setTimeout(() => setUploadStatus(''), 3000);
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      setUploadStatus(`Sign-in failed: ${error.message}`);
      setTimeout(() => setUploadStatus(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await firebaseAPI.signOutUser();
      setUser(null);
      setSeries({});
      setChapters([]);
      setCurrentSeries(null);
      setCurrentView('library');
      setShowAuthPrompt(true);
      setUploadStatus('Signed out successfully.');
    } catch (error) {
      console.error('Sign-out error:', error);
    }
  };

  // Detect series from chapter data or create new one
  const detectOrCreateSeries = async (chapterData, fileName) => {
    let seriesName = 'Unknown Series';
    let seriesSlug = 'unknown-series';

    if (fileName.includes('dragon_ball_super') || chapterData.title?.includes('Dragon Ball')) {
      seriesName = 'Dragon Ball Super';
      seriesSlug = 'dragon-ball-super';
    } else if (fileName.includes('one_piece') || chapterData.title?.includes('One Piece')) {
      seriesName = 'One Piece';
      seriesSlug = 'one-piece';
    } else if (fileName.includes('naruto') || chapterData.title?.includes('Naruto')) {
      seriesName = 'Naruto';
      seriesSlug = 'naruto';
    } else {
      const baseName = fileName.replace('.json', '').replace(/_chapter_\d+/, '');
      seriesName = baseName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      seriesSlug = baseName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    }

    return {
      slug: seriesSlug,
      title: seriesName,
      description: `Comic series: ${seriesName}`,
      coverImage: chapterData.coverImage || chapterData.pages?.[0]?.imageUrl || '',
      totalChapters: 0,
      addedAt: new Date().toISOString(),
      lastReadAt: null
    };
  };

  // Handle JSON file upload
  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setUploadStatus('Processing uploads...');

    try {
      const processedSeries = {};

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const text = await file.text();
        const chapterData = JSON.parse(text);

        if (chapterData.id && chapterData.pages && chapterData.pages.length > 0) {
          const seriesInfo = await detectOrCreateSeries(chapterData, file.name);

          if (seriesInfo) {
            await firebaseAPI.saveChapter(seriesInfo.slug, chapterData);

            if (!processedSeries[seriesInfo.slug]) {
              processedSeries[seriesInfo.slug] = seriesInfo;
            }
          }
        }
      }

      // Save all new series
      for (const [slug, seriesInfo] of Object.entries(processedSeries)) {
        await firebaseAPI.saveSeries(seriesInfo);
      }

      // Reload app data
      await initializeApp();

      setUploadStatus(`Successfully processed ${files.length} files across ${Object.keys(processedSeries).length} series!`);
      setTimeout(() => setUploadStatus(''), 3000);

    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadStatus('Error processing files. Please check the JSON format.');
      setTimeout(() => setUploadStatus(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Open series view
  const openSeries = async (seriesSlug) => {
    setIsLoading(true);
    setCurrentSeries(series[seriesSlug]);

    try {
      const [seriesChapters, progress] = await Promise.all([
        firebaseAPI.loadChapters(seriesSlug),
        firebaseAPI.loadProgress(seriesSlug)
      ]);

      console.log('Loaded chapters:', seriesChapters.length);
      console.log('Loaded progress:', Object.keys(progress).length);

      // Merge chapters with progress data
      const chaptersWithProgress = seriesChapters.map(chapter => {
        const chapterProgress = progress[chapter.id.toString()] || {};
        return {
          ...chapter,
          isRead: chapterProgress.isRead || false,
          lastPage: chapterProgress.lastPage || 0
        };
      });

      console.log('Chapters with progress:', chaptersWithProgress.map(ch => ({
        id: ch.id,
        title: ch.title,
        isRead: ch.isRead,
        lastPage: ch.lastPage
      })));

      setChapters(chaptersWithProgress);
      setCurrentView('series');

    } catch (error) {
      console.error('Error opening series:', error);
      setUploadStatus('Error loading series data.');
    } finally {
      setIsLoading(false);
    }
  };

  // Save reading progress - FIXED VERSION
  const saveProgress = async (chapterId, isRead, lastPage = 0) => {
    if (!currentSeries || !currentChapter) return;

    try {
      console.log('Saving progress:', {
        series: currentSeries.slug,
        chapterId,
        isRead,
        lastPage
      });

      await firebaseAPI.saveProgress(currentSeries.slug, {
        id: chapterId,
        isRead,
        lastPage,
        chapterNumber: currentChapter.chapterNumber,
        title: currentChapter.title
      });

      // Update local state immediately
      setChapters(prev => prev.map(ch =>
        ch.id.toString() === chapterId.toString() ? { ...ch, isRead, lastPage } : ch
      ));

      console.log('Progress saved successfully');

    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  // Open chapter in reader
  const openChapter = (chapter) => {
    console.log('Opening chapter:', chapter.title, 'Last page:', chapter.lastPage);
    setCurrentChapter(chapter);
    setCurrentPage(chapter.lastPage || 0);
    setCurrentView('reader');

    // Mark as read when opening
    if (!chapter.isRead) {
      saveProgress(chapter.id, true, chapter.lastPage || 0);
    }
  };

  // Navigation functions - UPDATED FOR DUAL PAGE MODE
  const nextPage = () => {
    if (currentChapter) {
      const isDual = shouldShowDualPages();
      const increment = isDual ? 2 : 1;
      
      if (currentPage + increment <= currentChapter.pageCount - 1) {
        const newPage = currentPage + increment;
        setCurrentPage(newPage);
        // Save progress for the furthest page viewed
        saveProgress(currentChapter.id, true, newPage);
      } else {
        // Move to next chapter
        const currentIndex = chapters.findIndex(ch => ch.id === currentChapter.id);
        if (currentIndex < chapters.length - 1) {
          const nextChapter = chapters[currentIndex + 1];
          // Mark current chapter as fully read before moving to next
          saveProgress(currentChapter.id, true, currentChapter.pageCount - 1);
          openChapter(nextChapter);
        }
      }
    }
  };

  const prevPage = () => {
    const isDual = shouldShowDualPages();
    const decrement = isDual ? 2 : 1;
    
    if (currentPage - decrement >= 0) {
      const newPage = currentPage - decrement;
      setCurrentPage(newPage);
      // Save progress for current page
      saveProgress(currentChapter.id, true, newPage);
    } else if (currentChapter) {
      // Move to previous chapter
      const currentIndex = chapters.findIndex(ch => ch.id === currentChapter.id);
      if (currentIndex > 0) {
        const prevChapter = chapters[currentIndex - 1];
        setCurrentChapter(prevChapter);
        // Go to last page or second-to-last page depending on dual mode
        const lastPageOfPrevChapter = isDual && prevChapter.pageCount > 1 
          ? prevChapter.pageCount - 2 
          : prevChapter.pageCount - 1;
        setCurrentPage(Math.max(0, lastPageOfPrevChapter));
        saveProgress(prevChapter.id, true, lastPageOfPrevChapter);
      }
    }
  };

  // Touch/click handling - UPDATED FOR HEADER TOGGLE
  const handleReaderClick = (e) => {
    if (!readerRef.current) return;

    const rect = readerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;

    // Define tap zones
    const leftZone = width * 0.25;
    const rightZone = width * 0.75;
    const topZone = height * 0.25;
    const bottomZone = height * 0.75;

    // Middle zone for header toggle
    if (clickX >= leftZone && clickX <= rightZone && clickY >= topZone && clickY <= bottomZone) {
      setShowReaderHeader(!showReaderHeader);
    }
    // Left zone for previous page
    else if (clickX < leftZone) {
      prevPage();
    }
    // Right zone for next page
    else if (clickX > rightZone) {
      nextPage();
    }
  };

  // Check if we should show dual pages
  const shouldShowDualPages = () => {
    if (dualPageMode === 'single') return false;
    if (dualPageMode === 'dual') return true;
    // Auto mode: show dual pages if landscape and we have enough pages
    return window.innerWidth > window.innerHeight && currentChapter && currentPage < currentChapter.pageCount - 1;
  };

  // Get the current page(s) to display
  const getCurrentPages = () => {
    if (!currentChapter) return [];
    
    if (shouldShowDualPages()) {
      // Show current page and next page
      const pages = [currentChapter.pages[currentPage]];
      if (currentPage + 1 < currentChapter.pageCount) {
        pages.push(currentChapter.pages[currentPage + 1]);
      }
      return pages;
    } else {
      // Single page mode
      return [currentChapter.pages[currentPage]];
    }
  };

  // Toggle dual page mode
  const toggleDualPageMode = () => {
    const modes = ['auto', 'single', 'dual'];
    const currentIndex = modes.indexOf(dualPageMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setDualPageMode(modes[nextIndex]);
  };

  // Toggle image scaling mode
  const toggleImageScale = () => {
    const scales = ['fit', 'width', 'height'];
    const currentIndex = scales.indexOf(imageScale);
    const nextIndex = (currentIndex + 1) % scales.length;
    setImageScale(scales[nextIndex]);
  };

  // Get image scaling classes based on current mode and dual page state
  const getImageClasses = () => {
    const isDual = shouldShowDualPages();
    
    switch (imageScale) {
      case 'width':
        return isDual ? 'w-1/2 h-auto' : 'w-full h-auto';
      case 'height':
        return 'w-auto h-full';
      case 'fit':
      default:
        return isDual ? 'max-w-1/2 max-h-full object-contain' : 'max-w-full max-h-full object-contain';
    }
  };

  // Keyboard navigation - UPDATED FOR DUAL PAGE MODE
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (currentView === 'reader') {
        if (e.key === 'ArrowLeft' || e.key === 'a') {
          const isDual = shouldShowDualPages();
          const decrement = isDual ? 2 : 1;
          
          if (currentPage - decrement >= 0) {
            const newPage = currentPage - decrement;
            setCurrentPage(newPage);
            saveProgress(currentChapter.id, true, newPage);
          } else if (currentChapter) {
            const currentIndex = chapters.findIndex(ch => ch.id === currentChapter.id);
            if (currentIndex > 0) {
              const prevChapter = chapters[currentIndex - 1];
              setCurrentChapter(prevChapter);
              const lastPageOfPrevChapter = isDual && prevChapter.pageCount > 1 
                ? prevChapter.pageCount - 2 
                : prevChapter.pageCount - 1;
              setCurrentPage(Math.max(0, lastPageOfPrevChapter));
              saveProgress(prevChapter.id, true, lastPageOfPrevChapter);
            }
          }
        } else if (e.key === 'ArrowRight' || e.key === 'd') {
          const isDual = shouldShowDualPages();
          const increment = isDual ? 2 : 1;
          
          if (currentChapter && currentPage + increment <= currentChapter.pageCount - 1) {
            const newPage = currentPage + increment;
            setCurrentPage(newPage);
            saveProgress(currentChapter.id, true, newPage);
          } else if (currentChapter) {
            const currentIndex = chapters.findIndex(ch => ch.id === currentChapter.id);
            if (currentIndex < chapters.length - 1) {
              const nextChapter = chapters[currentIndex + 1];
              // Mark current chapter as fully read
              saveProgress(currentChapter.id, true, currentChapter.pageCount - 1);
              openChapter(nextChapter);
            }
          }
        } else if (e.key === 'Escape') {
          setCurrentView('series');
        } else if (e.key === ' ' || e.key === 'h') {
          // Spacebar or 'h' to toggle header
          e.preventDefault();
          setShowReaderHeader(!showReaderHeader);
        } else if (e.key === 's') {
          // 's' to cycle through image scaling modes
          e.preventDefault();
          toggleImageScale();
        } else if (e.key === 'p') {
          // 'p' to cycle through page modes
          e.preventDefault();
          toggleDualPageMode();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentView, currentPage, currentChapter, chapters, showReaderHeader, imageScale, dualPageMode]);

  // Filter series and chapters
  const filteredSeries = Object.values(series).filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredChapters = chapters.filter(chapter =>
    chapter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chapter.chapterNumber.toString().includes(searchTerm)
  );

  // Library View
  const LibraryView = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Comic Library</h1>
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-3">
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full"
                />
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{user.displayName}</div>
                  <div className="text-gray-500">{user.email}</div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-600 hover:text-gray-900 px-2 py-1 rounded"
                >
                  Sign Out
                </button>
              </div>
            )}

            <div className="flex items-center space-x-2 text-sm text-gray-600 bg-white px-3 py-2 rounded-lg">
              <Database className="w-4 h-4" />
              <span>{Object.keys(series).length} series</span>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="mb-8 p-6 bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Add Comics</h3>
              <p className="text-sm text-gray-600">Upload JSON files from your bookmarklet extractions</p>
            </div>
            <div className="flex items-center space-x-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>Upload JSON Files</span>
              </button>
            </div>
          </div>

          {uploadStatus && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">{uploadStatus}</p>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="mb-6 flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search series..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Series Grid */}
        {filteredSeries.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredSeries.map((seriesItem) => (
              <SeriesCard
                key={seriesItem.slug}
                series={seriesItem}
                onClick={() => openSeries(seriesItem.slug)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Comics Found</h3>
            <p className="text-gray-600 mb-4">Upload JSON files from your bookmarklet to build your library</p>
          </div>
        )}
      </div>
    </div>
  );

  // Series View
  const SeriesView = () => (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCurrentView('library')}
              className="p-2 rounded-lg hover:bg-white/50 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <Book className="w-8 h-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-gray-900">{currentSeries?.title}</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600 bg-white px-3 py-2 rounded-lg">
              <span>{chapters.filter(ch => ch.isRead).length}/{chapters.length} read</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search chapters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {/* Chapters Grid */}
        {filteredChapters.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredChapters.map((chapter) => (
              <ChapterCard
                key={chapter.id}
                chapter={chapter}
                onClick={() => openChapter(chapter)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Book className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Chapters Found</h3>
            <p className="text-gray-600">Upload more chapters for this series</p>
          </div>
        )}
      </div>
    </div>
  );

  // Reader View - IMPROVED WITH RESPONSIVE SCALING AND TOGGLEABLE HEADER
  const ReaderView = () => {
    const currentPageData = currentChapter?.pages[currentPage];

    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Header - Toggleable */}
        <div 
          className={`absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black via-black/90 to-transparent text-white p-4 transition-all duration-300 ${
            showReaderHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
          }`}
        >
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentView('series')}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back to {currentSeries?.title}</span>
              <span className="sm:hidden">Back</span>
            </button>

            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium hidden md:inline">{currentChapter?.title}</span>
              <span className="text-sm text-gray-300">
                {shouldShowDualPages() && currentPage + 1 < currentChapter?.pageCount 
                  ? `${currentPage + 1}-${currentPage + 2} / ${currentChapter?.pageCount}`
                  : `${currentPage + 1} / ${currentChapter?.pageCount}`
                }
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Dual page mode toggle */}
              <button
                onClick={toggleDualPageMode}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-xs"
                title={`Page mode: ${dualPageMode}`}
              >
                <div className="w-4 h-4 border border-white rounded flex items-center justify-center">
                  {dualPageMode === 'auto' && '⟷'}
                  {dualPageMode === 'single' && '▊'}
                  {dualPageMode === 'dual' && '▊▊'}
                </div>
              </button>
              
              {/* Image scaling toggle */}
              <button
                onClick={toggleImageScale}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-xs"
                title={`Scale: ${imageScale}`}
              >
                <div className="w-4 h-4 border border-white rounded flex items-center justify-center">
                  {imageScale === 'fit' && '⊞'}
                  {imageScale === 'width' && '↔'}
                  {imageScale === 'height' && '↕'}
                </div>
              </button>
              
              <button
                onClick={prevPage}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextPage}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Image Container */}
        <div
          ref={readerRef}
          onClick={handleReaderClick}
          className="flex-1 flex items-center justify-center relative cursor-pointer select-none overflow-auto bg-black"
          style={{ height: '100vh' }}
        >
          {getCurrentPages().map((pageData, index) => (
            <img
              key={`${currentPage + index}`}
              src={pageData.imageUrl}
              alt={`Page ${currentPage + index + 1}`}
              className={`${getImageClasses()} transition-all duration-200 ${
                shouldShowDualPages() ? (index === 0 ? 'mr-1' : 'ml-1') : ''
              }`}
              style={{
                maxHeight: showReaderHeader ? 'calc(100vh - 80px)' : '100vh',
                maxWidth: shouldShowDualPages() ? '50vw' : '100vw'
              }}
              onLoad={(e) => {
                // Optional: Log image dimensions for debugging
                console.log('Image loaded:', {
                  page: currentPage + index + 1,
                  natural: { width: e.target.naturalWidth, height: e.target.naturalHeight },
                  displayed: { width: e.target.width, height: e.target.height },
                  scale: imageScale,
                  dualMode: shouldShowDualPages()
                });
              }}
            />
          ))}

          {/* Instructions overlay - fades with header */}
          <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/60 text-sm bg-black/50 px-3 py-2 rounded-lg transition-all duration-300 ${
            showReaderHeader ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
          }`}>
            {showReaderHeader 
              ? `Tap left/right to navigate${shouldShowDualPages() ? ' (dual-page)' : ''} • Center to hide controls • ESC to return`
              : `Tap center to show controls • Left/Right to navigate${shouldShowDualPages() ? ' (dual-page)' : ''}`
            }
          </div>
        </div>

        {/* Progress Bar - also fades with header */}
        <div className={`h-2 transition-all duration-300 ${
          showReaderHeader ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}>
          <div className="bg-black/90 h-full relative">
            <div
              className="h-full bg-orange-500 transition-all duration-300"
              style={{
                width: `${((currentPage + 1) / (currentChapter?.pageCount || 1)) * 100}%`
              }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Auth prompt
  if (showAuthPrompt) {
    return <AuthPrompt handleGoogleSignIn={handleGoogleSignIn} isLoading={isLoading} uploadStatus={uploadStatus} />;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your comic library...</p>
        </div>
      </div>
    );
  }

  // Main app views
  return (
    <div className="w-full">
      {currentView === 'library' && <LibraryView />}
      {currentView === 'series' && <SeriesView />}
      {currentView === 'reader' && <ReaderView />}
    </div>
  );
};

export default UniversalComicReader;