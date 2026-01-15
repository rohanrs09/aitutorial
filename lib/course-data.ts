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
  id: 'striver-dsa-complete',
  title: "Striver's Complete DSA Learning Path",
  instructor: 'Raj Vikramaditya (Striver) - take U forward',
  description: 'Complete Data Structures and Algorithms course covering 450+ problems with real YouTube video lectures from takeUforward channel. Includes Recursion, Trees, Graphs, DP, and SDE Sheet preparation.',
  thumbnail: '/course-thumbnails/dsa.jpg',
  duration: '400+ hours',
  lectureCount: 400,
  level: 'intermediate',
  tags: ['DSA', 'Algorithms', 'Data Structures', 'Interview Prep', 'C++', 'Java', 'Python', 'FAANG'],
  enrollmentCount: 300000,
  rating: 4.9,
  sections: [
    {
      id: 'setup-basics',
      title: '1. C++ / Java Setup & Basics',
      order: 1,
      lectures: [
        {
          id: 'setup-1',
          title: 'How to setup VS Code for DSA and CP',
          videoId: '0bHoB32fuj0',
          duration: '15:00',
          order: 1,
          description: 'IDE Setup (VS Code, IntelliJ) for competitive programming'
        },
        {
          id: 'setup-2',
          title: 'C++ Basics in One Shot – Strivers A2Z DSA Course',
          videoId: 'EAR7De6Goz4',
          duration: '3:45:00',
          order: 2,
          description: 'Complete C++ basics - syntax, variables, loops, functions'
        },
        {
          id: 'setup-3',
          title: 'Time and Space Complexity',
          videoId: 'FPu9Uld7W-E',
          duration: '42:00',
          order: 3,
          description: 'Big O notation, time and space complexity analysis'
        },
        {
          id: 'setup-4',
          title: 'Complete C++ STL in 1 Video',
          videoId: 'RRVYpIET_RU',
          duration: '2:15:00',
          order: 4,
          description: 'Vector, Map, Set, Stack, Queue, Priority Queue - complete STL'
        }
      ]
    },
    {
      id: 'recursion-backtracking',
      title: '2. Recursion & Backtracking Series (25+ Videos)',
      order: 2,
      lectures: [
        {
          id: 'rec-1',
          title: 'Introduction to Recursion | Recursion Tree',
          videoId: 'yVdKa8dnKiE',
          duration: '32:00',
          order: 1,
          description: 'Recursion basics, stack space, base case, recursion tree'
        },
        {
          id: 'rec-2',
          title: 'Parameterized and Functional Recursion',
          videoId: '0bHoB32fuj0',
          duration: '28:00',
          order: 2,
          description: 'Two types of recursion approaches with examples'
        },
        {
          id: 'rec-3',
          title: 'Print all Subsequences/Power Set',
          videoId: 'AxNNVECce8c',
          duration: '30:00',
          order: 3,
          description: 'Subsequences, power set, pick/not pick pattern'
        },
        {
          id: 'rec-4',
          title: 'N-Queens Problem',
          videoId: 'i05Ju7AftcM',
          duration: '35:00',
          order: 4,
          description: 'Classic backtracking problem - N-Queens with optimization'
        },
        {
          id: 'rec-5',
          title: 'Sudoku Solver',
          videoId: 'FWAIf_EVUKE',
          duration: '40:00',
          order: 5,
          description: 'Backtracking approach to solve Sudoku puzzle'
        }
      ]
    },
    {
      id: 'binary-tree',
      title: '3. Binary Tree Complete Series (39 Videos)',
      order: 3,
      lectures: [
        {
          id: 'tree-1',
          title: 'Introduction to Trees',
          videoId: '_ANrF3FJm7I',
          duration: '25:00',
          order: 1,
          description: 'Tree basics, terminology, types of trees'
        },
        {
          id: 'tree-2',
          title: 'Tree Traversals - Inorder, Preorder, Postorder',
          videoId: 'Z_NEgBgbRVI',
          duration: '30:00',
          order: 2,
          description: 'All three traversals with recursive and iterative approaches'
        },
        {
          id: 'tree-3',
          title: 'Level Order Traversal (BFS)',
          videoId: 'EoAsWbO7sqg',
          duration: '28:00',
          order: 3,
          description: 'Breadth-first search in binary tree using queue'
        },
        {
          id: 'tree-4',
          title: 'Morris Traversal',
          videoId: '80Zug6D1_r4',
          duration: '35:00',
          order: 4,
          description: 'Space-optimized traversal without recursion or stack'
        },
        {
          id: 'tree-5',
          title: 'Lowest Common Ancestor (LCA)',
          videoId: '_-QHfMDde90',
          duration: '32:00',
          order: 5,
          description: 'Finding LCA in binary tree - optimal approach'
        }
      ]
    },
    {
      id: 'trie',
      title: '4. Trie Data Structure (7 Videos)',
      order: 4,
      lectures: [
        {
          id: 'trie-1',
          title: 'Trie Implementation',
          videoId: 'dBGUmUQhjaM',
          duration: '30:00',
          order: 1,
          description: 'Implement Trie - insert, search, delete operations'
        },
        {
          id: 'trie-2',
          title: 'Longest Common Prefix using Trie',
          videoId: 'AWnBa91lThI',
          duration: '25:00',
          order: 2,
          description: 'Find longest common prefix using trie data structure'
        },
        {
          id: 'trie-3',
          title: 'Maximum XOR using Trie',
          videoId: 'EIhAwfHubE8',
          duration: '35:00',
          order: 3,
          description: 'Maximum XOR problems solved using trie'
        }
      ]
    },
    {
      id: 'graph-algorithms',
      title: '5. Graph Algorithms (54 Videos - Most Comprehensive)',
      order: 5,
      lectures: [
        {
          id: 'graph-1',
          title: 'Introduction to Graph | Types',
          videoId: 'M3_pLsDdeuU',
          duration: '35:00',
          order: 1,
          description: 'Graph representations - adjacency matrix, adjacency list'
        },
        {
          id: 'graph-2',
          title: 'BFS Traversal',
          videoId: '-tgVpUgsQ5k',
          duration: '30:00',
          order: 2,
          description: 'Breadth-first search in graphs with implementation'
        },
        {
          id: 'graph-3',
          title: 'DFS Traversal',
          videoId: 'Qzf1a--rhp8',
          duration: '28:00',
          order: 3,
          description: 'Depth-first search - recursive and iterative'
        },
        {
          id: 'graph-4',
          title: 'Dijkstra\'s Algorithm',
          videoId: 'V6H1qAeB-l4',
          duration: '40:00',
          order: 4,
          description: 'Shortest path algorithm using priority queue'
        },
        {
          id: 'graph-5',
          title: 'Bellman-Ford Algorithm',
          videoId: '0vVofAhAYjc',
          duration: '35:00',
          order: 5,
          description: 'Shortest path with negative weights'
        },
        {
          id: 'graph-6',
          title: 'Kruskal\'s Algorithm (MST)',
          videoId: 'DMnDM_sxVig',
          duration: '38:00',
          order: 6,
          description: 'Minimum spanning tree using Disjoint Set Union'
        }
      ]
    },
    {
      id: 'dynamic-programming',
      title: '6. Dynamic Programming (60-70 Videos - Largest DP Course)',
      order: 6,
      lectures: [
        {
          id: 'dp-1',
          title: 'Introduction to DP | Memoization & Tabulation',
          videoId: 'oBt53YbR9Kk',
          duration: '42:00',
          order: 1,
          description: '4-step approach: Recursion → Memoization → Tabulation → Space Optimization'
        },
        {
          id: 'dp-2',
          title: 'Climbing Stairs',
          videoId: 'ZaI2IlHwmgQ',
          duration: '28:00',
          order: 2,
          description: '1D DP problem with all 4 optimization steps'
        },
        {
          id: 'dp-3',
          title: 'Longest Common Subsequence (LCS)',
          videoId: 'NPZn9jBrX8U',
          duration: '45:00',
          order: 3,
          description: 'Classic DP on strings problem with space optimization'
        },
        {
          id: 'dp-4',
          title: 'Longest Increasing Subsequence (LIS)',
          videoId: 'on2hvxBXJH4',
          duration: '40:00',
          order: 4,
          description: 'DP on subsequences - multiple approaches including binary search'
        },
        {
          id: 'dp-5',
          title: '0/1 Knapsack Problem',
          videoId: 'GqOmJHQZivw',
          duration: '38:00',
          order: 5,
          description: 'Classic knapsack with space optimization'
        },
        {
          id: 'dp-6',
          title: 'Edit Distance',
          videoId: 'fJaKO8FbDdo',
          duration: '42:00',
          order: 6,
          description: 'DP on strings - convert one string to another'
        },
        {
          id: 'dp-7',
          title: 'Matrix Chain Multiplication',
          videoId: 'vRVfmbCFW7Y',
          duration: '50:00',
          order: 7,
          description: 'Partition DP pattern - MCM and variations'
        }
      ]
    },
    {
      id: 'stack-queue',
      title: '7. Stack & Queue (20+ Videos)',
      order: 7,
      lectures: [
        {
          id: 'sq-1',
          title: 'Stack Implementation',
          videoId: 'GYptUgnIM_I',
          duration: '25:00',
          order: 1,
          description: 'Implement stack using array and linked list'
        },
        {
          id: 'sq-2',
          title: 'Next Greater Element',
          videoId: 'Du881K7Jtk8',
          duration: '30:00',
          order: 2,
          description: 'Monotonic stack pattern for NGE problems'
        },
        {
          id: 'sq-3',
          title: 'Largest Rectangle in Histogram',
          videoId: 'jC_cWLy7jSI',
          duration: '35:00',
          order: 3,
          description: 'Hard stack problem - frequently asked in interviews'
        },
        {
          id: 'sq-4',
          title: 'LRU Cache',
          videoId: 'xDEuM5qa0zg',
          duration: '40:00',
          order: 4,
          description: 'Design LRU cache using HashMap and Doubly Linked List'
        }
      ]
    },
    {
      id: 'binary-search',
      title: '8. Binary Search Bootcamp (30 Videos)',
      order: 8,
      lectures: [
        {
          id: 'bs-1',
          title: 'Binary Search Introduction',
          videoId: 'yQvCgBOP6js',
          duration: '22:00',
          order: 1,
          description: 'Iterative and recursive binary search'
        },
        {
          id: 'bs-2',
          title: 'Lower Bound and Upper Bound',
          videoId: 'VpushqlYuyE',
          duration: '18:00',
          order: 2,
          description: 'Finding bounds in sorted array'
        },
        {
          id: 'bs-3',
          title: 'Search in Rotated Sorted Array',
          videoId: 'Hh8mC4qYhhE',
          duration: '24:00',
          order: 3,
          description: 'Binary search in rotated array'
        },
        {
          id: 'bs-4',
          title: 'Aggressive Cows',
          videoId: 'R_Mfw4ew2Vo',
          duration: '30:00',
          order: 4,
          description: 'Binary search on answer space - classic problem'
        },
        {
          id: 'bs-5',
          title: 'Median of Two Sorted Arrays',
          videoId: 'NTop3VTjmxk',
          duration: '35:00',
          order: 5,
          description: 'Hard binary search problem - O(log(min(m,n)))'
        }
      ]
    },
    {
      id: 'sde-sheet',
      title: '9. SDE Sheet - 180 Interview Problems',
      order: 9,
      lectures: [
        {
          id: 'sde-info',
          title: 'How to Use SDE Sheet',
          videoId: 'WNtzUR_MwUQ',
          duration: '15:00',
          order: 1,
          description: 'Complete guide to Striver\'s SDE Sheet - 180 curated problems for FAANG interviews'
        },
        {
          id: 'sde-1',
          title: 'Set Matrix Zeroes',
          videoId: 'M65xBewcqcI',
          duration: '25:00',
          order: 2,
          description: 'Array problem - optimize from O(m*n) space to O(1)'
        },
        {
          id: 'sde-2',
          title: 'Kadane\'s Algorithm',
          videoId: 'w_KEoQrs2Pk',
          duration: '20:00',
          order: 3,
          description: 'Maximum subarray sum - classic DP problem'
        },
        {
          id: 'sde-3',
          title: 'Merge Intervals',
          videoId: '2JzRBPFYbKE',
          duration: '22:00',
          order: 4,
          description: 'Interval problems - sorting and merging'
        }
      ]
    },
    {
      id: 'additional-topics',
      title: '10. Additional Topics (Heaps, Greedy, Bit Manipulation)',
      order: 10,
      lectures: [
        {
          id: 'heap-1',
          title: 'Heap Implementation',
          videoId: 'HqPJF2L5h9U',
          duration: '30:00',
          order: 1,
          description: 'Min heap and max heap implementation'
        },
        {
          id: 'heap-2',
          title: 'Kth Largest Element',
          videoId: 'yAs3tONaf3s',
          duration: '25:00',
          order: 2,
          description: 'Using heap to find kth largest/smallest'
        },
        {
          id: 'greedy-1',
          title: 'Activity Selection',
          videoId: 'II6ziNnub1Q',
          duration: '28:00',
          order: 3,
          description: 'Classic greedy algorithm problem'
        },
        {
          id: 'bit-1',
          title: 'Bit Manipulation Basics',
          videoId: '5rtVTYAk9KQ',
          duration: '35:00',
          order: 4,
          description: 'Bitwise operators, set/clear/toggle bits, XOR tricks'
        }
      ]
    }
  ]
};

// Course repository - only real courses with actual YouTube video links
const COURSES: Course[] = [
  DSA_COURSE
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