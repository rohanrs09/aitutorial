// DSA Quiz Question Bank - Aligned with Striver A2Z DSA Course
// Topics match exactly with striver.json module titles

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface TopicQuestions {
  [topic: string]: QuizQuestion[];
}

export const QUIZ_QUESTIONS: TopicQuestions = {
  'Time & Space Complexity': [
    { question: 'What does Big-O notation represent?', options: ['Best case', 'Average case', 'Worst case growth rate', 'Exact runtime'], correctAnswer: 2, explanation: 'Big-O represents the worst-case upper bound of how an algorithm scales with input size.', difficulty: 'easy' },
    { question: 'What is the time complexity of a single for loop iterating n times?', options: ['O(1)', 'O(n)', 'O(n²)', 'O(log n)'], correctAnswer: 1, explanation: 'A single loop running n times has O(n) linear time complexity.', difficulty: 'easy' },
    { question: 'What is the time complexity of two nested loops each running n times?', options: ['O(n)', 'O(2n)', 'O(n²)', 'O(n log n)'], correctAnswer: 2, explanation: 'Two nested loops give O(n²) quadratic complexity.', difficulty: 'easy' },
    { question: 'What is O(1) space complexity?', options: ['Uses n memory', 'Uses constant memory regardless of input', 'Uses log n memory', 'No memory used'], correctAnswer: 1, explanation: 'O(1) means the algorithm uses a fixed amount of extra memory regardless of input size.', difficulty: 'easy' },
    { question: 'Which is faster for large n: O(n log n) or O(n²)?', options: ['O(n²)', 'O(n log n)', 'Same speed', 'Depends on n'], correctAnswer: 1, explanation: 'O(n log n) grows slower than O(n²) for large n.', difficulty: 'medium' },
    { question: 'What is the space complexity of a recursive function with depth n?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correctAnswer: 2, explanation: 'Recursive functions use call stack space proportional to recursion depth: O(n).', difficulty: 'medium' },
    { question: 'If an algorithm has O(n) space, what does it mean?', options: ['Disk space', 'Extra memory proportional to input size', 'CPU cache', 'Network bandwidth'], correctAnswer: 1, explanation: 'Space complexity O(n) means extra memory grows proportionally with input size.', difficulty: 'medium' }
  ],
  'Arrays (1D & 2D)': [
    { question: 'What is the time complexity of accessing an array element by index?', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], correctAnswer: 2, explanation: 'Array access by index is O(1) due to contiguous memory.', difficulty: 'easy' },
    { question: 'What is the time complexity of inserting at the beginning of an array?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correctAnswer: 2, explanation: 'Inserting at the beginning requires shifting all elements: O(n).', difficulty: 'easy' },
    { question: 'An element is a "leader" in an array if:', options: ['It is the largest', 'All elements to its right are smaller', 'It is the first element', 'It appears most frequently'], correctAnswer: 1, explanation: 'An element is a leader if all elements to its right are smaller.', difficulty: 'medium' },
    { question: 'What technique optimizes Subarray Sum Equals K to O(n)?', options: ['Sorting', 'Prefix sum with hashing', 'Binary search', 'Two pointers'], correctAnswer: 1, explanation: 'Using prefix sum and a hash map gives O(n) solution.', difficulty: 'medium' },
    { question: 'For two-pointer pair sum, the array must be:', options: ['Sorted', 'Unique elements', 'Even length', 'No prerequisite'], correctAnswer: 0, explanation: 'Two-pointer pair sum requires the array to be sorted.', difficulty: 'easy' },
    { question: 'Space complexity of in-place array rotation using reversal?', options: ['O(n)', 'O(n²)', 'O(1)', 'O(log n)'], correctAnswer: 2, explanation: 'In-place rotation using reversal uses O(1) extra space.', difficulty: 'medium' },
    { question: 'Brute force complexity for finding leaders in an array?', options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(1)'], correctAnswer: 2, explanation: 'Brute force checks every element against all to its right: O(n²).', difficulty: 'easy' }
  ],
  'Strings': [
    { question: 'What is a palindrome?', options: ['A sorted string', 'Reads same forward and backward', 'String with unique chars', 'An empty string'], correctAnswer: 1, explanation: 'A palindrome reads the same forward and backward, like "racecar".', difficulty: 'easy' },
    { question: 'Which technique reverses a string in-place?', options: ['Sorting', 'Two pointer technique', 'Hashing', 'Binary search'], correctAnswer: 1, explanation: 'Two pointers from both ends swap characters: O(n) time, O(1) space.', difficulty: 'easy' },
    { question: 'How to check valid palindrome ignoring special characters?', options: ['Sort and compare', 'Two pointers skipping non-alphanumeric', 'Use stack', 'Reverse and compare'], correctAnswer: 1, explanation: 'Two pointers skip non-alphanumeric characters and compare in lowercase.', difficulty: 'medium' },
    { question: 'How to check if two strings are anagrams?', options: ['Binary Search', 'Sorting or Hash Map frequency count', 'Recursion', 'Divide and Conquer'], correctAnswer: 1, explanation: 'Sort both strings and compare, or use hash map for character frequencies.', difficulty: 'medium' },
    { question: 'Time complexity of anagram check using sorting?', options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(1)'], correctAnswer: 1, explanation: 'Sorting each string takes O(n log n).', difficulty: 'medium' },
    { question: 'In C++, string vs char array?', options: ['No difference', 'string is dynamic, char array is fixed', 'char array is faster', 'string uses less memory'], correctAnswer: 1, explanation: 'C++ string class supports dynamic size and built-in functions.', difficulty: 'easy' },
    { question: 'Time complexity of KMP string matching?', options: ['O(n*m)', 'O(n+m)', 'O(n²)', 'O(log n)'], correctAnswer: 1, explanation: 'KMP uses LPS array to avoid redundant comparisons: O(n+m).', difficulty: 'hard' }
  ],
  'Binary Search': [
    { question: 'What is the prerequisite for binary search?', options: ['Unsorted array', 'Sorted array', 'Circular array', 'Unique elements'], correctAnswer: 1, explanation: 'Binary search only works on sorted arrays.', difficulty: 'easy' },
    { question: 'Time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], correctAnswer: 1, explanation: 'Binary search halves the search space each iteration: O(log n).', difficulty: 'easy' },
    { question: 'How to find first occurrence using binary search?', options: ['Return when found', 'Continue searching left half when found', 'Linear search after', 'Not possible'], correctAnswer: 1, explanation: 'When found, continue searching left half for first occurrence.', difficulty: 'medium' },
    { question: 'Time complexity of search in rotated sorted array?', options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], correctAnswer: 1, explanation: 'Modified binary search checks which half is sorted: O(log n).', difficulty: 'medium' },
    { question: 'What is "Binary Search on Answer" pattern?', options: ['Finding duplicates', 'Optimization with monotonic property', 'String matching', 'Graph problems'], correctAnswer: 1, explanation: 'When answer satisfies monotonic condition, binary search finds optimal value.', difficulty: 'hard' },
    { question: 'How to prevent overflow when computing mid?', options: ['Use long', 'mid = low + (high - low) / 2', 'Use modulo', 'Reduce size'], correctAnswer: 1, explanation: 'low + (high - low) / 2 prevents integer overflow.', difficulty: 'medium' },
    { question: 'Space complexity of iterative binary search?', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], correctAnswer: 2, explanation: 'Iterative binary search uses only a few variables: O(1).', difficulty: 'easy' }
  ],
  'Recursion & Backtracking': [
    { question: 'What is the base case in recursion?', options: ['First recursive call', 'Condition that stops recursion', 'Largest input', 'Return type'], correctAnswer: 1, explanation: 'Base case terminates recursion to prevent stack overflow.', difficulty: 'easy' },
    { question: 'What happens without a base case?', options: ['Returns 0', 'Stack overflow error', 'Compilation error', 'Returns null'], correctAnswer: 1, explanation: 'Without base case, recursion continues until call stack overflows.', difficulty: 'easy' },
    { question: 'What is "pick or not pick" technique?', options: ['Sorting', 'Generate all subsequences', 'Graph traversal', 'String matching'], correctAnswer: 1, explanation: 'At each element, include or skip it, generating 2^n subsequences.', difficulty: 'medium' },
    { question: 'Time complexity of generating all subsequences?', options: ['O(n)', 'O(n²)', 'O(2^n)', 'O(n!)'], correctAnswer: 2, explanation: 'Each element has 2 choices (pick/not pick): 2^n total.', difficulty: 'medium' },
    { question: 'What is backtracking?', options: ['Going to start', 'Exploring paths and undoing invalid choices', 'Reversing array', 'Bottom-up approach'], correctAnswer: 1, explanation: 'Backtracking explores possibilities, undoes invalid choices.', difficulty: 'medium' },
    { question: 'Parameterized vs functional recursion?', options: ['No difference', 'Parameterized passes result via args, functional returns value', 'Functional is faster', 'Parameterized uses less memory'], correctAnswer: 1, explanation: 'Parameterized modifies parameters; functional returns computed value.', difficulty: 'medium' },
    { question: 'Tower of Hanoi: moves for n disks?', options: ['n', 'n²', '2^n - 1', 'n!'], correctAnswer: 2, explanation: 'Requires 2^n - 1 moves from recurrence T(n) = 2T(n-1) + 1.', difficulty: 'hard' }
  ],
  'Stack': [
    { question: 'Which principle does a Stack follow?', options: ['FIFO', 'LIFO', 'Random access', 'Priority based'], correctAnswer: 1, explanation: 'Stack follows LIFO (Last In First Out).', difficulty: 'easy' },
    { question: 'Time complexity of push and pop in a stack?', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], correctAnswer: 2, explanation: 'Both push and pop are O(1) as they only modify the top.', difficulty: 'easy' },
    { question: 'Which data structure checks balanced parentheses?', options: ['Queue', 'Stack', 'Heap', 'Tree'], correctAnswer: 1, explanation: 'Stack matches opening brackets with closing brackets in LIFO order.', difficulty: 'medium' },
    { question: 'What is a monotonic stack used for?', options: ['Sorting', 'Finding next greater/smaller element', 'Graph traversal', 'String matching'], correctAnswer: 1, explanation: 'Monotonic stack finds next greater or smaller element in O(n).', difficulty: 'hard' },
    { question: 'Next Greater Element: which direction to traverse?', options: ['Left to right', 'Right to left', 'Both', 'Random'], correctAnswer: 1, explanation: 'Traversing right to left with stack maintains decreasing order.', difficulty: 'medium' },
    { question: 'What is the Peek/Top operation?', options: ['Remove top', 'Insert element', 'View top without removing', 'Check if empty'], correctAnswer: 2, explanation: 'Peek/Top returns top element without removing it.', difficulty: 'easy' },
    { question: 'Which application uses a stack?', options: ['Print queue', 'Undo/Redo functionality', 'Task scheduling', 'Round-robin'], correctAnswer: 1, explanation: 'Undo/Redo uses stack to track actions in LIFO order.', difficulty: 'easy' }
  ],
  'Queue': [
    { question: 'Which principle does a Queue follow?', options: ['LIFO', 'FIFO', 'Random access', 'Priority based'], correctAnswer: 1, explanation: 'Queue follows FIFO (First In First Out).', difficulty: 'easy' },
    { question: 'What are the two main queue operations?', options: ['Push/Pop', 'Enqueue/Dequeue', 'Insert/Delete', 'Add/Remove'], correctAnswer: 1, explanation: 'Enqueue inserts at rear, Dequeue removes from front.', difficulty: 'easy' },
    { question: 'How to implement queue using two stacks?', options: ['Not possible', 'Push to stack1, transfer to stack2 for dequeue', 'Use recursion', 'Use array'], correctAnswer: 1, explanation: 'Push to stack1; for dequeue, transfer to stack2 and pop (amortized O(1)).', difficulty: 'medium' },
    { question: 'What is a circular queue?', options: ['Queue with priority', 'Rear connects back to front', 'Double-ended queue', 'Random access queue'], correctAnswer: 1, explanation: 'Circular queue connects last position back to first for space efficiency.', difficulty: 'medium' },
    { question: 'Time complexity of enqueue and dequeue?', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], correctAnswer: 2, explanation: 'Both are O(1) in a properly implemented queue.', difficulty: 'easy' },
    { question: 'Which data structure is used in BFS?', options: ['Stack', 'Queue', 'Heap', 'Array'], correctAnswer: 1, explanation: 'BFS uses a queue to process vertices level by level.', difficulty: 'medium' },
    { question: 'What is a deque?', options: ['Priority queue', 'Insert/delete from both ends', 'Two queues', 'Circular queue'], correctAnswer: 1, explanation: 'Deque allows O(1) insertion and deletion from both ends.', difficulty: 'medium' }
  ],
  'Linked List': [
    { question: 'Main advantage of linked list over array?', options: ['Faster random access', 'Dynamic size and O(1) insertion at head', 'Less memory', 'Better cache locality'], correctAnswer: 1, explanation: 'Linked lists grow/shrink dynamically and insert at head in O(1).', difficulty: 'easy' },
    { question: 'What does each singly linked list node contain?', options: ['Only data', 'Data and next pointer', 'Data, next and prev pointers', 'Data and index'], correctAnswer: 1, explanation: 'Each node has data and a reference to the next node.', difficulty: 'easy' },
    { question: 'Time complexity of reversing a linked list?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correctAnswer: 2, explanation: 'Reversing traverses the entire list once using three pointers.', difficulty: 'easy' },
    { question: 'Which algorithm detects a cycle in linked list?', options: ['Binary Search', 'Floyd\'s Cycle Detection (Tortoise and Hare)', 'DFS', 'BFS'], correctAnswer: 1, explanation: 'Floyd\'s uses slow and fast pointers to detect cycles in O(n) time, O(1) space.', difficulty: 'medium' },
    { question: 'How to find middle element in one pass?', options: ['Count nodes first', 'Slow and fast pointers', 'Recursion', 'Not possible'], correctAnswer: 1, explanation: 'Slow moves one step, fast moves two; when fast ends, slow is at middle.', difficulty: 'medium' },
    { question: 'Space complexity of merging two sorted linked lists?', options: ['O(n+m)', 'O(1)', 'O(n)', 'O(log n)'], correctAnswer: 1, explanation: 'Merging in-place by adjusting pointers requires O(1) extra space.', difficulty: 'medium' },
    { question: 'Time complexity of deleting a node given only pointer to it?', options: ['O(1)', 'O(n)', 'O(log n)', 'Not possible'], correctAnswer: 0, explanation: 'Copy data from next node to current and delete next: O(1).', difficulty: 'hard' }
  ],
  'Trees (Binary Tree)': [
    { question: 'Max nodes at level k in a binary tree?', options: ['k', '2k', '2^k', 'k²'], correctAnswer: 2, explanation: 'At level k (from 0), a binary tree has at most 2^k nodes.', difficulty: 'easy' },
    { question: 'What is Inorder traversal order?', options: ['Root→Left→Right', 'Left→Root→Right', 'Left→Right→Root', 'Right→Root→Left'], correctAnswer: 1, explanation: 'Inorder: Left subtree, Root, Right subtree.', difficulty: 'easy' },
    { question: 'What is Preorder traversal order?', options: ['Root→Left→Right', 'Left→Root→Right', 'Left→Right→Root', 'Right→Root→Left'], correctAnswer: 0, explanation: 'Preorder: Root, Left subtree, Right subtree.', difficulty: 'easy' },
    { question: 'Which traversal is Level Order (BFS)?', options: ['Stack-based DFS', 'Queue-based BFS', 'Recursion only', 'Hash map'], correctAnswer: 1, explanation: 'Level order uses a queue to visit nodes level by level.', difficulty: 'easy' },
    { question: 'Height of complete binary tree with n nodes?', options: ['n', 'log n', 'n/2', '√n'], correctAnswer: 1, explanation: 'Complete binary tree has height floor(log₂ n).', difficulty: 'medium' },
    { question: 'What is a leaf node?', options: ['Root node', 'Node with no children', 'Node with one child', 'Internal node'], correctAnswer: 1, explanation: 'A leaf node has no left or right children.', difficulty: 'easy' },
    { question: 'Time complexity of tree traversals?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correctAnswer: 2, explanation: 'All DFS traversals visit each node exactly once: O(n).', difficulty: 'medium' }
  ],
  'Binary Search Tree (BST)': [
    { question: 'Key property of a BST?', options: ['All nodes equal', 'Left < Root < Right', 'Right < Root < Left', 'Parent > All children'], correctAnswer: 1, explanation: 'In BST, left subtree values < root < right subtree values.', difficulty: 'easy' },
    { question: 'Which traversal gives sorted order for BST?', options: ['Preorder', 'Postorder', 'Inorder', 'Level order'], correctAnswer: 2, explanation: 'Inorder (Left→Root→Right) visits BST nodes in ascending order.', difficulty: 'easy' },
    { question: 'Time complexity of search in balanced BST?', options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], correctAnswer: 1, explanation: 'Balanced BST has height log n, so search is O(log n).', difficulty: 'easy' },
    { question: 'How to validate a BST?', options: ['Check node > left child', 'Min-max range validation recursively', 'Check sorted order', 'Count nodes'], correctAnswer: 1, explanation: 'Pass valid range (min, max) to each node and check value falls within.', difficulty: 'medium' },
    { question: 'Worst-case height of unbalanced BST?', options: ['log n', 'n', 'n/2', '2^n'], correctAnswer: 1, explanation: 'Unbalanced BST can degenerate into a linked list with height n.', difficulty: 'medium' },
    { question: 'Time complexity of BST insertion?', options: ['O(1)', 'O(h) where h is height', 'O(n²)', 'O(n log n)'], correctAnswer: 1, explanation: 'Insertion follows path from root to leaf: O(h).', difficulty: 'medium' },
    { question: 'What is a self-balancing BST?', options: ['Equal subtrees', 'Auto-balances after operations (AVL, Red-Black)', 'Unique elements', 'Sorted array'], correctAnswer: 1, explanation: 'AVL and Red-Black trees maintain O(log n) height automatically.', difficulty: 'hard' }
  ],
  'Heap & Priority Queue': [
    { question: 'Min-heap property?', options: ['Parent ≥ Children', 'Parent ≤ Children', 'Left < Right', 'No order'], correctAnswer: 1, explanation: 'In min-heap, every parent is less than or equal to its children.', difficulty: 'easy' },
    { question: 'Time complexity of extract-min from min-heap?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], correctAnswer: 1, explanation: 'Extract-min removes root and heapifies down: O(log n).', difficulty: 'easy' },
    { question: 'Time complexity of building a heap from array?', options: ['O(n)', 'O(n log n)', 'O(log n)', 'O(n²)'], correctAnswer: 0, explanation: 'Bottom-up heapify builds heap in O(n).', difficulty: 'medium' },
    { question: 'How to find Kth largest element efficiently?', options: ['Sort entire array', 'Min-heap of size K', 'Stack', 'Binary search'], correctAnswer: 1, explanation: 'Min-heap of size K keeps K largest: O(n log k).', difficulty: 'medium' },
    { question: 'Parent index of node at index i (0-indexed)?', options: ['i/2', '(i-1)/2', '2i', '2i+1'], correctAnswer: 1, explanation: 'For 0-indexed heap, parent is at floor((i-1)/2).', difficulty: 'medium' },
    { question: 'What type of tree is a heap?', options: ['BST', 'Complete Binary Tree', 'Full Binary Tree', 'Skewed Tree'], correctAnswer: 1, explanation: 'Heap is always a complete binary tree.', difficulty: 'easy' },
    { question: 'Heap sort space complexity?', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], correctAnswer: 2, explanation: 'Heap sort is in-place: O(1) auxiliary space.', difficulty: 'medium' }
  ],
  'Hashing': [
    { question: 'Average time complexity of hash table lookup?', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], correctAnswer: 2, explanation: 'Hash tables provide O(1) average case lookup.', difficulty: 'easy' },
    { question: 'What is a hash collision?', options: ['Same value keys', 'Different keys mapping to same index', 'Hash failure', 'Table overflow'], correctAnswer: 1, explanation: 'Collision: different keys produce the same hash index.', difficulty: 'easy' },
    { question: 'How does Two Sum use hashing for O(n)?', options: ['Sort and search', 'Store visited, check complement', 'Two loops', 'Binary search'], correctAnswer: 1, explanation: 'For each element, check if (target - element) exists in hash map.', difficulty: 'medium' },
    { question: 'What is frequency counting using hashing?', options: ['Counting collisions', 'Counting occurrences via hash map', 'Counting table size', 'Counting buckets'], correctAnswer: 1, explanation: 'Use unordered_map to count element occurrences in single traversal.', difficulty: 'easy' },
    { question: 'Worst-case time complexity of hash table?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correctAnswer: 2, explanation: 'Worst case O(n) when all keys hash to same bucket.', difficulty: 'medium' },
    { question: 'Which C++ container uses hashing?', options: ['map', 'set', 'unordered_map', 'vector'], correctAnswer: 2, explanation: 'unordered_map uses hash table for O(1) average operations.', difficulty: 'easy' },
    { question: 'What is load factor of a hash table?', options: ['Number of elements', 'Table size', 'Ratio of elements to table size', 'Number of collisions'], correctAnswer: 2, explanation: 'Load factor = n/m where n is elements and m is table size.', difficulty: 'medium' }
  ],
  'Graphs': [
    { question: 'Two ways to represent a graph?', options: ['Array and List', 'Adjacency Matrix and Adjacency List', 'Stack and Queue', 'Tree and Heap'], correctAnswer: 1, explanation: 'Adjacency matrix (O(V²) space) or adjacency list (O(V+E) space).', difficulty: 'easy' },
    { question: 'Which data structure does BFS use?', options: ['Stack', 'Queue', 'Heap', 'Linked List'], correctAnswer: 1, explanation: 'BFS uses queue to process vertices level by level.', difficulty: 'easy' },
    { question: 'Which data structure does DFS use?', options: ['Queue', 'Stack (or recursion)', 'Heap', 'Array'], correctAnswer: 1, explanation: 'DFS uses stack or recursion to go as deep as possible.', difficulty: 'easy' },
    { question: 'Time complexity of BFS/DFS?', options: ['O(V)', 'O(E)', 'O(V + E)', 'O(V * E)'], correctAnswer: 2, explanation: 'BFS/DFS visits each vertex and edge once: O(V + E).', difficulty: 'medium' },
    { question: 'Shortest path in unweighted graph?', options: ['DFS', 'BFS', 'Dijkstra', 'Floyd-Warshall'], correctAnswer: 1, explanation: 'BFS finds shortest path in unweighted graphs (level by level).', difficulty: 'medium' },
    { question: 'Directed vs undirected graph?', options: ['No difference', 'Directed edges have direction, undirected do not', 'Directed has weights', 'Undirected has cycles'], correctAnswer: 1, explanation: 'Directed: edges have direction (u→v); undirected: bidirectional.', difficulty: 'easy' },
    { question: 'Which representation is better for sparse graphs?', options: ['Adjacency Matrix', 'Adjacency List', 'Both same', 'Neither'], correctAnswer: 1, explanation: 'Adjacency list uses O(V+E) vs O(V²) for matrix.', difficulty: 'medium' }
  ],
  'Dynamic Programming (DP)': [
    { question: 'Two key properties for DP?', options: ['Sorting and searching', 'Optimal substructure and overlapping subproblems', 'Greedy and sorting', 'Divide and conquer'], correctAnswer: 1, explanation: 'DP needs optimal substructure and overlapping subproblems.', difficulty: 'easy' },
    { question: 'What is memoization?', options: ['Bottom-up iteration', 'Storing results to avoid recomputation (top-down)', 'Sorting', 'Graph traversal'], correctAnswer: 1, explanation: 'Memoization stores results for reuse (top-down DP).', difficulty: 'easy' },
    { question: 'Climbing Stairs recurrence?', options: ['dp[n] = dp[n-1]', 'dp[n] = dp[n-1] + dp[n-2]', 'dp[n] = 2*dp[n-1]', 'dp[n] = n'], correctAnswer: 1, explanation: 'dp[n] = dp[n-1] + dp[n-2], similar to Fibonacci.', difficulty: 'easy' },
    { question: 'Top-down vs bottom-up DP?', options: ['No difference', 'Top-down: recursion+memo, bottom-up: iteration+table', 'Top-down faster', 'Bottom-up more memory'], correctAnswer: 1, explanation: 'Top-down is recursive with memoization; bottom-up is iterative tabulation.', difficulty: 'medium' },
    { question: 'Grid Unique Paths recurrence?', options: ['dp[i][j] = dp[i-1][j]', 'dp[i][j] = dp[i-1][j] + dp[i][j-1]', 'dp[i][j] = max(...)', 'dp[i][j] = i*j'], correctAnswer: 1, explanation: 'Each cell reached from top or left: dp[i][j] = dp[i-1][j] + dp[i][j-1].', difficulty: 'medium' },
    { question: 'House Robber problem is about?', options: ['Shortest path', 'Maximum sum of non-adjacent elements', 'Sorting', 'Graph coloring'], correctAnswer: 1, explanation: 'Find max sum with no two adjacent elements chosen (pick or not pick).', difficulty: 'medium' },
    { question: '0/1 Knapsack DP time complexity?', options: ['O(n)', 'O(W)', 'O(n * W)', 'O(2^n)'], correctAnswer: 2, explanation: '0/1 Knapsack uses n × W table.', difficulty: 'hard' }
  ],
  'Greedy Algorithms': [
    { question: 'Core idea of greedy algorithms?', options: ['Try all possibilities', 'Make locally optimal choice at each step', 'Use recursion', 'Sort and search'], correctAnswer: 1, explanation: 'Greedy makes locally optimal choice hoping for global optimum.', difficulty: 'easy' },
    { question: 'Does greedy always give optimal solution?', options: ['Yes always', 'Only for problems with greedy choice property', 'Only for sorting', 'Only for graphs'], correctAnswer: 1, explanation: 'Greedy works only for problems with greedy choice property.', difficulty: 'medium' },
    { question: 'Activity Selection: how to sort?', options: ['By start time', 'By end time', 'By duration', 'By name'], correctAnswer: 1, explanation: 'Sort by end time, then greedily pick first compatible activity.', difficulty: 'medium' },
    { question: 'Activity Selection time complexity?', options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(2^n)'], correctAnswer: 1, explanation: 'O(n log n) for sorting + O(n) for selection.', difficulty: 'medium' },
    { question: 'Which algorithm uses greedy approach?', options: ['Fibonacci DP', 'Dijkstra shortest path', 'Binary Search', 'Merge Sort'], correctAnswer: 1, explanation: 'Dijkstra uses greedy by selecting nearest unvisited vertex.', difficulty: 'medium' },
    { question: 'Greedy vs DP difference?', options: ['No difference', 'Greedy: one choice per step, DP: all subproblems', 'DP always faster', 'Greedy more memory'], correctAnswer: 1, explanation: 'Greedy commits to local choice; DP explores all subproblems.', difficulty: 'hard' },
    { question: 'Fractional knapsack: greedy or DP?', options: ['DP only', 'Greedy (sort by value/weight ratio)', 'Both equally', 'Neither'], correctAnswer: 1, explanation: 'Fractional knapsack uses greedy: sort by value/weight ratio.', difficulty: 'medium' }
  ],
  'Bit Manipulation': [
    { question: 'What does AND (&) operator do?', options: ['Sets all bits to 1', 'Returns 1 only if both bits are 1', 'Flips bits', 'Shifts left'], correctAnswer: 1, explanation: 'AND returns 1 only when both corresponding bits are 1.', difficulty: 'easy' },
    { question: 'Check if number is power of 2 using bits?', options: ['n % 2 == 0', 'n & (n-1) == 0 and n > 0', 'n >> 1 == 0', 'n ^ n == 0'], correctAnswer: 1, explanation: 'Powers of 2 have one set bit; n & (n-1) clears it, giving 0.', difficulty: 'medium' },
    { question: 'XOR of a number with itself?', options: ['The number', '0', '1', 'Complement'], correctAnswer: 1, explanation: 'a ^ a = 0. XOR of identical values cancels to zero.', difficulty: 'easy' },
    { question: 'Left shift (<<) by 1 does what?', options: ['Divides by 2', 'Multiplies by 2', 'Adds 1', 'Subtracts 1'], correctAnswer: 1, explanation: 'Left shift by 1 multiplies the number by 2.', difficulty: 'easy' },
    { question: 'Find single non-repeating element (others appear twice)?', options: ['Sorting', 'XOR all elements', 'Hashing', 'Binary search'], correctAnswer: 1, explanation: 'XOR cancels pairs (a^a=0), leaving the unique element.', difficulty: 'medium' },
    { question: 'Time complexity of bit operations?', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], correctAnswer: 2, explanation: 'Bitwise operations on fixed-size integers are O(1).', difficulty: 'easy' },
    { question: 'Right shift (>>) by 1 does what?', options: ['Multiplies by 2', 'Integer division by 2', 'Adds 1', 'Flips bits'], correctAnswer: 1, explanation: 'Right shift by 1 performs integer division by 2.', difficulty: 'easy' }
  ],
  'Sorting Algorithms': [
    { question: 'Time complexity of Bubble Sort?', options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], correctAnswer: 2, explanation: 'Bubble Sort compares adjacent elements: O(n²) worst/average.', difficulty: 'easy' },
    { question: 'How does Selection Sort work?', options: ['Swaps adjacent', 'Selects minimum, places at beginning', 'Divides and merges', 'Pivot partitioning'], correctAnswer: 1, explanation: 'Selection Sort finds minimum and places it at current position.', difficulty: 'easy' },
    { question: 'Best-case time of Insertion Sort?', options: ['O(n²)', 'O(n log n)', 'O(n)', 'O(1)'], correctAnswer: 2, explanation: 'Insertion Sort is O(n) on already sorted arrays.', difficulty: 'medium' },
    { question: 'Time complexity of Merge Sort?', options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], correctAnswer: 1, explanation: 'Merge Sort always divides and merges in O(n log n).', difficulty: 'easy' },
    { question: 'Is Merge Sort stable?', options: ['No', 'Yes', 'Only for integers', 'Depends'], correctAnswer: 1, explanation: 'Merge Sort is stable: equal elements keep relative order.', difficulty: 'medium' },
    { question: 'Worst-case time of Quick Sort?', options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], correctAnswer: 2, explanation: 'Quick Sort O(n²) when pivot is always min or max.', difficulty: 'medium' },
    { question: 'Space complexity of Merge Sort?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correctAnswer: 2, explanation: 'Merge Sort needs O(n) auxiliary space for merging.', difficulty: 'medium' }
  ],
  'Advanced Graph Algorithms': [
    { question: 'Detect cycle in undirected graph using BFS?', options: ['Check visited', 'Visited node is not parent → cycle', 'Count edges', 'Use stack'], correctAnswer: 1, explanation: 'If visited node is not parent, a cycle exists.', difficulty: 'medium' },
    { question: 'Detect cycle in directed graph?', options: ['BFS only', 'DFS with recursion stack (back edge)', 'Sorting', 'Binary search'], correctAnswer: 1, explanation: 'If node in current recursion stack is visited again, cycle exists.', difficulty: 'medium' },
    { question: 'Topological sort applies to?', options: ['Any graph', 'Only DAG', 'Only undirected', 'Only weighted'], correctAnswer: 1, explanation: 'Topological sort is only for DAGs (Directed Acyclic Graphs).', difficulty: 'medium' },
    { question: 'What does Dijkstra find?', options: ['MST', 'Shortest path from source to all nodes', 'Longest path', 'All cycles'], correctAnswer: 1, explanation: 'Dijkstra finds shortest paths from single source in weighted graph.', difficulty: 'medium' },
    { question: 'Dijkstra uses which data structure?', options: ['Stack', 'Queue', 'Priority Queue (Min-Heap)', 'Linked List'], correctAnswer: 2, explanation: 'Priority queue extracts minimum distance vertex in O(log V).', difficulty: 'medium' },
    { question: 'Dijkstra time complexity with priority queue?', options: ['O(V²)', 'O(E log V)', 'O(V+E)', 'O(V*E)'], correctAnswer: 1, explanation: 'With binary heap: O(E log V).', difficulty: 'hard' },
    { question: 'Kahn\'s algorithm uses what for topological sort?', options: ['DFS and stack', 'Indegree array and queue', 'Adjacency matrix', 'Recursion only'], correctAnswer: 1, explanation: 'Kahn uses indegree array and queue to process 0-indegree nodes.', difficulty: 'hard' }
  ],
  'Trie (Prefix Tree)': [
    { question: 'What is a Trie used for?', options: ['Sorting numbers', 'Efficient prefix-based string searching', 'Graph traversal', 'Heap operations'], correctAnswer: 1, explanation: 'Trie stores strings for prefix-based searching like autocomplete.', difficulty: 'easy' },
    { question: 'Each Trie node represents?', options: ['A word', 'A character', 'A number', 'A sentence'], correctAnswer: 1, explanation: 'Each node represents a character; paths from root form words.', difficulty: 'easy' },
    { question: 'Insert/search time in Trie?', options: ['O(n)', 'O(log n)', 'O(L) where L is word length', 'O(1)'], correctAnswer: 2, explanation: 'Traverse character by character: O(L) time.', difficulty: 'medium' },
    { question: 'How to mark end of word in Trie?', options: ['null pointer', 'end-of-word boolean flag', 'special character', 'counter'], correctAnswer: 1, explanation: 'An end-of-word flag marks complete word at this node.', difficulty: 'medium' },
    { question: 'Common Trie application?', options: ['Sorting arrays', 'Autocomplete and dictionary', 'Shortest path', 'Matrix operations'], correctAnswer: 1, explanation: 'Tries used for autocomplete, spell check, dictionary lookups.', difficulty: 'easy' },
    { question: 'Longest word with all prefixes in Trie?', options: ['Sort words', 'DFS checking end-of-word at each node', 'Binary search', 'Hashing'], correctAnswer: 1, explanation: 'DFS traversal checking end-of-word flag at every node on path.', difficulty: 'hard' },
    { question: 'Space complexity of Trie with N words of avg length L?', options: ['O(N)', 'O(L)', 'O(N * L * alphabet_size)', 'O(1)'], correctAnswer: 2, explanation: 'Each node can have alphabet_size children across N*L nodes.', difficulty: 'hard' }
  ],
  'Segment Tree & Fenwick Tree': [
    { question: 'What is Segment Tree used for?', options: ['Sorting', 'Range queries and updates', 'Graph traversal', 'String matching'], correctAnswer: 1, explanation: 'Segment Tree supports range queries (sum, min, max) and updates in O(log n).', difficulty: 'medium' },
    { question: 'Build time of Segment Tree?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], correctAnswer: 2, explanation: 'Building visits each element once: O(n).', difficulty: 'medium' },
    { question: 'Query time of Segment Tree?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correctAnswer: 1, explanation: 'Range queries traverse relevant segments: O(log n).', difficulty: 'medium' },
    { question: 'Fenwick Tree is used for?', options: ['Sorting', 'Prefix sum queries and point updates', 'Graph traversal', 'String matching'], correctAnswer: 1, explanation: 'Fenwick Tree: prefix sums and point updates in O(log n).', difficulty: 'medium' },
    { question: 'Fenwick Tree advantage over Segment Tree?', options: ['More features', 'Simpler implementation and less memory', 'Faster queries', 'More operations'], correctAnswer: 1, explanation: 'Fenwick Tree is simpler and uses less memory.', difficulty: 'hard' },
    { question: 'Space complexity of Segment Tree for array of size n?', options: ['O(n)', 'O(2n)', 'O(4n)', 'O(n log n)'], correctAnswer: 2, explanation: 'Segment tree requires approximately 4n space.', difficulty: 'hard' },
    { question: 'Update time in Fenwick Tree?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], correctAnswer: 1, explanation: 'Point update in Fenwick Tree: O(log n).', difficulty: 'medium' }
  ],
  'Disjoint Set Union (Union Find)': [
    { question: 'What is DSU used for?', options: ['Sorting', 'Managing connected components', 'String matching', 'Heap operations'], correctAnswer: 1, explanation: 'DSU manages connected components with union and find.', difficulty: 'medium' },
    { question: 'Two main DSU operations?', options: ['Push/Pop', 'Union and Find', 'Insert/Delete', 'Enqueue/Dequeue'], correctAnswer: 1, explanation: 'Union merges sets; Find determines which set an element belongs to.', difficulty: 'easy' },
    { question: 'What makes Find nearly O(1)?', options: ['Sorting', 'Path Compression', 'Binary Search', 'Hashing'], correctAnswer: 1, explanation: 'Path compression flattens tree during Find for faster operations.', difficulty: 'medium' },
    { question: 'What is Union by Rank?', options: ['Random union', 'Attach smaller tree under larger', 'Sort before union', 'Always attach left'], correctAnswer: 1, explanation: 'Attach shorter tree under taller to keep height minimal.', difficulty: 'medium' },
    { question: 'How does DSU detect cycles in undirected graph?', options: ['DFS', 'If two nodes have same parent before union → cycle', 'BFS', 'Sorting'], correctAnswer: 1, explanation: 'If both endpoints of edge are in same set, adding edge creates cycle.', difficulty: 'medium' },
    { question: 'Amortized time of DSU with both optimizations?', options: ['O(n)', 'O(log n)', 'O(α(n)) ≈ O(1)', 'O(n²)'], correctAnswer: 2, explanation: 'With path compression + union by rank: nearly O(1) amortized.', difficulty: 'hard' },
    { question: 'DSU is used in which MST algorithm?', options: ['Dijkstra', 'Prim', 'Kruskal', 'Floyd-Warshall'], correctAnswer: 2, explanation: 'Kruskal uses DSU to check if adding edge creates cycle.', difficulty: 'medium' }
  ],
  'Interview Patterns': [
    { question: 'Two Pointer technique reduces what?', options: ['Space', 'Nested loops from O(n²) to O(n)', 'Recursion depth', 'Memory usage'], correctAnswer: 1, explanation: 'Two pointers scan array efficiently, reducing O(n²) to O(n).', difficulty: 'easy' },
    { question: 'Sliding Window is useful for?', options: ['Sorting', 'Subarray/substring problems', 'Graph traversal', 'Tree operations'], correctAnswer: 1, explanation: 'Sliding window processes subarrays/substrings by maintaining moving window.', difficulty: 'easy' },
    { question: 'Time complexity of sliding window?', options: ['O(n²)', 'O(n)', 'O(n log n)', 'O(log n)'], correctAnswer: 1, explanation: 'Sliding window processes each element at most twice: O(n).', difficulty: 'easy' },
    { question: 'When to use two pointers vs sliding window?', options: ['Same thing', 'Two pointers for sorted arrays, sliding window for subarrays', 'Random choice', 'Depends on language'], correctAnswer: 1, explanation: 'Two pointers for sorted pair problems; sliding window for contiguous subarray problems.', difficulty: 'medium' },
    { question: 'What is the prefix sum technique?', options: ['Sorting', 'Precompute cumulative sums for O(1) range queries', 'Graph traversal', 'Recursion'], correctAnswer: 1, explanation: 'Prefix sum array allows O(1) range sum queries after O(n) preprocessing.', difficulty: 'medium' },
    { question: 'Binary search can be applied when?', options: ['Always', 'Search space has monotonic property', 'Only on arrays', 'Only on numbers'], correctAnswer: 1, explanation: 'Binary search works when search space has monotonic (sorted) property.', difficulty: 'medium' },
    { question: 'What is the meet-in-the-middle technique?', options: ['Two pointers', 'Split problem in half, solve each, combine', 'Divide and conquer', 'Greedy approach'], correctAnswer: 1, explanation: 'Split input in half, solve each part, combine results to reduce complexity.', difficulty: 'hard' }
  ],
  'Advanced Dynamic Programming': [
    { question: 'LIS (Longest Increasing Subsequence) DP complexity?', options: ['O(n)', 'O(n²)', 'O(n log n)', 'Both O(n²) and O(n log n) approaches exist'], correctAnswer: 3, explanation: 'LIS can be solved in O(n²) with DP or O(n log n) with binary search.', difficulty: 'medium' },
    { question: 'LCS (Longest Common Subsequence) time complexity?', options: ['O(n)', 'O(n²)', 'O(m * n)', 'O(2^n)'], correctAnswer: 2, explanation: 'LCS uses 2D table of size m × n.', difficulty: 'medium' },
    { question: '0/1 Knapsack: each item can be chosen how many times?', options: ['Unlimited', 'Exactly once', 'Twice', 'Depends'], correctAnswer: 1, explanation: 'In 0/1 Knapsack, each item can be chosen at most once.', difficulty: 'easy' },
    { question: 'What is the state in Minimum Path Sum grid DP?', options: ['dp[i] = min cost to reach i', 'dp[i][j] = min cost to reach cell (i,j)', 'dp[i] = max value', 'dp[i][j] = count of paths'], correctAnswer: 1, explanation: 'dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1]).', difficulty: 'medium' },
    { question: 'Unique Paths with Obstacles: blocked cell dp value?', options: ['1', '0', '-1', 'infinity'], correctAnswer: 1, explanation: 'Blocked cells have dp value 0 (no paths through them).', difficulty: 'medium' },
    { question: 'What is space optimization in DP?', options: ['Using less code', 'Reducing 2D table to 1D when only previous row needed', 'Removing base cases', 'Using recursion'], correctAnswer: 1, explanation: 'When dp[i] only depends on dp[i-1], use 1D array instead of 2D.', difficulty: 'hard' },
    { question: 'Frog Jump with K distance: time complexity?', options: ['O(n)', 'O(n*K)', 'O(n²)', 'O(K)'], correctAnswer: 1, explanation: 'For each position, check K previous positions: O(n*K).', difficulty: 'medium' }
  ],
  'String Algorithms (Advanced)': [
    { question: 'Naive pattern matching time complexity?', options: ['O(n)', 'O(n*m)', 'O(n+m)', 'O(log n)'], correctAnswer: 1, explanation: 'Naive checks pattern at every position: O(n*m).', difficulty: 'easy' },
    { question: 'KMP algorithm time complexity?', options: ['O(n*m)', 'O(n+m)', 'O(n²)', 'O(m²)'], correctAnswer: 1, explanation: 'KMP uses LPS array for O(n+m) pattern matching.', difficulty: 'medium' },
    { question: 'What is the LPS array in KMP?', options: ['Longest Prefix Suffix', 'Least Prime Sum', 'Linear Pattern Search', 'Last Position Search'], correctAnswer: 0, explanation: 'LPS = Longest Prefix which is also a Suffix, used to skip comparisons.', difficulty: 'medium' },
    { question: 'Rabin-Karp uses which technique?', options: ['Two pointers', 'Rolling hash', 'Binary search', 'Recursion'], correctAnswer: 1, explanation: 'Rabin-Karp uses rolling hash to compare pattern with text substrings.', difficulty: 'medium' },
    { question: 'Rabin-Karp average time complexity?', options: ['O(n*m)', 'O(n+m)', 'O(n²)', 'O(log n)'], correctAnswer: 1, explanation: 'Average O(n+m) with good hash function; worst O(n*m) with collisions.', difficulty: 'medium' },
    { question: 'Why is KMP better than naive approach?', options: ['Uses less memory', 'No backtracking in text, uses LPS to skip', 'Simpler code', 'Works on unsorted'], correctAnswer: 1, explanation: 'KMP never backtracks in text; LPS array tells where to resume matching.', difficulty: 'hard' },
    { question: 'What problem does Rabin-Karp handle with collisions?', options: ['Ignores them', 'Verifies match character by character', 'Uses different hash', 'Skips pattern'], correctAnswer: 1, explanation: 'On hash match, Rabin-Karp verifies by comparing characters to handle collisions.', difficulty: 'hard' }
  ]
};

// DSA Topic aliases for matching (maps common names to exact topic keys)
const TOPIC_ALIASES: Record<string, string> = {
  'complexity': 'Time & Space Complexity', 'big o': 'Time & Space Complexity', 'time complexity': 'Time & Space Complexity', 'space complexity': 'Time & Space Complexity',
  'array': 'Arrays (1D & 2D)', 'arrays': 'Arrays (1D & 2D)', '1d array': 'Arrays (1D & 2D)', '2d array': 'Arrays (1D & 2D)', 'subarray': 'Arrays (1D & 2D)',
  'string': 'Strings', 'strings': 'Strings', 'palindrome': 'Strings', 'anagram': 'Strings',
  'binary search': 'Binary Search', 'bs': 'Binary Search', 'rotated sorted': 'Binary Search',
  'recursion': 'Recursion & Backtracking', 'backtracking': 'Recursion & Backtracking', 'recursive': 'Recursion & Backtracking', 'subsequence': 'Recursion & Backtracking',
  'stack': 'Stack', 'stacks': 'Stack', 'monotonic stack': 'Stack', 'parentheses': 'Stack',
  'queue': 'Queue', 'queues': 'Queue', 'circular queue': 'Queue', 'deque': 'Queue',
  'linked list': 'Linked List', 'linkedlist': 'Linked List', 'singly linked': 'Linked List', 'doubly linked': 'Linked List',
  'binary tree': 'Trees (Binary Tree)', 'tree': 'Trees (Binary Tree)', 'trees': 'Trees (Binary Tree)', 'traversal': 'Trees (Binary Tree)', 'inorder': 'Trees (Binary Tree)', 'preorder': 'Trees (Binary Tree)', 'postorder': 'Trees (Binary Tree)',
  'bst': 'Binary Search Tree (BST)', 'binary search tree': 'Binary Search Tree (BST)', 'avl': 'Binary Search Tree (BST)',
  'heap': 'Heap & Priority Queue', 'heaps': 'Heap & Priority Queue', 'priority queue': 'Heap & Priority Queue', 'min heap': 'Heap & Priority Queue', 'max heap': 'Heap & Priority Queue',
  'hash': 'Hashing', 'hashing': 'Hashing', 'hashmap': 'Hashing', 'hash map': 'Hashing', 'hash table': 'Hashing', 'two sum': 'Hashing', 'frequency': 'Hashing',
  'graph': 'Graphs', 'graphs': 'Graphs', 'bfs': 'Graphs', 'dfs': 'Graphs', 'adjacency': 'Graphs',
  'dp': 'Dynamic Programming (DP)', 'dynamic programming': 'Dynamic Programming (DP)', 'memoization': 'Dynamic Programming (DP)', 'tabulation': 'Dynamic Programming (DP)', 'knapsack': 'Dynamic Programming (DP)', 'climbing stairs': 'Dynamic Programming (DP)',
  'greedy': 'Greedy Algorithms', 'greedy algorithm': 'Greedy Algorithms', 'activity selection': 'Greedy Algorithms',
  'bit': 'Bit Manipulation', 'bits': 'Bit Manipulation', 'bit manipulation': 'Bit Manipulation', 'xor': 'Bit Manipulation', 'bitwise': 'Bit Manipulation',
  'sorting': 'Sorting Algorithms', 'sort': 'Sorting Algorithms', 'bubble sort': 'Sorting Algorithms', 'merge sort': 'Sorting Algorithms', 'quick sort': 'Sorting Algorithms', 'insertion sort': 'Sorting Algorithms', 'selection sort': 'Sorting Algorithms',
  'dijkstra': 'Advanced Graph Algorithms', 'topological': 'Advanced Graph Algorithms', 'topological sort': 'Advanced Graph Algorithms', 'cycle detection': 'Advanced Graph Algorithms', 'shortest path': 'Advanced Graph Algorithms',
  'trie': 'Trie (Prefix Tree)', 'prefix tree': 'Trie (Prefix Tree)', 'autocomplete': 'Trie (Prefix Tree)',
  'segment tree': 'Segment Tree & Fenwick Tree', 'fenwick': 'Segment Tree & Fenwick Tree', 'bit tree': 'Segment Tree & Fenwick Tree', 'range query': 'Segment Tree & Fenwick Tree',
  'dsu': 'Disjoint Set Union (Union Find)', 'union find': 'Disjoint Set Union (Union Find)', 'disjoint set': 'Disjoint Set Union (Union Find)', 'kruskal': 'Disjoint Set Union (Union Find)',
  'two pointer': 'Interview Patterns', 'sliding window': 'Interview Patterns', 'prefix sum': 'Interview Patterns', 'interview': 'Interview Patterns',
  'lis': 'Advanced Dynamic Programming', 'lcs': 'Advanced Dynamic Programming', 'longest increasing': 'Advanced Dynamic Programming', 'longest common': 'Advanced Dynamic Programming', 'grid dp': 'Advanced Dynamic Programming',
  'kmp': 'String Algorithms (Advanced)', 'rabin karp': 'String Algorithms (Advanced)', 'pattern matching': 'String Algorithms (Advanced)', 'string algorithm': 'String Algorithms (Advanced)',
  'dsa': 'Arrays (1D & 2D)', 'data structures': 'Arrays (1D & 2D)', 'algorithms': 'Sorting Algorithms',
};

function findMatchingTopic(searchTopic: string): string | null {
  const normalizedSearch = searchTopic.toLowerCase().trim();
  for (const topic of Object.keys(QUIZ_QUESTIONS)) {
    if (topic.toLowerCase() === normalizedSearch) return topic;
  }
  if (TOPIC_ALIASES[normalizedSearch]) return TOPIC_ALIASES[normalizedSearch];
  for (const topic of Object.keys(QUIZ_QUESTIONS)) {
    if (topic.toLowerCase().includes(normalizedSearch) || normalizedSearch.includes(topic.toLowerCase())) return topic;
  }
  for (const [alias, targetTopic] of Object.entries(TOPIC_ALIASES)) {
    if (normalizedSearch.includes(alias)) return targetTopic;
  }
  return null;
}

export function getQuizQuestions(topic: string, count: number = 5): QuizQuestion[] {
  const matchedTopic = findMatchingTopic(topic);
  const topicQuestions = matchedTopic ? QUIZ_QUESTIONS[matchedTopic] : [];
  if (topicQuestions.length === 0) {
    console.log(`[Quiz] No questions for: "${topic}", using defaults`);
    return getDefaultQuestions(count);
  }
  console.log(`[Quiz] Found ${topicQuestions.length} questions for: "${matchedTopic}"`);
  const shuffled = [...topicQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function getDefaultQuestions(count: number): QuizQuestion[] {
  const all = Object.values(QUIZ_QUESTIONS).flat();
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function getAvailableTopics(): string[] {
  return Object.keys(QUIZ_QUESTIONS).filter(t => t !== 'PLACEHOLDER');
}

export function getQuestionCountForTopic(topic: string): number {
  const matched = findMatchingTopic(topic);
  return matched ? (QUIZ_QUESTIONS[matched]?.length || 0) : 0;
}

export function hasQuestionsForTopic(topic: string): boolean {
  const matched = findMatchingTopic(topic);
  return matched ? (QUIZ_QUESTIONS[matched]?.length > 0) : false;
}
