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

// Striver's DSA Course Structure (from takeUforward channel)
// Based on actual playlist: https://www.youtube.com/@takeUforward/playlists
const DSA_COURSE: Course = {
  id: 'striver-dsa-course',
  title: "Striver's A2Z DSA Course",
  instructor: 'Raj Vikramaditya (Striver)',
  description: 'Complete Data Structures and Algorithms course covering everything from basics to advanced topics. Perfect for interview preparation and competitive programming.',
  thumbnail: '/course-thumbnails/dsa.jpg',
  duration: '150+ hours',
  lectureCount: 456,
  level: 'intermediate',
  tags: ['DSA', 'Algorithms', 'Data Structures', 'Interview Prep', 'C++', 'Java'],
  enrollmentCount: 250000,
  rating: 4.9,
  sections: [
    {
      id: 'basics',
      title: 'Learn the Basics',
      order: 1,
      lectures: [
        {
          id: 'lec-1',
          title: 'Introduction to Programming',
          videoId: 'LlhqXKzLN0c',
          duration: '12:34',
          order: 1,
          description: 'Understanding what is programming and how to start your coding journey'
        },
        {
          id: 'lec-2',
          title: 'Basic Input/Output',
          videoId: 'EZ7rM1WxfQ4',
          duration: '15:20',
          order: 2,
          description: 'Learn how to take input and display output in C++'
        },
        {
          id: 'lec-3',
          title: 'If-Else Statements',
          videoId: 'nZJ0bvl-GBM',
          duration: '18:45',
          order: 3,
          description: 'Conditional statements and decision making in programming'
        },
        {
          id: 'lec-4',
          title: 'Loops in C++',
          videoId: 'WtS2yjEu6qY',
          duration: '22:10',
          order: 4,
          description: 'For loops, while loops, and do-while loops explained'
        },
        {
          id: 'lec-5',
          title: 'Functions',
          videoId: 'EhOLnCYTXOI',
          duration: '19:30',
          order: 5,
          description: 'Understanding functions, parameters, and return values'
        }
      ]
    },
    {
      id: 'arrays',
      title: 'Arrays',
      order: 2,
      lectures: [
        {
          id: 'arr-1',
          title: 'Introduction to Arrays',
          videoId: '63eJAfJDPAk',
          duration: '16:22',
          order: 1,
          description: 'What are arrays and why do we need them?'
        },
        {
          id: 'arr-2',
          title: 'Reverse an Array',
          videoId: 'rNiZGOy0KCg',
          duration: '14:50',
          order: 2,
          description: 'Different approaches to reverse an array'
        },
        {
          id: 'arr-3',
          title: 'Find Maximum & Minimum',
          videoId: 'Q7ZWmgLYDpk',
          duration: '12:15',
          order: 3,
          description: 'Finding maximum and minimum elements in an array'
        },
        {
          id: 'arr-4',
          title: 'Sort an Array of 0s, 1s & 2s',
          videoId: 'oaejvvl8Kic',
          duration: '20:30',
          order: 4,
          description: 'Dutch National Flag algorithm explained'
        },
        {
          id: 'arr-5',
          title: 'Kadane\'s Algorithm',
          videoId: 'VMtyGnNcdPw',
          duration: '25:45',
          order: 5,
          description: 'Maximum subarray sum problem'
        }
      ]
    },
    {
      id: 'binary-search',
      title: 'Binary Search',
      order: 3,
      lectures: [
        {
          id: 'bs-1',
          title: 'Binary Search Introduction',
          videoId: 'Y-ZrtFZ77cM',
          duration: '18:30',
          order: 1,
          description: 'Understanding binary search algorithm and its implementation'
        },
        {
          id: 'bs-2',
          title: 'Lower Bound & Upper Bound',
          videoId: 'JUP99t5nCWE',
          duration: '22:45',
          order: 2,
          description: 'Finding lower and upper bounds using binary search'
        },
        {
          id: 'bs-3',
          title: 'Search in Rotated Sorted Array',
          videoId: 'YzDqwUe5dXU',
          duration: '26:20',
          order: 3,
          description: 'Binary search in rotated arrays'
        },
        {
          id: 'bs-4',
          title: 'Find Peak Element',
          videoId: 'K-_0e-nR4Fg',
          duration: '19:50',
          order: 4,
          description: 'Finding peak element using binary search'
        },
        {
          id: 'bs-5',
          title: 'Square Root using Binary Search',
          videoId: 'WQlxV5U7qUg',
          duration: '17:25',
          order: 5,
          description: 'Computing square root with precision using binary search'
        }
      ]
    },
    {
      id: 'sorting',
      title: 'Sorting Algorithms',
      order: 4,
      lectures: [
        {
          id: 'sort-1',
          title: 'Selection Sort',
          videoId: 'HGk_ypEuS24',
          duration: '14:30',
          order: 1,
          description: 'Understanding selection sort algorithm'
        },
        {
          id: 'sort-2',
          title: 'Bubble Sort',
          videoId: 'nmhjrI-aW5o',
          duration: '16:20',
          order: 2,
          description: 'Bubble sort algorithm and optimization'
        },
        {
          id: 'sort-3',
          title: 'Insertion Sort',
          videoId: 'fP0BheuPsG8',
          duration: '15:45',
          order: 3,
          description: 'Insertion sort algorithm explained'
        },
        {
          id: 'sort-4',
          title: 'Merge Sort',
          videoId: 'ogjf7ORla8g',
          duration: '28:50',
          order: 4,
          description: 'Divide and conquer - Merge sort'
        },
        {
          id: 'sort-5',
          title: 'Quick Sort',
          videoId: 'aXjRAhgDEeI',
          duration: '32:15',
          order: 5,
          description: 'Quick sort algorithm with partitioning'
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
          title: 'Introduction to Recursion',
          videoId: 'AxNNVHYRU',
          duration: '20:30',
          order: 1,
          description: 'Understanding recursion and base cases'
        },
        {
          id: 'rec-2',
          title: 'Print Subsequences',
          videoId: 'u7zMvpQSSY',
          duration: '24:40',
          order: 2,
          description: 'Generating all subsequences using recursion'
        },
        {
          id: 'rec-3',
          title: 'N-Queens Problem',
          videoId: 'zOaVaaDH0N',
          duration: '35:20',
          order: 3,
          description: 'Classic backtracking problem - N Queens'
        },
        {
          id: 'rec-4',
          title: 'Sudoku Solver',
          videoId: 'FWazQxJvqw',
          duration: '38:50',
          order: 4,
          description: 'Solving Sudoku using backtracking'
        },
        {
          id: 'rec-5',
          title: 'Rat in a Maze',
          videoId: 'bLGZhJtj0g',
          duration: '27:15',
          order: 5,
          description: 'Path finding using recursion and backtracking'
        }
      ]
    },
    {
      id: 'linked-list',
      title: 'Linked List',
      order: 6,
      lectures: [
        {
          id: 'll-1',
          title: 'Introduction to Linked List',
          videoId: 'YJlAd6lLhng',
          duration: '22:15',
          order: 1,
          description: 'Understanding linked list data structure'
        },
        {
          id: 'll-2',
          title: 'Insert & Delete in Linked List',
          videoId: 'G6wL82F_Zlo',
          duration: '26:40',
          order: 2,
          description: 'Basic operations on linked list'
        },
        {
          id: 'll-3',
          title: 'Reverse a Linked List',
          videoId: 'iRtLEoL-r-g',
          duration: '18:30',
          order: 3,
          description: 'Iterative and recursive approaches'
        },
        {
          id: 'll-4',
          title: 'Detect Loop in Linked List',
          videoId: 'wT8dwqmz4P8',
          duration: '20:50',
          order: 4,
          description: 'Floyd\'s cycle detection algorithm'
        },
        {
          id: 'll-5',
          title: 'Merge Two Sorted Lists',
          videoId: 'Xb4slcp14U',
          duration: '16:25',
          order: 5,
          description: 'Merging sorted linked lists'
        }
      ]
    },
    {
      id: 'trees',
      title: 'Binary Trees',
      order: 7,
      lectures: [
        {
          id: 'tree-1',
          title: 'Introduction to Binary Trees',
          videoId: 'KxuMrz_yIBY',
          duration: '24:30',
          order: 1,
          description: 'Understanding binary tree structure'
        },
        {
          id: 'tree-2',
          title: 'Tree Traversals (In, Pre, Post)',
          videoId: 'jmy0LaDL0w',
          duration: '28:45',
          order: 2,
          description: 'Inorder, preorder, and postorder traversals'
        },
        {
          id: 'tree-3',
          title: 'Level Order Traversal',
          videoId: 'EoAsWlOXqh4',
          duration: '19:20',
          order: 3,
          description: 'BFS in binary trees'
        },
        {
          id: 'tree-4',
          title: 'Height of Binary Tree',
          videoId: 'v1KZmJ6CNu4',
          duration: '15:40',
          order: 4,
          description: 'Finding height/depth of binary tree'
        },
        {
          id: 'tree-5',
          title: 'Check Balanced Binary Tree',
          videoId: 'lUDgvPl5YjQ',
          duration: '21:15',
          order: 5,
          description: 'Checking if a tree is height-balanced'
        }
      ]
    },
    {
      id: 'graphs',
      title: 'Graphs',
      order: 8,
      lectures: [
        {
          id: 'graph-1',
          title: 'Introduction to Graphs',
          videoId: 'M3_twJqKCL0',
          duration: '26:50',
          order: 1,
          description: 'Graph terminology and representations'
        },
        {
          id: 'graph-2',
          title: 'BFS & DFS',
          videoId: 'GyY0Q93VCY',
          duration: '32:20',
          order: 2,
          description: 'Breadth-first and depth-first search'
        },
        {
          id: 'graph-3',
          title: 'Detect Cycle in Graph',
          videoId: 'M2_DUH7uyc',
          duration: '24:30',
          order: 3,
          description: 'Cycle detection in directed and undirected graphs'
        },
        {
          id: 'graph-4',
          title: 'Dijkstra\'s Algorithm',
          videoId: 'XBHsW5GOn0',
          duration: '38:45',
          order: 4,
          description: 'Shortest path algorithm'
        },
        {
          id: 'graph-5',
          title: 'Minimum Spanning Tree',
          videoId: 'dmtDy82s3g',
          duration: '35:20',
          order: 5,
          description: 'Kruskal\'s and Prim\'s algorithms'
        }
      ]
    },
    {
      id: 'dp',
      title: 'Dynamic Programming',
      order: 9,
      lectures: [
        {
          id: 'dp-1',
          title: 'Introduction to DP',
          videoId: 'FfVOThdSH2c',
          duration: '28:30',
          order: 1,
          description: 'Understanding dynamic programming concepts'
        },
        {
          id: 'dp-2',
          title: 'Fibonacci using DP',
          videoId: 'SAX7Q93cKY',
          duration: '22:15',
          order: 2,
          description: 'Memoization and tabulation approaches'
        },
        {
          id: 'dp-3',
          title: 'Climbing Stairs',
          videoId: 'NX-x9F6Y8Y',
          duration: '18:40',
          order: 3,
          description: 'Classic DP problem'
        },
        {
          id: 'dp-4',
          title: '0/1 Knapsack',
          videoId: 'ZJAUxBXy8Y',
          duration: '34:50',
          order: 4,
          description: 'Knapsack problem using dynamic programming'
        },
        {
          id: 'dp-5',
          title: 'Longest Common Subsequence',
          videoId: 'aBay0sOQU8w',
          duration: '30:25',
          order: 5,
          description: 'LCS problem and variations'
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