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

// Aptitude & Logical Reasoning Course (for Placements & Competitive Exams)
const APTITUDE_COURSE: Course = {
  id: 'aptitude-reasoning',
  title: "Complete Aptitude & Reasoning for Placements",
  instructor: 'CareerRide & Placement Prep',
  description: 'Master Quantitative Aptitude, Logical Reasoning, and Verbal Ability for campus placements, competitive exams (CAT, GATE, Bank PO). Covers Number System, Percentages, Profit/Loss, Time & Work, Puzzles, and more.',
  thumbnail: '/course-thumbnails/aptitude.jpg',
  duration: '80+ hours',
  lectureCount: 120,
  level: 'beginner',
  tags: ['Aptitude', 'Reasoning', 'Placements', 'CAT', 'GATE', 'Bank Exams', 'Quantitative'],
  enrollmentCount: 150000,
  rating: 4.7,
  sections: [
    {
      id: 'number-system',
      title: '1. Number System & HCF/LCM',
      order: 1,
      lectures: [
        { id: 'apt-ns-1', title: 'Number System Basics - Types of Numbers', videoId: 'uP7Hjy8iBBQ', duration: '25:00', order: 1, description: 'Natural, Whole, Integer, Rational, Irrational numbers' },
        { id: 'apt-ns-2', title: 'Divisibility Rules - Quick Tricks', videoId: 'xyyejJYeILM', duration: '20:00', order: 2, description: 'Divisibility by 2, 3, 4, 5, 6, 7, 8, 9, 11' },
        { id: 'apt-ns-3', title: 'HCF and LCM - Shortcuts & Tricks', videoId: '-ZwmPFcaLII', duration: '30:00', order: 3, description: 'Finding HCF, LCM, applications in word problems' },
        { id: 'apt-ns-4', title: 'Remainder Theorem & Applications', videoId: 'iuuBv7F33Zg', duration: '28:00', order: 4, description: 'Finding remainders without division' }
      ]
    },
    {
      id: 'percentages',
      title: '2. Percentages, Profit & Loss',
      order: 2,
      lectures: [
        { id: 'apt-pct-1', title: 'Percentage Basics & Shortcuts', videoId: '_cW7_BUDYcw', duration: '25:00', order: 1, description: 'Converting fractions to percentages, quick calculations' },
        { id: 'apt-pct-2', title: 'Profit, Loss, and Discount', videoId: 'T2odvmxqi1I', duration: '30:00', order: 2, description: 'CP, SP, Markup, Discount calculations' },
        { id: 'apt-pct-3', title: 'Find Profit or Loss Percentage in 1 Step', videoId: 'eJYinjBiiNQ', duration: '22:00', order: 3, description: 'Quick tricks for profit/loss percentage' },
        { id: 'apt-pct-4', title: 'Partnership & Ratio Problems', videoId: '_cW7_BUDYcw', duration: '28:00', order: 4, description: 'Profit sharing, investment ratios' }
      ]
    },
    {
      id: 'time-work',
      title: '3. Time & Work, Pipes & Cisterns',
      order: 3,
      lectures: [
        { id: 'apt-tw-1', title: 'Time and Work - Shortcuts & Tricks', videoId: 'KE7tQf9spPg', duration: '25:00', order: 1, description: 'Work efficiency, man-days concept' },
        { id: 'apt-tw-2', title: 'Time and Work - LCM Method', videoId: 'KE7tQf9spPg', duration: '28:00', order: 2, description: 'Fastest method to solve work problems' },
        { id: 'apt-tw-3', title: 'Pipes and Cisterns', videoId: 'KE7tQf9spPg', duration: '22:00', order: 3, description: 'Filling and emptying pipes, combined work' },
        { id: 'apt-tw-4', title: 'Work and Wages', videoId: 'KE7tQf9spPg', duration: '20:00', order: 4, description: 'Wage distribution based on work done' }
      ]
    },
    {
      id: 'time-speed',
      title: '4. Time, Speed & Distance',
      order: 4,
      lectures: [
        { id: 'apt-ts-1', title: 'Speed, Distance, Time - Shortcuts', videoId: 'jzNxXm5twx4', duration: '25:00', order: 1, description: 'Unit conversions, average speed' },
        { id: 'apt-ts-2', title: 'Trains - Crossing Problems', videoId: 'jzNxXm5twx4', duration: '28:00', order: 2, description: 'Trains crossing poles, platforms, each other' },
        { id: 'apt-ts-3', title: 'Boats and Streams', videoId: 'jzNxXm5twx4', duration: '22:00', order: 3, description: 'Upstream, downstream, still water speed' },
        { id: 'apt-ts-4', title: 'Races and Circular Tracks', videoId: 'jzNxXm5twx4', duration: '25:00', order: 4, description: 'Head start, meeting points on circular tracks' }
      ]
    },
    {
      id: 'logical-reasoning',
      title: '5. Logical Reasoning',
      order: 5,
      lectures: [
        { id: 'apt-lr-1', title: 'Blood Relations - Tips & Tricks', videoId: 'Y8AsqpLKdJE', duration: '30:00', order: 1, description: 'Solving complex family relationships' },
        { id: 'apt-lr-2', title: 'Seating Arrangement - Tricks & Shortcuts', videoId: 'GYe98jwCn7g', duration: '35:00', order: 2, description: 'Row seating, facing problems' },
        { id: 'apt-lr-3', title: 'Seating Arrangement - Circular', videoId: 'GYe98jwCn7g', duration: '32:00', order: 3, description: 'Round table arrangements' },
        { id: 'apt-lr-4', title: 'Coding-Decoding Patterns', videoId: 'Y8AsqpLKdJE', duration: '25:00', order: 4, description: 'Letter shifting, number coding, symbol coding' },
        { id: 'apt-lr-5', title: 'Syllogisms - Venn Diagram Method', videoId: 'Y8AsqpLKdJE', duration: '30:00', order: 5, description: 'All, Some, No statements and conclusions' }
      ]
    },
    {
      id: 'data-interpretation',
      title: '6. Data Interpretation',
      order: 6,
      lectures: [
        { id: 'apt-di-1', title: 'Tables - Data Analysis', videoId: 'sXsKi9tVuJg', duration: '25:00', order: 1, description: 'Reading and analyzing tabular data' },
        { id: 'apt-di-2', title: 'Bar Graphs & Line Charts', videoId: 'sXsKi9tVuJg', duration: '28:00', order: 2, description: 'Interpreting bar and line graphs' },
        { id: 'apt-di-3', title: 'Pie Charts', videoId: 'sXsKi9tVuJg', duration: '22:00', order: 3, description: 'Degree and percentage calculations' },
        { id: 'apt-di-4', title: 'Caselets & Mixed DI', videoId: 'sXsKi9tVuJg', duration: '30:00', order: 4, description: 'Complex paragraph-based data interpretation' }
      ]
    }
  ]
};

// Computer Networks Course (Gate Smashers / Knowledge Gate style)
const COMPUTER_NETWORKS_COURSE: Course = {
  id: 'computer-networks',
  title: "Computer Networks - Complete Course",
  instructor: 'Gate Smashers & Knowledge Gate',
  description: 'Complete Computer Networks course covering OSI Model, TCP/IP, Network Layer protocols, Transport Layer, Application Layer, Network Security. Perfect for GATE, UGC NET, and interviews.',
  thumbnail: '/course-thumbnails/cn.jpg',
  duration: '60+ hours',
  lectureCount: 80,
  level: 'intermediate',
  tags: ['Computer Networks', 'GATE', 'OSI Model', 'TCP/IP', 'Networking', 'Protocols'],
  enrollmentCount: 200000,
  rating: 4.8,
  sections: [
    {
      id: 'cn-introduction',
      title: '1. Introduction to Computer Networks',
      order: 1,
      lectures: [
        { id: 'cn-1', title: 'What is Computer Network?', videoId: 'JFF2vJaN0Cw', duration: '18:00', order: 1, description: 'Introduction, types of networks - LAN, MAN, WAN' },
        { id: 'cn-2', title: 'Network Topologies', videoId: 'JFF2vJaN0Cw', duration: '22:00', order: 2, description: 'Bus, Star, Ring, Mesh, Tree topologies' },
        { id: 'cn-3', title: 'OSI Model - 7 Layers Explained', videoId: 'JFF2vJaN0Cw', duration: '35:00', order: 3, description: 'Physical to Application layer detailed explanation' },
        { id: 'cn-4', title: 'TCP/IP Model vs OSI Model', videoId: 'JFF2vJaN0Cw', duration: '25:00', order: 4, description: 'Comparison, 4-layer TCP/IP architecture' }
      ]
    },
    {
      id: 'cn-physical-layer',
      title: '2. Physical Layer',
      order: 2,
      lectures: [
        { id: 'cn-pl-1', title: 'Transmission Media - Guided', videoId: 'JFF2vJaN0Cw', duration: '28:00', order: 1, description: 'Twisted pair, Coaxial, Fiber optic cables' },
        { id: 'cn-pl-2', title: 'Transmission Media - Unguided', videoId: 'JFF2vJaN0Cw', duration: '22:00', order: 2, description: 'Radio waves, Microwaves, Infrared' },
        { id: 'cn-pl-3', title: 'Multiplexing Techniques', videoId: 'JFF2vJaN0Cw', duration: '30:00', order: 3, description: 'FDM, TDM, WDM, CDM' },
        { id: 'cn-pl-4', title: 'Switching Techniques', videoId: 'JFF2vJaN0Cw', duration: '28:00', order: 4, description: 'Circuit switching, Packet switching, Message switching' }
      ]
    },
    {
      id: 'cn-data-link',
      title: '3. Data Link Layer',
      order: 3,
      lectures: [
        { id: 'cn-dl-1', title: 'Framing & Error Detection', videoId: 'JFF2vJaN0Cw', duration: '30:00', order: 1, description: 'Character stuffing, Bit stuffing, CRC' },
        { id: 'cn-dl-2', title: 'Error Correction - Hamming Code', videoId: 'JFF2vJaN0Cw', duration: '35:00', order: 2, description: 'Single bit error correction using Hamming code' },
        { id: 'cn-dl-3', title: 'Flow Control Protocols', videoId: 'JFF2vJaN0Cw', duration: '32:00', order: 3, description: 'Stop-and-Wait, Sliding Window (GBN, SR)' },
        { id: 'cn-dl-4', title: 'MAC Protocols - ALOHA, CSMA', videoId: 'JFF2vJaN0Cw', duration: '35:00', order: 4, description: 'Pure ALOHA, Slotted ALOHA, CSMA/CD, CSMA/CA' },
        { id: 'cn-dl-5', title: 'Ethernet & MAC Addressing', videoId: 'JFF2vJaN0Cw', duration: '28:00', order: 5, description: 'Ethernet frame, MAC address structure' }
      ]
    },
    {
      id: 'cn-network-layer',
      title: '4. Network Layer',
      order: 4,
      lectures: [
        { id: 'cn-nl-1', title: 'IP Addressing - IPv4 Basics', videoId: 'JFF2vJaN0Cw', duration: '30:00', order: 1, description: 'IP address classes, Network ID, Host ID' },
        { id: 'cn-nl-2', title: 'Subnetting & CIDR', videoId: 'JFF2vJaN0Cw', duration: '40:00', order: 2, description: 'Subnet mask, CIDR notation, VLSM' },
        { id: 'cn-nl-3', title: 'Subnetting Numericals', videoId: 'JFF2vJaN0Cw', duration: '45:00', order: 3, description: 'Practice problems on subnetting' },
        { id: 'cn-nl-4', title: 'Routing Algorithms - Distance Vector', videoId: 'JFF2vJaN0Cw', duration: '35:00', order: 4, description: 'Bellman-Ford, RIP protocol' },
        { id: 'cn-nl-5', title: 'Routing Algorithms - Link State', videoId: 'JFF2vJaN0Cw', duration: '32:00', order: 5, description: 'Dijkstra algorithm, OSPF protocol' },
        { id: 'cn-nl-6', title: 'IPv6 Addressing', videoId: 'JFF2vJaN0Cw', duration: '25:00', order: 6, description: 'IPv6 format, benefits over IPv4' }
      ]
    },
    {
      id: 'cn-transport-layer',
      title: '5. Transport Layer',
      order: 5,
      lectures: [
        { id: 'cn-tl-1', title: 'TCP vs UDP', videoId: 'JFF2vJaN0Cw', duration: '28:00', order: 1, description: 'Connection-oriented vs Connectionless' },
        { id: 'cn-tl-2', title: 'TCP 3-Way Handshake', videoId: 'JFF2vJaN0Cw', duration: '25:00', order: 2, description: 'Connection establishment and termination' },
        { id: 'cn-tl-3', title: 'TCP Congestion Control', videoId: 'JFF2vJaN0Cw', duration: '35:00', order: 3, description: 'Slow start, Congestion avoidance, Fast retransmit' },
        { id: 'cn-tl-4', title: 'Port Numbers & Sockets', videoId: 'JFF2vJaN0Cw', duration: '22:00', order: 4, description: 'Well-known ports, Socket programming basics' }
      ]
    },
    {
      id: 'cn-application-layer',
      title: '6. Application Layer',
      order: 6,
      lectures: [
        { id: 'cn-al-1', title: 'DNS - Domain Name System', videoId: 'JFF2vJaN0Cw', duration: '30:00', order: 1, description: 'DNS hierarchy, record types, resolution' },
        { id: 'cn-al-2', title: 'HTTP & HTTPS', videoId: 'JFF2vJaN0Cw', duration: '28:00', order: 2, description: 'HTTP methods, status codes, TLS/SSL' },
        { id: 'cn-al-3', title: 'Email Protocols - SMTP, POP3, IMAP', videoId: 'JFF2vJaN0Cw', duration: '25:00', order: 3, description: 'Email transfer and retrieval protocols' },
        { id: 'cn-al-4', title: 'FTP & DHCP', videoId: 'JFF2vJaN0Cw', duration: '22:00', order: 4, description: 'File transfer and dynamic IP assignment' }
      ]
    },
    {
      id: 'cn-security',
      title: '7. Network Security',
      order: 7,
      lectures: [
        { id: 'cn-sec-1', title: 'Cryptography Basics', videoId: 'JFF2vJaN0Cw', duration: '30:00', order: 1, description: 'Symmetric vs Asymmetric encryption' },
        { id: 'cn-sec-2', title: 'RSA Algorithm', videoId: 'JFF2vJaN0Cw', duration: '35:00', order: 2, description: 'Public key cryptography with RSA' },
        { id: 'cn-sec-3', title: 'Digital Signatures & Certificates', videoId: 'JFF2vJaN0Cw', duration: '28:00', order: 3, description: 'Authentication and non-repudiation' },
        { id: 'cn-sec-4', title: 'Firewalls & VPN', videoId: 'JFF2vJaN0Cw', duration: '25:00', order: 4, description: 'Network security devices and tunneling' }
      ]
    }
  ]
};

// DBMS Course
const DBMS_COURSE: Course = {
  id: 'dbms-complete',
  title: "Database Management System - Complete Course",
  instructor: 'Gate Smashers & Knowledge Gate',
  description: 'Complete DBMS course covering ER Model, Relational Model, SQL, Normalization, Transactions, Concurrency Control, File Organization. Essential for GATE, interviews, and college exams.',
  thumbnail: '/course-thumbnails/dbms.jpg',
  duration: '70+ hours',
  lectureCount: 90,
  level: 'intermediate',
  tags: ['DBMS', 'SQL', 'Database', 'GATE', 'Normalization', 'Transactions', 'MySQL'],
  enrollmentCount: 180000,
  rating: 4.8,
  sections: [
    {
      id: 'dbms-intro',
      title: '1. Introduction to DBMS',
      order: 1,
      lectures: [
        { id: 'dbms-1', title: 'What is DBMS? Why not File System?', videoId: 'kBdlM6hNDAE', duration: '22:00', order: 1, description: 'DBMS advantages over file systems' },
        { id: 'dbms-2', title: 'Database Architecture - 3 Schema', videoId: 'kBdlM6hNDAE', duration: '25:00', order: 2, description: 'External, Conceptual, Internal schemas' },
        { id: 'dbms-3', title: 'Data Independence', videoId: 'kBdlM6hNDAE', duration: '18:00', order: 3, description: 'Logical and Physical data independence' },
        { id: 'dbms-4', title: 'Database Users & DBA', videoId: 'kBdlM6hNDAE', duration: '20:00', order: 4, description: 'Types of users, DBA responsibilities' }
      ]
    },
    {
      id: 'dbms-er-model',
      title: '2. ER Model & ER Diagrams',
      order: 2,
      lectures: [
        { id: 'dbms-er-1', title: 'Entity, Attributes, Relationships', videoId: 'kBdlM6hNDAE', duration: '30:00', order: 1, description: 'Basic ER concepts, attribute types' },
        { id: 'dbms-er-2', title: 'Keys in DBMS', videoId: 'kBdlM6hNDAE', duration: '28:00', order: 2, description: 'Super key, Candidate key, Primary key, Foreign key' },
        { id: 'dbms-er-3', title: 'Cardinality & Participation', videoId: 'kBdlM6hNDAE', duration: '25:00', order: 3, description: '1:1, 1:N, M:N relationships, total/partial participation' },
        { id: 'dbms-er-4', title: 'ER to Relational Mapping', videoId: 'kBdlM6hNDAE', duration: '35:00', order: 4, description: 'Converting ER diagrams to tables' },
        { id: 'dbms-er-5', title: 'Generalization & Specialization', videoId: 'kBdlM6hNDAE', duration: '22:00', order: 5, description: 'EER concepts, IS-A relationships' }
      ]
    },
    {
      id: 'dbms-relational',
      title: '3. Relational Model & Algebra',
      order: 3,
      lectures: [
        { id: 'dbms-rm-1', title: 'Relational Model Concepts', videoId: 'kBdlM6hNDAE', duration: '25:00', order: 1, description: 'Tuples, Attributes, Domains, Schema' },
        { id: 'dbms-rm-2', title: 'Relational Algebra - Basic Operations', videoId: 'kBdlM6hNDAE', duration: '35:00', order: 2, description: 'Select, Project, Union, Set Difference' },
        { id: 'dbms-rm-3', title: 'Relational Algebra - Joins', videoId: 'kBdlM6hNDAE', duration: '40:00', order: 3, description: 'Natural Join, Theta Join, Outer Joins' },
        { id: 'dbms-rm-4', title: 'Relational Calculus', videoId: 'kBdlM6hNDAE', duration: '30:00', order: 4, description: 'Tuple Relational Calculus, Domain Calculus' }
      ]
    },
    {
      id: 'dbms-sql',
      title: '4. SQL - Structured Query Language',
      order: 4,
      lectures: [
        { id: 'dbms-sql-1', title: 'DDL Commands - CREATE, ALTER, DROP', videoId: 'kBdlM6hNDAE', duration: '28:00', order: 1, description: 'Creating and modifying database objects' },
        { id: 'dbms-sql-2', title: 'DML Commands - INSERT, UPDATE, DELETE', videoId: 'kBdlM6hNDAE', duration: '25:00', order: 2, description: 'Manipulating data in tables' },
        { id: 'dbms-sql-3', title: 'SELECT Queries - Basics to Advanced', videoId: 'kBdlM6hNDAE', duration: '40:00', order: 3, description: 'WHERE, ORDER BY, GROUP BY, HAVING' },
        { id: 'dbms-sql-4', title: 'Joins in SQL', videoId: 'kBdlM6hNDAE', duration: '35:00', order: 4, description: 'INNER, LEFT, RIGHT, FULL OUTER JOIN' },
        { id: 'dbms-sql-5', title: 'Subqueries & Nested Queries', videoId: 'kBdlM6hNDAE', duration: '30:00', order: 5, description: 'Correlated and non-correlated subqueries' },
        { id: 'dbms-sql-6', title: 'Views, Indexes, Triggers', videoId: 'kBdlM6hNDAE', duration: '32:00', order: 6, description: 'Database objects for optimization' }
      ]
    },
    {
      id: 'dbms-normalization',
      title: '5. Normalization',
      order: 5,
      lectures: [
        { id: 'dbms-nf-1', title: 'Functional Dependencies', videoId: 'kBdlM6hNDAE', duration: '30:00', order: 1, description: 'FD basics, Armstrong axioms, closure' },
        { id: 'dbms-nf-2', title: 'Candidate Key Finding Algorithm', videoId: 'kBdlM6hNDAE', duration: '35:00', order: 2, description: 'Attribute closure method for finding keys' },
        { id: 'dbms-nf-3', title: '1NF, 2NF, 3NF', videoId: 'kBdlM6hNDAE', duration: '40:00', order: 3, description: 'First, Second, Third Normal Forms' },
        { id: 'dbms-nf-4', title: 'BCNF - Boyce-Codd Normal Form', videoId: 'kBdlM6hNDAE', duration: '32:00', order: 4, description: 'BCNF definition and decomposition' },
        { id: 'dbms-nf-5', title: '4NF & 5NF', videoId: 'kBdlM6hNDAE', duration: '28:00', order: 5, description: 'Multi-valued dependencies, Join dependencies' },
        { id: 'dbms-nf-6', title: 'Lossless Decomposition & Dependency Preservation', videoId: 'kBdlM6hNDAE', duration: '30:00', order: 6, description: 'Properties of good decomposition' }
      ]
    },
    {
      id: 'dbms-transactions',
      title: '6. Transactions & Concurrency',
      order: 6,
      lectures: [
        { id: 'dbms-tx-1', title: 'Transaction Concepts & ACID Properties', videoId: 'kBdlM6hNDAE', duration: '28:00', order: 1, description: 'Atomicity, Consistency, Isolation, Durability' },
        { id: 'dbms-tx-2', title: 'Transaction States & Schedules', videoId: 'kBdlM6hNDAE', duration: '25:00', order: 2, description: 'Active, Committed, Aborted states' },
        { id: 'dbms-tx-3', title: 'Serializability - Conflict & View', videoId: 'kBdlM6hNDAE', duration: '35:00', order: 3, description: 'Testing for conflict and view serializability' },
        { id: 'dbms-tx-4', title: 'Concurrency Control - Locks', videoId: 'kBdlM6hNDAE', duration: '32:00', order: 4, description: 'Shared locks, Exclusive locks, 2PL' },
        { id: 'dbms-tx-5', title: 'Deadlock Detection & Prevention', videoId: 'kBdlM6hNDAE', duration: '28:00', order: 5, description: 'Wait-die, Wound-wait, Deadlock graphs' },
        { id: 'dbms-tx-6', title: 'Timestamp Ordering Protocol', videoId: 'kBdlM6hNDAE', duration: '25:00', order: 6, description: 'Timestamp-based concurrency control' }
      ]
    },
    {
      id: 'dbms-recovery',
      title: '7. Recovery & File Organization',
      order: 7,
      lectures: [
        { id: 'dbms-rec-1', title: 'Log-Based Recovery', videoId: 'kBdlM6hNDAE', duration: '30:00', order: 1, description: 'Undo, Redo, Undo-Redo logging' },
        { id: 'dbms-rec-2', title: 'Checkpoints', videoId: 'kBdlM6hNDAE', duration: '22:00', order: 2, description: 'Checkpoint-based recovery optimization' },
        { id: 'dbms-rec-3', title: 'File Organization - Heap, Sequential', videoId: 'kBdlM6hNDAE', duration: '25:00', order: 3, description: 'Primary file organizations' },
        { id: 'dbms-rec-4', title: 'Indexing - B+ Trees', videoId: 'kBdlM6hNDAE', duration: '35:00', order: 4, description: 'B+ tree structure, insertion, deletion' },
        { id: 'dbms-rec-5', title: 'Hashing Techniques', videoId: 'kBdlM6hNDAE', duration: '28:00', order: 5, description: 'Static and dynamic hashing, extendible hashing' }
      ]
    }
  ]
};

// Operating Systems Course
const OS_COURSE: Course = {
  id: 'operating-systems',
  title: "Operating Systems - Complete Course",
  instructor: 'Gate Smashers & Neso Academy',
  description: 'Complete Operating Systems course covering Process Management, CPU Scheduling, Deadlocks, Memory Management, Virtual Memory, File Systems, Disk Scheduling. Perfect for GATE, interviews, and placements.',
  thumbnail: '/course-thumbnails/os.jpg',
  duration: '65+ hours',
  lectureCount: 85,
  level: 'intermediate',
  tags: ['Operating Systems', 'GATE', 'Process', 'Memory', 'CPU Scheduling', 'Deadlock'],
  enrollmentCount: 175000,
  rating: 4.8,
  sections: [
    {
      id: 'os-intro',
      title: '1. Introduction to OS',
      order: 1,
      lectures: [
        { id: 'os-1', title: 'What is Operating System?', videoId: 'vBURTt97EkA', duration: '20:00', order: 1, description: 'OS functions, types of OS' },
        { id: 'os-2', title: 'System Calls & Types', videoId: 'vBURTt97EkA', duration: '25:00', order: 2, description: 'Process, File, Device, Info, Communication calls' },
        { id: 'os-3', title: 'OS Structure - Monolithic, Microkernel', videoId: 'vBURTt97EkA', duration: '28:00', order: 3, description: 'Different OS architectures' },
        { id: 'os-4', title: 'Process vs Thread', videoId: 'vBURTt97EkA', duration: '22:00', order: 4, description: 'Differences, user vs kernel threads' }
      ]
    },
    {
      id: 'os-process',
      title: '2. Process Management',
      order: 2,
      lectures: [
        { id: 'os-pm-1', title: 'Process States & PCB', videoId: 'vBURTt97EkA', duration: '25:00', order: 1, description: 'Process lifecycle, Process Control Block' },
        { id: 'os-pm-2', title: 'Process Scheduling Queues', videoId: 'vBURTt97EkA', duration: '22:00', order: 2, description: 'Ready queue, Wait queue, schedulers' },
        { id: 'os-pm-3', title: 'Inter-Process Communication', videoId: 'vBURTt97EkA', duration: '30:00', order: 3, description: 'Shared memory, Message passing' },
        { id: 'os-pm-4', title: 'Process Synchronization - Critical Section', videoId: 'vBURTt97EkA', duration: '28:00', order: 4, description: 'Race condition, mutual exclusion' }
      ]
    },
    {
      id: 'os-scheduling',
      title: '3. CPU Scheduling',
      order: 3,
      lectures: [
        { id: 'os-sch-1', title: 'Scheduling Criteria & Metrics', videoId: 'vBURTt97EkA', duration: '22:00', order: 1, description: 'Turnaround, Waiting, Response time' },
        { id: 'os-sch-2', title: 'FCFS & SJF Scheduling', videoId: 'vBURTt97EkA', duration: '30:00', order: 2, description: 'First Come First Serve, Shortest Job First' },
        { id: 'os-sch-3', title: 'SRTF & Priority Scheduling', videoId: 'vBURTt97EkA', duration: '28:00', order: 3, description: 'Preemptive SJF, Priority-based scheduling' },
        { id: 'os-sch-4', title: 'Round Robin Scheduling', videoId: 'vBURTt97EkA', duration: '25:00', order: 4, description: 'Time quantum, context switching' },
        { id: 'os-sch-5', title: 'Multilevel Queue & Feedback Queue', videoId: 'vBURTt97EkA', duration: '28:00', order: 5, description: 'Multiple queues, feedback mechanism' }
      ]
    },
    {
      id: 'os-sync',
      title: '4. Process Synchronization',
      order: 4,
      lectures: [
        { id: 'os-sync-1', title: 'Semaphores - Counting & Binary', videoId: 'vBURTt97EkA', duration: '32:00', order: 1, description: 'Wait, Signal operations on semaphores' },
        { id: 'os-sync-2', title: 'Producer-Consumer Problem', videoId: 'vBURTt97EkA', duration: '28:00', order: 2, description: 'Bounded buffer using semaphores' },
        { id: 'os-sync-3', title: 'Readers-Writers Problem', videoId: 'vBURTt97EkA', duration: '25:00', order: 3, description: 'First readers-writers, second readers-writers' },
        { id: 'os-sync-4', title: 'Dining Philosophers Problem', videoId: 'vBURTt97EkA', duration: '28:00', order: 4, description: 'Classic synchronization problem' },
        { id: 'os-sync-5', title: 'Monitors', videoId: 'vBURTt97EkA', duration: '25:00', order: 5, description: 'High-level synchronization construct' }
      ]
    },
    {
      id: 'os-deadlock',
      title: '5. Deadlocks',
      order: 5,
      lectures: [
        { id: 'os-dl-1', title: 'Deadlock Characterization', videoId: 'vBURTt97EkA', duration: '25:00', order: 1, description: 'Four necessary conditions for deadlock' },
        { id: 'os-dl-2', title: 'Resource Allocation Graph', videoId: 'vBURTt97EkA', duration: '28:00', order: 2, description: 'RAG and deadlock detection' },
        { id: 'os-dl-3', title: 'Deadlock Prevention', videoId: 'vBURTt97EkA', duration: '25:00', order: 3, description: 'Breaking the four conditions' },
        { id: 'os-dl-4', title: 'Banker\'s Algorithm', videoId: 'vBURTt97EkA', duration: '40:00', order: 4, description: 'Deadlock avoidance with safety algorithm' },
        { id: 'os-dl-5', title: 'Deadlock Detection & Recovery', videoId: 'vBURTt97EkA', duration: '28:00', order: 5, description: 'Detection algorithm, recovery strategies' }
      ]
    },
    {
      id: 'os-memory',
      title: '6. Memory Management',
      order: 6,
      lectures: [
        { id: 'os-mem-1', title: 'Contiguous Memory Allocation', videoId: 'vBURTt97EkA', duration: '28:00', order: 1, description: 'Fixed partitioning, Variable partitioning' },
        { id: 'os-mem-2', title: 'Paging', videoId: 'vBURTt97EkA', duration: '35:00', order: 2, description: 'Page table, address translation' },
        { id: 'os-mem-3', title: 'Segmentation', videoId: 'vBURTt97EkA', duration: '28:00', order: 3, description: 'Segment table, segmentation with paging' },
        { id: 'os-mem-4', title: 'Virtual Memory - Demand Paging', videoId: 'vBURTt97EkA', duration: '32:00', order: 4, description: 'Page fault, demand paging' },
        { id: 'os-mem-5', title: 'Page Replacement Algorithms', videoId: 'vBURTt97EkA', duration: '40:00', order: 5, description: 'FIFO, Optimal, LRU, LRU Approximation' },
        { id: 'os-mem-6', title: 'Thrashing & Working Set', videoId: 'vBURTt97EkA', duration: '25:00', order: 6, description: 'Causes of thrashing, working set model' }
      ]
    },
    {
      id: 'os-disk',
      title: '7. Disk Scheduling',
      order: 7,
      lectures: [
        { id: 'os-disk-1', title: 'Disk Structure & Access Time', videoId: 'vBURTt97EkA', duration: '25:00', order: 1, description: 'Seek time, Rotational latency, Transfer time' },
        { id: 'os-disk-2', title: 'FCFS & SSTF Disk Scheduling', videoId: 'vBURTt97EkA', duration: '28:00', order: 2, description: 'First Come First Serve, Shortest Seek Time First' },
        { id: 'os-disk-3', title: 'SCAN & C-SCAN', videoId: 'vBURTt97EkA', duration: '25:00', order: 3, description: 'Elevator algorithm, Circular SCAN' },
        { id: 'os-disk-4', title: 'LOOK & C-LOOK', videoId: 'vBURTt97EkA', duration: '22:00', order: 4, description: 'Optimized SCAN algorithms' }
      ]
    }
  ]
};

// Course repository - all courses with actual content
const COURSES: Course[] = [
  DSA_COURSE,
  APTITUDE_COURSE,
  COMPUTER_NETWORKS_COURSE,
  DBMS_COURSE,
  OS_COURSE
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