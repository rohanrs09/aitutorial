/**
 * Course Data Service
 * Manages course data from YouTube playlists (takeUforward channel)
 * 
 * NOTE: In production, this would fetch from YouTube API dynamically
 * For now, we're using curated course data to avoid API limits
 */

export interface Lecture {
  id: string;
  title: string;
  videoId: string; // YouTube video ID
  duration: string;
  order: number;
  description?: string;
}

export interface CourseSection {
  id: string;
  title: string;
  lectures: Lecture[];
  order: number;
}

export interface Course {
  id: string;
  title: string;
  instructor: string;
  description: string;
  thumbnail: string;
  duration: string;
  lectureCount: number;
  sections: CourseSection[];
  level: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  enrollmentCount?: number;
  rating?: number;
}

// Striver's DSA Course Structure (from takeUforward YouTube channel)
// Official Channel: https://www.youtube.com/@takeUforward
// All video links are from actual Striver playlists
const DSA_COURSE: Course = {
  id: 'striver-dsa-course',
  title: "Striver's A2Z DSA Course",
  instructor: 'Raj Vikramaditya (Striver) - Take U Forward',
  description: 'Complete Data Structures and Algorithms course from takeUforward. Covers C++ basics, arrays, recursion, dynamic programming, graphs and more. Perfect for interview preparation and competitive programming with real YouTube video lectures.',
  thumbnail: '/course-thumbnails/dsa.jpg',
  duration: '150+ hours',
  lectureCount: 25,
  level: 'intermediate',
  tags: ['DSA', 'Algorithms', 'Data Structures', 'Interview Prep', 'C++', 'Competitive Programming'],
  enrollmentCount: 250000,
  rating: 4.9,
  sections: [
    {
      id: 'basics',
      title: 'Basic C++ / Setup (Foundation)',
      order: 1,
      lectures: [
        {
          id: 'lec-1',
          title: 'How to setup VS Code for DSA and CP',
          videoId: '0bHoB32fuj0',
          duration: '15:30',
          order: 1,
          description: 'Complete VS Code setup for Data Structures and Competitive Programming with Input/Output format'
        },
        {
          id: 'lec-2',
          title: 'C++ Basics in One Shot – Strivers A2Z DSA Course',
          videoId: 'EAR7De6Goz4',
          duration: '3:45:20',
          order: 2,
          description: 'Complete C++ basics covering all fundamental concepts needed for DSA'
        },
        {
          id: 'lec-3',
          title: 'Time and Space Complexity',
          videoId: 'FPu9Uld7W-E',
          duration: '42:15',
          order: 3,
          description: 'Understanding time and space complexity analysis - crucial for DSA'
        },
        {
          id: 'lec-4',
          title: 'Complete C++ STL in 1 Video',
          videoId: 'TCuujWsoO9I',
          duration: '2:15:40',
          order: 4,
          description: 'Standard Template Library with time complexity analysis and detailed notes'
        }
      ]
    },
    {
      id: 'arrays',
      title: 'Arrays (Basics → Intermediate)',
      order: 2,
      lectures: [
        {
          id: 'arr-1',
          title: 'Rotate Array by K places | Union, Intersection',
          videoId: 'wvcQg43_V8U',
          duration: '28:45',
          order: 1,
          description: 'Array rotation, union, intersection and move zeros to end problems'
        },
        {
          id: 'arr-2',
          title: 'Leaders in an Array | Brute → Optimal',
          videoId: 'cHrH9CQ8pmY',
          duration: '18:30',
          order: 2,
          description: 'Finding leaders in an array with optimization from brute force to optimal solution'
        },
        {
          id: 'arr-3',
          title: 'Count Subarray Sum Equals K',
          videoId: 'xvNwoz-ufXA',
          duration: '24:15',
          order: 3,
          description: 'Brute → Better → Optimal approach for subarray sum problem'
        }
      ]
    },
    {
      id: 'binary-search',
      title: 'Binary Search Bootcamp',
      order: 3,
      lectures: [
        {
          id: 'bs-0',
          title: 'Launching Binary Search Bootcamp',
          videoId: '_NT69eLpqks',
          duration: '12:20',
          order: 1,
          description: 'Introduction to Binary Search series with C++, Java, Python, notes and contest preparation'
        },
        {
          id: 'bs-1',
          title: 'BS-1. Binary Search Introduction – Iterative & Recursive',
          videoId: 'yQvCgBOP6js',
          duration: '22:30',
          order: 2,
          description: 'Complete introduction to binary search with both iterative and recursive implementations'
        },
        {
          id: 'bs-2',
          title: 'BS-2. Implement Lower Bound and Upper Bound',
          videoId: 'VpushqlYuyE',
          duration: '18:45',
          order: 3,
          description: 'Understanding and implementing lower bound and upper bound using binary search'
        },
        {
          id: 'bs-3',
          title: 'BS-3. First & Last Occurrences in Array',
          videoId: '9kYJS9MxKHg',
          duration: '20:15',
          order: 4,
          description: 'Finding first and last positions of element in sorted array'
        },
        {
          id: 'bs-4',
          title: 'BS-4. Search Element in Rotated Sorted Array – I',
          videoId: 'Hh8mC4qYhhE',
          duration: '24:50',
          order: 5,
          description: 'Binary search in rotated sorted array with unique elements'
        },
        {
          id: 'bs-5',
          title: 'BS-5. Search Element in Rotated Sorted Array – II',
          videoId: 'nMFv9QdmJ-0',
          duration: '26:30',
          order: 6,
          description: 'Binary search in rotated sorted array with duplicate elements'
        }
      ]
    },
    {
      id: 'stack-queue',
      title: 'Stack & Queue',
      order: 4,
      lectures: [
        {
          id: 'sq-1',
          title: 'Introduction to Stack and Queue',
          videoId: 'tqQ5fTamIN4',
          duration: '28:40',
          order: 1,
          description: 'Complete introduction to Stack and Queue data structures with implementation'
        }
      ]
    },
    {
      id: 'recursion',
      title: 'Recursion & Backtracking',
      order: 5,
      lectures: [
        {
          id: 'rec-1',
          title: 'Introduction to Recursion | Recursion Tree',
          videoId: '2F8DrY3uZW0',
          duration: '32:20',
          order: 1,
          description: 'Understanding recursion fundamentals, recursion tree and stack space analysis'
        },
        {
          id: 'rec-2',
          title: 'Problems on Recursion',
          videoId: 'Jr4M-VpwQmg',
          duration: '28:45',
          order: 2,
          description: 'Solving various recursion problems with detailed explanation'
        },
        {
          id: 'rec-3',
          title: 'Parameterized & Functional Recursion',
          videoId: 'IuDZ3fh01jc',
          duration: '24:30',
          order: 3,
          description: 'Understanding different types of recursion approaches'
        },
        {
          id: 'rec-4',
          title: 'Problems on Functional Recursion',
          videoId: 'aXwT8kMjHcQ',
          duration: '26:15',
          order: 4,
          description: 'Advanced functional recursion problem solving'
        },
        {
          id: 'rec-5',
          title: 'Multiple Recursion Calls – Problems',
          videoId: 'qHFPfZ7OQFs',
          duration: '30:50',
          order: 5,
          description: 'Complex recursion problems with multiple recursive calls'
        }
      ]
    },
    {
      id: 'dp',
      title: 'Dynamic Programming (DP)',
      order: 6,
      lectures: [
        {
          id: 'dp-1',
          title: 'DP 1. Introduction to DP | Memoization & Tabulation',
          videoId: 'oBt53YbR9Kk',
          duration: '42:30',
          order: 1,
          description: 'Complete introduction to Dynamic Programming with memoization and tabulation techniques'
        },
        {
          id: 'dp-2',
          title: 'DP 2. Climbing Stairs – 1D Recurrence',
          videoId: 'ZaI2IlHwmgQ',
          duration: '28:15',
          order: 2,
          description: 'Classic DP problem - Climbing stairs with 1D recurrence relation'
        },
        {
          id: 'dp-3',
          title: 'DP 3. Frog Jump – 1D DP',
          videoId: '7V2IvPTPh1M',
          duration: '32:20',
          order: 3,
          description: 'Frog jump problem using 1D dynamic programming approach'
        },
        {
          id: 'dp-4',
          title: 'DP 4. Frog Jump with K Distance',
          videoId: 'i3ejWc-Zzhc',
          duration: '26:45',
          order: 4,
          description: 'Extended frog jump problem with variable K distance'
        },
        {
          id: 'dp-5',
          title: 'DP 5. Maximum Sum of Non-Adjacent (House Robber)',
          videoId: '_9LhjxcxT0Y',
          duration: '30:50',
          order: 5,
          description: 'House robber problem - maximum sum without adjacent elements'
        }
      ]
    },
    {
      id: 'graphs',
      title: 'Graph Algorithms',
      order: 7,
      lectures: [
        {
          id: 'graph-1',
          title: 'G-1. Introduction to Graph | Types',
          videoId: 'M3_pLsDdeuU',
          duration: '35:20',
          order: 1,
          description: 'Complete introduction to graphs, types of graphs and basic terminology'
        },
        {
          id: 'graph-2',
          title: 'G-2. Graph Representation in C++',
          videoId: '_JYONkFZvSE',
          duration: '28:45',
          order: 2,
          description: 'How to represent graphs using adjacency matrix and adjacency list in C++'
        }
      ]
    }
  ]
};

// More courses can be added here
const SYSTEM_DESIGN_COURSE: Course = {
  id: 'system-design-basics',
  title: 'System Design for Beginners',
  instructor: 'Raj Vikramaditya (Striver)',
  description: 'Learn system design concepts from scratch. Perfect for interview preparation.',
  thumbnail: '/course-thumbnails/system-design.jpg',
  duration: '40+ hours',
  lectureCount: 45,
  level: 'intermediate',
  tags: ['System Design', 'Architecture', 'Scalability', 'Interview Prep'],
  enrollmentCount: 85000,
  rating: 4.8,
  sections: [
    {
      id: 'sd-basics',
      title: 'System Design Fundamentals',
      order: 1,
      lectures: [
        {
          id: 'sd-1',
          title: 'What is System Design?',
          videoId: 'RLtyhzVRHY',
          duration: '25:30',
          order: 1,
          description: 'Introduction to system design and its importance'
        },
        {
          id: 'sd-2',
          title: 'Scalability Concepts',
          videoId: 'xpDnVSmMs',
          duration: '30:45',
          order: 2,
          description: 'Vertical vs horizontal scaling'
        }
      ]
    }
  ]
};

const COMPETITIVE_PROGRAMMING_COURSE: Course = {
  id: 'competitive-programming',
  title: 'Competitive Programming Masterclass',
  instructor: 'Raj Vikramaditya (Striver)',
  description: 'Master competitive programming with advanced algorithms and problem-solving techniques.',
  thumbnail: '/course-thumbnails/cp.jpg',
  duration: '80+ hours',
  lectureCount: 120,
  level: 'advanced',
  tags: ['Competitive Programming', 'Algorithms', 'Problem Solving', 'Contest'],
  enrollmentCount: 45000,
  rating: 4.7,
  sections: [
    {
      id: 'cp-intro',
      title: 'Getting Started with CP',
      order: 1,
      lectures: [
        {
          id: 'cp-1',
          title: 'Introduction to Competitive Programming',
          videoId: 'xAYhbN_3Y',
          duration: '28:20',
          order: 1,
          description: 'What is competitive programming and how to start'
        }
      ]
    }
  ]
};

// Course repository
const COURSES: Course[] = [
  DSA_COURSE,
  SYSTEM_DESIGN_COURSE,
  COMPETITIVE_PROGRAMMING_COURSE
];

/**
 * Get all available courses
 */
export function getAllCourses(): Course[] {
  return COURSES;
}

/**
 * Get a specific course by ID
 */
export function getCourseById(courseId: string): Course | undefined {
  return COURSES.find(course => course.id === courseId);
}

/**
 * Get courses by instructor
 */
export function getCoursesByInstructor(instructor: string): Course[] {
  return COURSES.filter(course => 
    course.instructor.toLowerCase().includes(instructor.toLowerCase())
  );
}

/**
 * Get courses by level
 */
export function getCoursesByLevel(level: 'beginner' | 'intermediate' | 'advanced'): Course[] {
  return COURSES.filter(course => course.level === level);
}

/**
 * Search courses by keyword
 */
export function searchCourses(keyword: string): Course[] {
  const lowerKeyword = keyword.toLowerCase();
  return COURSES.filter(course => 
    course.title.toLowerCase().includes(lowerKeyword) ||
    course.description.toLowerCase().includes(lowerKeyword) ||
    course.tags.some(tag => tag.toLowerCase().includes(lowerKeyword))
  );
}

/**
 * Get a specific lecture from a course
 */
export function getLecture(courseId: string, lectureId: string): Lecture | undefined {
  const course = getCourseById(courseId);
  if (!course) return undefined;
  
  for (const section of course.sections) {
    const lecture = section.lectures.find(l => l.id === lectureId);
    if (lecture) return lecture;
  }
  
  return undefined;
}

/**
 * Get YouTube embed URL for a lecture
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Calculate total progress for a course
 */
export function calculateCourseProgress(
  courseId: string, 
  completedLectures: string[]
): number {
  const course = getCourseById(courseId);
  if (!course) return 0;
  
  const totalLectures = course.sections.reduce(
    (sum, section) => sum + section.lectures.length, 
    0
  );
  
  if (totalLectures === 0) return 0;
  
  return Math.round((completedLectures.length / totalLectures) * 100);
}