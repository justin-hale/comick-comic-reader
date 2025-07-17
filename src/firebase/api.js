// src/firebase/api.js
import { db, auth } from './config';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';

export class FirebaseAPI {
  constructor() {
    this.currentUser = null;
    this.currentUserInfo = null;
    this.authInitialized = false;
    this.provider = new GoogleAuthProvider();
    
    // Request additional scopes if needed
    this.provider.addScope('profile');
    this.provider.addScope('email');
  }

  // Initialize authentication and listen for auth state changes
  async initAuth() {
    return new Promise((resolve) => {
      if (this.authInitialized) {
        resolve({
          userId: this.currentUser,
          userInfo: this.currentUserInfo
        });
        return;
      }

      onAuthStateChanged(auth, (user) => {
        if (user) {
          this.currentUser = user.uid;
          this.currentUserInfo = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
          };
          this.authInitialized = true;
          console.log('✅ User authenticated:', {
            name: user.displayName,
            email: user.email,
            uid: user.uid
          });
          resolve({
            userId: this.currentUser,
            userInfo: this.currentUserInfo
          });
        } else {
          this.currentUser = null;
          this.currentUserInfo = null;
          this.authInitialized = true;
          console.log('👤 No user signed in');
          resolve({
            userId: null,
            userInfo: null
          });
        }
      });
    });
  }

  // Sign in with Google
  async signInWithGoogle() {
    try {
      console.log('🔐 Starting Google sign-in...');
      const result = await signInWithPopup(auth, this.provider);
      
      // This gives you a Google Access Token. You can use it to access the Google API.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      
      // The signed-in user info
      const user = result.user;
      
      this.currentUser = user.uid;
      this.currentUserInfo = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      };

      console.log('✅ Google sign-in successful:', {
        name: user.displayName,
        email: user.email,
        uid: user.uid
      });

      return {
        userId: this.currentUser,
        userInfo: this.currentUserInfo
      };
    } catch (error) {
      console.error('❌ Google sign-in error:', error);
      
      // Handle specific error codes
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Pop-up was blocked by browser');
      } else {
        throw new Error('Sign-in failed');
      }
    }
  }

  // Sign out
  async signOutUser() {
    try {
      await signOut(auth);
      this.currentUser = null;
      this.currentUserInfo = null;
      console.log('✅ User signed out');
      return true;
    } catch (error) {
      console.error('❌ Sign out error:', error);
      return false;
    }
  }

  // Check if user is signed in
  isSignedIn() {
    return !!this.currentUser;
  }

  // Get current user info
  getCurrentUser() {
    return this.currentUserInfo;
  }

  // Save series metadata
  async saveSeries(seriesData) {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }

      const seriesRef = doc(db, 'users', this.currentUser, 'series', seriesData.slug);
      await setDoc(seriesRef, {
        ...seriesData,
        updatedAt: serverTimestamp(),
        createdBy: this.currentUserInfo?.email || 'unknown'
      }, { merge: true });

      console.log('✅ Series saved:', seriesData.slug);
      return true;
    } catch (error) {
      console.error('❌ Error saving series:', error);
      throw error;
    }
  }

  // Load all series for current user
  async loadSeries() {
    try {
      if (!this.currentUser) {
        console.warn('⚠️ No user authenticated');
        return {};
      }

      const seriesCollection = collection(db, 'users', this.currentUser, 'series');
      const snapshot = await getDocs(seriesCollection);
      const series = {};
      
      snapshot.forEach(doc => {
        series[doc.id] = doc.data();
      });

      console.log('✅ Series loaded:', Object.keys(series).length, 'series');
      return series;
    } catch (error) {
      console.error('❌ Error loading series:', error);
      throw error;
    }
  }

  // Save chapter data for a specific series
  async saveChapter(seriesSlug, chapterData) {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }

      const chapterRef = doc(db, 'users', this.currentUser, 'series', seriesSlug, 'chapters', chapterData.id.toString());
      await setDoc(chapterRef, {
        ...chapterData,
        updatedAt: serverTimestamp(),
        uploadedBy: this.currentUserInfo?.email || 'unknown'
      });

      console.log('✅ Chapter saved:', seriesSlug, chapterData.id);
      return true;
    } catch (error) {
      console.error('❌ Error saving chapter:', error);
      throw error;
    }
  }

  // Load all chapters for a specific series
  async loadChapters(seriesSlug) {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }

      const chaptersCollection = collection(db, 'users', this.currentUser, 'series', seriesSlug, 'chapters');
      const q = query(chaptersCollection, orderBy('chapterNumber', 'asc'));
      const snapshot = await getDocs(q);
      const chapters = [];
      
      snapshot.forEach(doc => {
        chapters.push(doc.data());
      });

      console.log('✅ Chapters loaded for', seriesSlug, ':', chapters.length);
      return chapters;
    } catch (error) {
      console.error('❌ Error loading chapters:', error);
      throw error;
    }
  }

  // Save reading progress for a chapter
  async saveProgress(seriesSlug, chapterData) {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }

      const progressRef = doc(db, 'users', this.currentUser, 'progress', seriesSlug, 'chapters', chapterData.id.toString());
      await setDoc(progressRef, {
        isRead: chapterData.isRead || false,
        lastPage: chapterData.lastPage || 0,
        chapterNumber: chapterData.chapterNumber,
        title: chapterData.title,
        readAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      console.log('✅ Progress saved:', seriesSlug, chapterData.id);
      return true;
    } catch (error) {
      console.error('❌ Error saving progress:', error);
      throw error;
    }
  }

  // Load reading progress for a specific series
  async loadProgress(seriesSlug) {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }

      const progressCollection = collection(db, 'users', this.currentUser, 'progress', seriesSlug, 'chapters');
      const snapshot = await getDocs(progressCollection);
      const progress = {};
      
      snapshot.forEach(doc => {
        progress[doc.id] = doc.data();
      });

      console.log('✅ Progress loaded for', seriesSlug, ':', Object.keys(progress).length, 'chapters');
      return progress;
    } catch (error) {
      console.error('❌ Error loading progress:', error);
      throw error;
    }
  }

  // Get reading statistics across all series
  async getReadingStats() {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }

      const seriesCollection = collection(db, 'users', this.currentUser, 'series');
      const seriesSnapshot = await getDocs(seriesCollection);
      
      let totalChapters = 0;
      let readChapters = 0;
      
      for (const seriesDoc of seriesSnapshot.docs) {
        const seriesSlug = seriesDoc.id;
        
        // Count total chapters for this series
        const chaptersCollection = collection(db, 'users', this.currentUser, 'series', seriesSlug, 'chapters');
        const chaptersSnapshot = await getDocs(chaptersCollection);
        totalChapters += chaptersSnapshot.size;
        
        // Count read chapters for this series
        const progressCollection = collection(db, 'users', this.currentUser, 'progress', seriesSlug, 'chapters');
        const progressSnapshot = await getDocs(progressCollection);
        
        progressSnapshot.forEach(doc => {
          if (doc.data().isRead) {
            readChapters++;
          }
        });
      }

      const stats = {
        totalSeries: seriesSnapshot.size,
        totalChapters,
        readChapters,
        readingProgress: totalChapters > 0 ? Math.round((readChapters / totalChapters) * 100) : 0
      };

      console.log('📊 Reading stats:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error getting reading stats:', error);
      throw error;
    }
  }

  // Delete a series and all its data
  async deleteSeries(seriesSlug) {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }

      // Delete all chapters
      const chaptersCollection = collection(db, 'users', this.currentUser, 'series', seriesSlug, 'chapters');
      const chaptersSnapshot = await getDocs(chaptersCollection);
      
      const deletePromises = [];
      chaptersSnapshot.forEach(doc => {
        deletePromises.push(deleteDoc(doc.ref));
      });
      
      // Delete all progress
      const progressCollection = collection(db, 'users', this.currentUser, 'progress', seriesSlug, 'chapters');
      const progressSnapshot = await getDocs(progressCollection);
      
      progressSnapshot.forEach(doc => {
        deletePromises.push(deleteDoc(doc.ref));
      });
      
      // Delete series metadata
      const seriesRef = doc(db, 'users', this.currentUser, 'series', seriesSlug);
      deletePromises.push(deleteDoc(seriesRef));
      
      await Promise.all(deletePromises);
      
      console.log('✅ Series deleted:', seriesSlug);
      return true;
    } catch (error) {
      console.error('❌ Error deleting series:', error);
      throw error;
    }
  }

  // Update series metadata
  async updateSeries(seriesSlug, updates) {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }

      const seriesRef = doc(db, 'users', this.currentUser, 'series', seriesSlug);
      await updateDoc(seriesRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Series updated:', seriesSlug);
      return true;
    } catch (error) {
      console.error('❌ Error updating series:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const firebaseAPI = new FirebaseAPI();